import { parseBlocks } from "./utils/parseBlocks";

import CodeBlock from "./CodeBlock";
import QuizBlock from "./QuizBlock";
import MarkdownBlock from "./MarkdownBlock";
import useTheme from "../../../hooks/useTheme";

const MessageBody = ({ message, isUser }) => {
  const { blocks } = message;
  const { enableMarkdown, animateAI } = useTheme();

  if (isUser) {
    return blocks && blocks.length > 0 ? blocks[0].content : "";
  }

  if (!blocks || !Array.isArray(blocks)) {
    return null;
  }

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "chat": {
            const rawBlocks = parseBlocks(block.content || "", isUser);
            const chatBlocks = rawBlocks.map(b => {
              if (b.type === "quiz") {
                return {
                  type: "code",
                  language: "json",
                  content: b.content
                };
              }
              return b;
            });
            return (
              <div
                key={index}
                className={`chat-block mb-4 last:mb-0 ${
                  animateAI ? "animate-[fadeIn_0.3s_ease-out_forwards]" : ""
                }`}
              >
                {chatBlocks.map((b, idx) => {
                  if (b.type === "code") {
                    return (
                      <CodeBlock
                        key={idx}
                        language={b.language}
                        code={b.content}
                      />
                    );
                  } else if (b.type === "text") {
                    return enableMarkdown ? (
                      <MarkdownBlock key={idx} content={b.content} />
                    ) : (
                      <div key={idx} className="whitespace-pre-wrap text-sm leading-relaxed text-primary">
                        {b.content}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            );
          }

          case "quiz": {
            const sourceData = block.questions;
            const quizData = Array.isArray(sourceData)
              ? sourceData
              : (typeof sourceData === "string" && sourceData.trim() !== "")
              ? JSON.parse(sourceData)
              : [];
            return (
              <div key={index} className="quiz-block mb-4 last:mb-0">
                <QuizBlock
                  title={block.title || "Quiz"}
                  quizzes={quizData}
                  language="python"
                  showCode={false}
                  className="flex flex-col gap-4 mb-2"
                />
              </div>
            );
          }

          default:
            return null; // ignore unknown block types gracefully
        }
      })}
    </>
  );
};

export default MessageBody;
