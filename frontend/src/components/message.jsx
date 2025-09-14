import React, { forwardRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import api from "../api/axios";

const Message = forwardRef(({ sender, text, style }, ref) => {
  const isUser = sender === "user";

  const [quizStates, setQuizStates] = useState({});

  const cleanText = (s) => s.replace(/`([^`]+)`/g, "$1");

  // Split into text/code blocks
  const parseBlocks = (text) => {
    const blocks = [];
    if (!isUser) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          blocks.push({
            type: "text",
            content: text.slice(lastIndex, match.index),
          });
        }

        blocks.push({
          type: "code",
          language: match[1] || "python",
          content: match[2],
        });

        lastIndex = codeBlockRegex.lastIndex;
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

  const blocks = parseBlocks(text);

  return (
    <div
      ref={ref}
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`py-2 rounded-2xl shadow ${isUser
          ? "max-w-full px-4 bg-[#1f1f1f] text-white"
          : "w-full text-white"
          }`}
        style={style}
      >
        {isUser
          ? text
          : blocks.map((block, i) => {
            if (block.type === "code") {
              return (
                <div
                  key={i}
                  className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto"
                >
                  <SyntaxHighlighter
                    style={oneDark}
                    language={"python"}
                    PreTag="div"
                    showLineNumbers={true}
                  >
                    {block.content.trim()}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (block.type === "text") {
              let quizData = null;

              try {
                // detect JSON quiz in block
                const jsonMatch = block.content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  quizData = JSON.parse(jsonMatch[0]);
                  console.log(quizData);
                  
                }
              } catch (err) {
                quizData = null;
              }

              if (quizData) {
                return (
                  <div key={i} className="flex flex-col gap-4">
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

                        let explaination = "";
                        if (state.selectedOption != quiz.answer) {

                          const prompt = `
                          Question: ${quiz.question},
                          Options: ${quiz.options},
                          Correct answer: ${quiz.answer}, 
                          User's Answer: ${state.selectedOption}`

                          const promptRes = await api.post("/user/feedback", { prompt }, { withCredentials: true });
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
                            <ReactMarkdown>{quiz.question}</ReactMarkdown>
                          </div>

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

                              <button className="px-6 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200 shadow-lg" onClick={() => handleClear(quizKey)}>
                                Clear Response
                              </button>

                            </div>
                          ) : (
                            <div className="pt-3 font-medium">
                              {state.selectedOption === quiz.answer ? (
                                <div>
                                  <span>{state.feedback}</span>
                                </div>

                              ) : (
                                () => {
                                  const parts = state.feedback.split("\n\n");
                                  const main = parts[0] || "";
                                  const mid = parts[1] || "";
                                  const rest = parts[2] || "";

                                  return (
                                    <div>
                                      {/* <div className="mb-1">{main}</div> */}
                                      {/* <div className="mb-1">Correct: <span className="font-normal">{mid}</span></div> */}

                                      <div className="mb-1 text-[17px]">Explaination:</div>
                                      <div className="font-normal"><ReactMarkdown>{rest}</ReactMarkdown></div>
                                    </div>
                                  );
                                })()
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Fallback → render as Markdown
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
          })}
      </div>
    </div>
  );
});

export default Message;
