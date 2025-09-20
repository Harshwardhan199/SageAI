import React, { forwardRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import JSON5 from "json5";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { toast } from "react-toastify";

import api from "../api/axios";

import { useAuth } from "../context/AuthContext";
import { config } from "../config";

const Message = forwardRef(({ sender, text, style, loadSavedPrompts }, ref) => {

  const { user } = useAuth();

  const isUser = sender === "user";

  const [quizStates, setQuizStates] = useState({});

  const [feedbackLoading, setFeedbackLoading] = useState(false);

const cleanText = (s) => s.replace(/```[a-z]*\n?/gi, "").replace(/`([^`]+)`/g, "$1").trim();

  // Split into text/code blocks
  const parseBlocks = (text) => {
    const blocks = [];
    if (!isUser) {
      const blockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = blockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          blocks.push({
            type: "text",
            content: text.slice(lastIndex, match.index),
          });
        }

        if (match[1] === "json") {
          blocks.push({
            type: "quiz",
            content: match[2],
          });
        }
        else {
          blocks.push({
            type: "code",
            language: match[1] || "python",
            content: match[2],
          });
        }

        lastIndex = blockRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        blocks.push({ type: "text", content: text.slice(lastIndex) });
      }
    }

    return blocks;
  };

  // State updaters
  const handleOptionChange = (quizKey, option) => {
    setQuizStates((prev) => ({
      ...prev,
      [quizKey]: {
        ...prev[quizKey],
        selectedOption: option,
      },
    }));
  };

  const handleClear = (quizKey) => {
    setQuizStates((prev) => ({
      ...prev,
      [quizKey]: { selectedOption: "", answered: false, feedback: "" },
    }));
  };

  //Save Prompt
  const SavePrompt = async (text) => {
    try {
      await api.post("/user/savePrompt", { text }, { withCredentials: true });
      toast.success("Prompt saved!");
    } catch (error) {
      console.error("Error Saving Prompt:", error);
    }

    loadSavedPrompts();
  };

  const escapeMarkdown = (text) => {
    return text
      .replace(/([\\`*_\[\]{}()>#+-.!])/g, "\\$1")
      .replace(/"/g, '\\"'); // escape double quotes if needed
  };


  const blocks = parseBlocks(text);
  //console.log("blocks: ", blocks);

  return (
    <div
      ref={ref}
      className={`w-full flex gap-1 ${isUser ? "flex-col justify-end group" : "justify-start"}`}
    >
      <div className={`py-2 rounded-2xl shadow ${isUser ? "self-end max-w-full px-4 bg-[#1f1f1f] text-white group" : "w-full text-white"}`} style={style}>
        {isUser ? text :
          blocks.map((block, i) => {

            if (block.type === "code") {
              return (
                <div
                  key={i}
                  className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto"
                >
                  <SyntaxHighlighter
                    style={oneDark}
                    language={block.language || "python"}
                    PreTag="div"
                    showLineNumbers={true}
                  >
                    {block.content.trim()}
                  </SyntaxHighlighter>
                </div>
              );
            }

            else if (block.type === "quiz") {
              const quizData = JSON.parse(block.content);
              //console.log("Quizzes: ", quizData);

              return (
                <div key={i} className="flex flex-col gap-4 mb-2">
                  {quizData.map((quiz, iqt) => {
                    const quizKey = `quiz-${i}-${iqt}`;
                    const state =
                      quizStates[quizKey] || {
                        selectedOption: "",
                        answered: false,
                        feedback: "",
                      };

                    const handleSubmit = async () => {
                      if (!state.selectedOption) return;

                      setQuizStates((prev) => ({
                        ...prev,
                        [quizKey]: {
                          ...prev[quizKey],
                          answered: true,
                          feedback:
                            state.selectedOption === quiz.answer
                              ? "Correct!"
                              : `Wrong Answer.\n\n${quiz.answer}`,
                        },
                      }));

                      let explaination = "";
                      if (state.selectedOption != quiz.answer) {

                        const prompt = `
                          Question: ${quiz.question},
                          Options: ${quiz.options},
                          Correct answer: ${quiz.answer}, 
                          User's Answer: ${state.selectedOption}`

                        let promptRes;
                        setFeedbackLoading(true);
                        if (user) {
                          promptRes = await api.post("/user/feedback", { prompt }, { withCredentials: true });
                        }
                        else {
                          promptRes = await axios.post(`${config.BACKEND_URL}/api/temp/feedback`, { prompt });
                        }
                        setFeedbackLoading(false);
                        const resData = promptRes.data.llmResponse || "";

                        explaination = resData;
                      }

                      setQuizStates((prev) => ({
                        ...prev,
                        [quizKey]: {
                          ...prev[quizKey],
                          answered: true,
                          feedback:
                            state.selectedOption === quiz.answer
                              ? "Correct!"
                              : `Wrong Answer.\n\n${quiz.answer}\n\n${explaination}`,
                        },
                      }));

                    };

                    return (
                      <div key={iqt} className="flex flex-col gap-1 rounded-xl bg-[#151515] p-4">

                        {/* Question */}
                        <div className="py-2 text-[18px] font-medium">
                          <ReactMarkdown>{`Q${iqt+1}. ${quiz.question}`}</ReactMarkdown>
                        </div>

                        {quiz.code != undefined &&
                          <div className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto">
                            <SyntaxHighlighter
                              style={oneDark}
                              language={block.language || "python"}
                              PreTag="div"
                              showLineNumbers={true}
                            >
                              {quiz.code}
                            </SyntaxHighlighter>
                          </div>

                        }

                        {/* Options */}
                        {quiz.options.map((option, io) => {
                          // Determine option styling after answered
                          let optionClass = "bg-[#151515]";
                          let borderClass = "";

                          if (state.answered) {
                            if (option === quiz.answer) {
                              borderClass = "border-1 border-[#006610]";
                            } else if (option === state.selectedOption) {
                              borderClass = "border-1 border-[#600000]";
                            }
                          } else if (state.selectedOption === option) {
                            borderClass = "border-1 border-[#404040]";
                          }

                          return (
                            <label
                              key={io}
                              className={`flex gap-2 p-2 rounded-sm ${optionClass} border-1 border-[#1c1c1c] ${borderClass}`}
                            >
                              <input
                                type="radio"
                                name={`quiz-${i}-${iqt}`}
                                value={option}
                                checked={state.selectedOption === option}
                                onChange={() => {
                                  if (!state.answered) handleOptionChange(quizKey, option);
                                }}
                              />
                              <ReactMarkdown>{option}</ReactMarkdown>
                            </label>
                          );
                        })}

                        {/* Actions */}
                        {!state.answered ? (
                          <div className="flex gap-3 pt-4 border-t border-gray-700/50">

                            <button className="flex-1 px-6 py-2 rounded-xl bg-[#155dfc] hover:bg-[#134bc4] text-white font-medium transition-colors duration-200" onClick={handleSubmit} >
                              Submit Answer
                            </button>

                            <button className="w-[30%] px-6 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200 shadow-lg" onClick={() => handleClear(quizKey)}>
                              Clear Response
                            </button>

                          </div>
                        ) : (
                          <div className="font-medium mt-2 p-2 rounded-lg bg-[#2c2c2c]">
                            {state.selectedOption === quiz.answer ? (
                              <span>{state.feedback}</span>
                            ) : (
                              (() => {
                                const parts = state.feedback.split("\n\n");
                                const main = parts[0] || "";
                                const mid = parts[1] || "";
                                const rest = parts[2] || "";

                                //console.log("Feedback: ", parts);

                                return (
                                  <div>

                                    <div className="mb-1">{main}</div>
                                    <div className="mb-1">Correct: <span className="font-normal">{mid}</span></div>

                                    <div className="mb-1 text-[17px]">Explaination{feedbackLoading ? "..." : ":"}</div>
                                    {rest != "" && <div className="font-normal"><ReactMarkdown>{rest}</ReactMarkdown></div>}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            else if (block.type === "text") {

              const jsonRegex = /\[(?:\s*\{[\s\S]*?\}\s*,?)*\s*\]/m;
              const match = block.content.match(jsonRegex);

              //console.log(match[0]);

              if (match) {
                let parsedQuiz = null;
                try {
                  //console.log("Ab hogi parsing");

                  const maybeJson = JSON5.parse(match[0].replace(/`/g, ""));

                  if (
                    Array.isArray(maybeJson) &&
                    maybeJson.length > 0 &&
                    maybeJson[0].question &&
                    maybeJson[0].options &&
                    maybeJson[0].answer
                  ) {
                    parsedQuiz = maybeJson;
                  }
                } catch (err) {
                  console.error("JSON.parse failed:", err, match[0]);
                }

                if (parsedQuiz) {
                  const before = block.content.slice(0, match.index).trim();
                  const after = block.content.slice(match.index + match[0].length).trim();

                  // Reuse the same quiz rendering logic
                  return (
                    <div key={i} className="flex flex-col gap-4">

                      {before && (
                        <div className="markdown">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {cleanText(before)}
                          </ReactMarkdown>
                        </div>
                      )}

                      {parsedQuiz.map((quiz, iqt) => {
                        const quizKey = `quiz-text-${i}-${iqt}`;
                        const state =
                          quizStates[quizKey] || {
                            selectedOption: "",
                            answered: false,
                            feedback: "",
                          };

                        const handleSubmit = async () => {
                          if (!state.selectedOption) return;

                          setQuizStates((prev) => ({
                            ...prev,
                            [quizKey]: {
                              ...prev[quizKey],
                              answered: true,
                              feedback:
                                state.selectedOption === quiz.answer
                                  ? "Correct!"
                                  : `Wrong Answer.\n\n${quiz.answer}`,
                            },
                          }));

                          let explaination = "";
                          if (state.selectedOption != quiz.answer) {
                            const prompt = `
                                Question: ${quiz.question},
                                Options: ${quiz.options},
                                Correct answer: ${quiz.answer}, 
                                User's Answer: ${state.selectedOption}`;

                            setFeedbackLoading(true);
                            let promptRes;
                            if (user) {
                              promptRes = await api.post(
                                "/user/feedback",
                                { prompt },
                                { withCredentials: true }
                              );
                            } else {
                              promptRes = await axios.post(
                                `${config.BACKEND_URL}/api/temp/feedback`,
                                { prompt }
                              );
                            }
                            setFeedbackLoading(false);
                            explaination = promptRes.data.llmResponse || "";
                          }

                          setQuizStates((prev) => ({
                            ...prev,
                            [quizKey]: {
                              ...prev[quizKey],
                              answered: true,
                              feedback:
                                state.selectedOption === quiz.answer
                                  ? "Correct!"
                                  : `Wrong Answer.\n\n${quiz.answer}\n\n${explaination}`,
                            },
                          }));
                        };

                        return (
                          <div
                            key={iqt}
                            className="flex flex-col gap-1 rounded-xl bg-[#151515] p-4"
                          >
                            {/* Question */}
                            <div className="py-2 text-[18px] font-medium">
                              <ReactMarkdown>{`Q${iqt+1}. ${quiz.question}`}</ReactMarkdown>
                            </div>

                            {/* Options */}
                            {quiz.options.map((option, io) => {
                              let borderClass = "";
                              if (state.answered) {
                                if (option === quiz.answer) {
                                  borderClass = "border-1 border-[#006610]";
                                } else if (option === state.selectedOption) {
                                  borderClass = "border-1 border-[#600000]";
                                }
                              } else if (state.selectedOption === option) {
                                borderClass = "border-1 border-[#404040]";
                              }

                              return (
                                <label
                                  key={io}
                                  className={`flex gap-2 p-2 rounded-sm border-1 border-[#1c1c1c] ${borderClass}`}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz-${i}-${iqt}`}
                                    value={option}
                                    checked={state.selectedOption === option}
                                    onChange={() => {
                                      if (!state.answered)
                                        handleOptionChange(quizKey, option);
                                    }}
                                  />
                                  <ReactMarkdown>{escapeMarkdown(option)}</ReactMarkdown>

                                </label>
                              );
                            })}

                            {/* Actions */}
                            {!state.answered ? (
                              <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                                <button
                                  className="flex-1 px-6 py-2 rounded-xl bg-[#155dfc] hover:bg-[#134bc4] text-white font-medium transition-colors duration-200"
                                  onClick={handleSubmit}
                                >
                                  Submit Answer
                                </button>

                                <button
                                  className="w-[30%] px-6 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200 shadow-lg"
                                  onClick={() => handleClear(quizKey)}
                                >
                                  Clear Response
                                </button>
                              </div>
                            ) : (
                              <div className="font-medium mt-2 p-2 rounded-lg bg-[#2c2c2c]">
                                {state.selectedOption === quiz.answer ? (
                                  <span>{state.feedback}</span>
                                ) : (
                                  (() => {
                                    const parts = state.feedback.split("\n\n");
                                    const main = parts[0] || "";
                                    const mid = parts[1] || "";
                                    const rest = parts[2] || "";

                                    //console.log("Feedback: ", parts);

                                    return (
                                      <div>

                                        <div className="mb-1">{main}</div>
                                        <div className="mb-1">Correct: <span className="font-normal">{mid}</span></div>

                                        <div className="mb-1 text-[17px]">Explaination{feedbackLoading ? "..." : ":"}</div>
                                        {rest != "" && <div className="font-normal"><ReactMarkdown>{rest}</ReactMarkdown></div>}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {after && (
                        <div className="markdown">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {cleanText(after)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={i} className="markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {cleanText(block.content)}
                    </ReactMarkdown>
                  </div>
                );

              }

              return (
                <div key={i} className="markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {cleanText(block.content)}
                  </ReactMarkdown>
                </div>
              );

            }

          })
        }

      </div>

      {isUser && (
        <div>
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100  transition-all duration-250">
            {/* Copy button */}
            <div
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f1f1f] cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("Copied!");
              }}
            >
              <img
                src="https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff"
                alt="Copy"
                className="w-4 h-4"
              />
            </div>

            {/* Save button */}
            {user && (
              <div
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f1f1f] cursor-pointer"
                onClick={() => SavePrompt(text)}
              >
                <img
                  src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=ffffff"
                  alt="Saved prompts"
                  className="w-4 h-4"
                />
              </div>
            )}
          </div>
        </div>
      )
      }

    </div>
  );
});

export default Message;
