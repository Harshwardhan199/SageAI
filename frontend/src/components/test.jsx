// import React, { forwardRef } from "react";

// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";

// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// const Message = forwardRef(({ sender, text, style }, ref) => {
//   const isUser = sender === "user";

//   const parts = [];
//   if (!isUser) {
//     const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
//     let lastIndex = 0;
//     let match;

//     while ((match = codeBlockRegex.exec(text)) !== null) {
//       if (match.index > lastIndex) {
//         parts.push({
//           type: "text",
//           content: text.slice(lastIndex, match.index),
//         });
//       }

//       parts.push({
//         type: "code",
//         language: match[1] || "python",
//         content: match[2],
//       });

//       lastIndex = codeBlockRegex.lastIndex;
//     }

//     if (lastIndex < text.length) {
//       parts.push({ type: "text", content: text.slice(lastIndex) });
//     }
//   }

//   const cleanText = (s) => s.replace(/`([^`]+)`/g, "$1");

//   return (
//     <div
//       ref={ref}
//       className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
//     >
//       <div
//         className={`py-2 rounded-2xl shadow max-w-full ${
//           isUser ? "px-4 bg-[#1f1f1f] text-white" : "text-white"
//         }`}
//         style={style}
//       >
//         {isUser
//           ? text
//           : parts.map((part, i) =>
//               part.type === "code" ? (
//                 <div
//                   key={i}
//                   className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto"
//                 >
//                   <SyntaxHighlighter
//                     style={oneDark}
//                     language={"python"}
//                     PreTag="div"
//                     showLineNumbers={true}
//                   >
//                     {part.content.trim()}
//                   </SyntaxHighlighter>
//                 </div>
//               ) : (
//                 <div key={i} className="markdown">
//                   <ReactMarkdown
//                     remarkPlugins={[remarkGfm]}
//                     rehypePlugins={[rehypeRaw]}
//                   >
//                     {cleanText(part.content)}
//                   </ReactMarkdown>
//                 </div>
//               )
//             )}
//       </div>
//     </div>
//   );
// });

// export default Message;














// import React, { forwardRef, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// const Message = forwardRef(({ sender, text, style }, ref) => {
//   const isUser = sender === "user";

//   // Split text into code blocks
//   const parts = [];
//   if (!isUser) {
//     const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
//     let lastIndex = 0;
//     let match;

//     while ((match = codeBlockRegex.exec(text)) !== null) {
//       if (match.index > lastIndex) {
//         parts.push({
//           type: "text",
//           content: text.slice(lastIndex, match.index),
//         });
//       }

//       parts.push({
//         type: "code",
//         language: match[1] || "python",
//         content: match[2],
//       });

//       lastIndex = codeBlockRegex.lastIndex;
//     }

//     if (lastIndex < text.length) {
//       parts.push({ type: "text", content: text.slice(lastIndex) });
//     }
//   }

//   const cleanText = (s) => s.replace(/`([^`]+)`/g, "$1");

//   // Detect quiz in a text block
//   const detectQuiz = (text) => {
//     // Match questions like: "1. Question text"
//     const questionRegex = /^(\d+)\.\s+(.+?)(?=\n[a-dA-D]\)|$)/gms;
//     const optionRegex = /^[a-dA-D]\)\s+(.+)$/gm;

//     const questions = [];
//     let questionMatch;

//     // Split by lines for options
//     const lines = text.split("\n");

//     let currentQuestion = null;
//     lines.forEach((line) => {
//       const qMatch = line.match(/^(\d+)\.\s+(.+)/);
//       const oMatch = line.match(/^([a-dA-D])\)\s+(.+)/);

//       if (qMatch) {
//         if (currentQuestion) questions.push(currentQuestion);
//         currentQuestion = { question: qMatch[2].trim(), options: [] };
//       } else if (oMatch && currentQuestion) {
//         currentQuestion.options.push({ label: oMatch[1], text: oMatch[2] });
//       }
//     });

