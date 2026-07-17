import { parseBlocks } from "./utils/parseBlocks";

import CodeBlock from "./CodeBlock";
import QuizBlock from "./QuizBlock";
import MarkdownBlock from "./MarkdownBlock";
import useTheme from "../../../hooks/useTheme";
import UserImageAttachment from "../../common/UserImageAttachment";

const MessageBody = ({ message, isUser, onImagePreview }) => {
  const { blocks } = message;
  const { enableMarkdown, animateAI } = useTheme();

  if (!blocks || !Array.isArray(blocks)) {
    return null;
  }

  const assistantImagePart = message.parts && message.parts.find(p => p.type === "image");

  return (
    <div className="flex flex-col gap-2 max-w-full">
      {assistantImagePart && (
        <div
          className="self-start w-fit bg-transparent border border-default dark:border-zinc-800 p-1.5 shadow-sm rounded-xl cursor-pointer hover:brightness-95 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 flex items-center justify-center flex-shrink-0"
          onClick={() => onImagePreview && onImagePreview(assistantImagePart.url)}
        >
          <UserImageAttachment
            src={assistantImagePart.url}
            onClick={() => onImagePreview && onImagePreview(assistantImagePart.url)}
          />
        </div>
      )}
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
    </div>
  );
};

export default MessageBody;
