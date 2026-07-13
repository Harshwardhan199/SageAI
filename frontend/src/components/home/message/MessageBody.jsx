import { parseBlocks } from "./utils/parseBlocks";

import CodeBlock from "./CodeBlock";
import QuizBlock from "./QuizBlock";
import MarkdownBlock from "./MarkdownBlock";

const MessageBody = ({ message, isUser }) => {
  const { type, content } = message;

  if (isUser) {
    return content;
  }

  if (type === "quiz") {
    let quizData = [];
    if (Array.isArray(content)) {
      quizData = content;
    } else if (typeof content === "string" && content.trim() !== "") {
      try {
        quizData = JSON.parse(content);
      } catch (err) {
        console.error("JSON.parse failed for quiz content:", err);
      }
    }
    return (
      <QuizBlock
        quizzes={quizData}
        language="python"
        showCode={false}
        className="flex flex-col gap-4 mb-2"
      />
    );
  }

  // Otherwise, render as "chat"
  const rawBlocks = parseBlocks(content || "", isUser);
  const blocks = rawBlocks.map(block => {
    if (block.type === "quiz") {
      return {
        type: "code",
        language: "json",
        content: block.content
      };
    }
    return block;
  });

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "code":
            return (
              <CodeBlock
                key={index}
                language={block.language}
                code={block.content}
              />
            );

          case "text":
            return <MarkdownBlock key={index} content={block.content} />;

          default:
            return null;
        }
      })}
    </>
  );
};

export default MessageBody;