//     if (currentQuestion) questions.push(currentQuestion);

//     return questions.length > 0 ? questions : null;
//   };

//   const Quiz = ({ questions }) => {
//     const [answers, setAnswers] = useState({});

//     const handleSelect = (qIndex, optionLabel) => {
//       setAnswers((prev) => ({ ...prev, [qIndex]: optionLabel }));
//     };

//     return (
//       <div className="space-y-4">
//         {questions.map((q, i) => (
//           <div key={i} className="p-2 border rounded-md bg-[#2b2b2b]">
//             <div className="font-semibold mb-2 text-white">
//               {i + 1}. {q.question}
//             </div>
//             <div className="flex flex-col space-y-1">
//               {q.options.map((opt) => (
//                 <label
//                   key={opt.label}
//                   className="flex items-center space-x-2 text-white cursor-pointer"
//                 >
//                   <input
//                     type="radio"
//                     name={`question-${i}`}
//                     value={opt.label}
//                     checked={answers[i] === opt.label}
//                     onChange={() => handleSelect(i, opt.label)}
//                     className="accent-blue-500"
//                   />
//                   <span>
//                     {opt.label}) {opt.text}
//                   </span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div
//       ref={ref}
//       className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
//     >
//       <div
//         className={`py-2 rounded-2xl shadow max-w-full ${
//           isUser ? "px-4 bg-[#1f1f1f] text-white" : "px-4 text-white"
//         }`}
//         style={style}
//       >
//         {isUser
//           ? text
//           : parts.map((part, i) => {
//               if (part.type === "code") {
//                 return (
//                   <div
//                     key={i}
//                     className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto"
//                   >
//                     <SyntaxHighlighter
//                       style={oneDark}
//                       language={part.language}
//                       PreTag="div"
//                       showLineNumbers={true}
//                     >
//                       {part.content.trim()}
//                     </SyntaxHighlighter>
//                   </div>
//                 );
//               } else {
//                 const quizData = detectQuiz(part.content);
//                 if (quizData) {
//                   return <Quiz key={i} questions={quizData} />;
//                 } else {
//                   return (
//                     <div key={i} className="markdown">
//                       <ReactMarkdown
//                         remarkPlugins={[remarkGfm]}
//                         rehypePlugins={[rehypeRaw]}
//                       >
//                         {cleanText(part.content)}
//                       </ReactMarkdown>
//                     </div>
//                   );
//                 }
//               }
//             })}
//       </div>
//     </div>
//   );
// });

// export default Message;














import React, { forwardRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const Message = forwardRef(({ sender, text, style }, ref) => {
  const isUser = sender === "user";

  const parseBlocks = (text) => {
    const blocks = [];

    // Detect code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: "markdown", content: text.slice(lastIndex, match.index) });
      }
      blocks.push({ type: "code", language: match[1] || "python", content: match[2] });
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      blocks.push({ type: "markdown", content: text.slice(lastIndex) });
    }

    return blocks;
  };

  const parseQuiz = (markdown) => {
    const lines = markdown.split("\n");
    const quiz = [];
    let currentQuestion = null;
    let normalText = [];

    const flushQuestion = () => {
      if (currentQuestion) {
        quiz.push({ ...currentQuestion });
        currentQuestion = null;
      }
    };

    lines.forEach((line) => {
      const questionMatch = line.match(/^\d+\.\s+.*\?$/);
      const optionMatch = line.match(/^[a-dA-D]\)\s+(.*)$/);

      if (questionMatch) {
        flushQuestion();
        currentQuestion = { question: line, options: [] };
      } else if (optionMatch && currentQuestion) {
        currentQuestion.options.push(optionMatch[1]);
      } else if (currentQuestion) {
        // Multi-line question text
        currentQuestion.question += " " + line.trim();
      } else {
        normalText.push(line);
      }
    });
    flushQuestion();

    return { quiz, normalText: normalText.join("\n") };
  };

  const blocks = parseBlocks(text);

  return (
    <div
      ref={ref}
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`py-2 rounded-2xl shadow max-w-full ${
          isUser ? "px-4 bg-[#1f1f1f] text-white" : "text-white px-4 bg-[#2a2a2a]"
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
                      language={block.language}
                      PreTag="div"
                      showLineNumbers
                    >
                      {block.content.trim()}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              if (block.type === "markdown") {
                // Detect quiz inside markdown
                const { quiz, normalText } = parseQuiz(block.content);

                if (quiz.length > 0) {
                  return (
                    <div key={i}>
                      {normalText && (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {normalText}
                        </ReactMarkdown>
                      )}
                      {quiz.map((q, qi) => (
                        <Quiz key={qi} question={q} />
                      ))}
                    </div>
                  );
                }

                return (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {block.content}
                  </ReactMarkdown>
                );
              }

              return null;
            })}
      </div>
    </div>
  );
});

// Quiz Component
const Quiz = ({ question }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="my-2 p-2 border rounded-md bg-[#1f1f1f]">
      <div className="font-semibold mb-1">{question.question}</div>
      {question.options.map((opt, i) => (
        <label key={i} className="block cursor-pointer my-1">
          <input
            type="radio"
            name={question.question}
            value={opt}
            checked={selected === opt}
            onChange={() => setSelected(opt)}
            className="mr-2"
          />
          {opt}
        </label>
      ))}
    </div>
  );
};

export default Message;


          // if (block.type === "text") {

          //   const quiz_texts = parseQuiz(block.content);

          //   return (
          //     <div key={i} className="flex flex-col gap-1">
          //       {quiz_texts.map((quiz_text, iqt) => {

          //         //Nornal Text
          //         if (quiz_text.type === "text") {
          //           return (
          //             <div key={iqt} className="markdown">
          //               <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          //                 {cleanText(quiz_text.content)}
          //               </ReactMarkdown>
          //             </div>
          //           );
          //         }

          //         // Quiz
          //         if (quiz_text.type === "quiz") {

          //           const state = quizStates[iqt] || { selectedOption: "", answered: false, feedback: "" };

          //           return (
          //             <div key={iqt} className="flex flex-col rounded-xl bg-[#151515] p-4">

          //               {/* Question */}
          //               <div className="py-2 text-[18px]">
          //                 <ReactMarkdown>{quiz_text.content.question}</ReactMarkdown>
          //               </div>

          //               {/* Option */}
          //               {quiz_text.content.options.map((option, io) => (
          //                 <label key={io} className={`flex gap-2 p-2 rounded-sm ${state.selectedOption === option ? "bg-[#1c1c1c] border border-[#1e1e1e]" : "bg-[#151515]"}`}>
          //                   <input type="radio" name={`quiz-${iqt}`} value={option} checked={state.selectedOption === option} onChange={() => handleOptionChange(iqt, option)} disabled={state.answered && !(state.selectedOption === option)} />
          //                   <ReactMarkdown>{option}</ReactMarkdown>
          //                 </label>
          //               ))}

          //               {/* Actions visible only if not answered*/}
          //               {!state.answered ? (
          //                 <div className="flex gap-3 pt-4 border-t border-gray-700/50">
          //                   <button className="flex-1 px-6 py-2 rounded-xl bg-[#155dfc] hover:bg-[#134bc4] text-white font-medium transition-colors duration-200" onClick={() => handleSubmit(iqt)}>
          //                     Submit Answer
          //                   </button>
          //                   <button className="px-6 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200 shadow-lg" onClick={() => handleClear(iqt)}>
          //                     Clear Response
          //                   </button>
          //                 </div>
          //               ) : (<div>{state.feedback}</div>)}

          //             </div>
          //           );
          //         }

          //       }
          //       )}
          //     </div>

          //   );
          // }