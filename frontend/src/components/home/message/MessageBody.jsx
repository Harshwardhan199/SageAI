import { parseBlocks } from "./utils/parseBlocks";
import { extractQuiz } from "./utils/quizParser";

import CodeBlock from "./CodeBlock";
import QuizBlock from "./QuizBlock";
import MarkdownBlock from "./MarkdownBlock";

const MessageBody = ({ text, isUser }) => {
  if (isUser) {
    return text;
  }

  const blocks = parseBlocks(text, isUser);

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

          case "quiz":
            let quizData = [];
            try {
              quizData = JSON.parse(block.content);
            } catch (err) {
              console.error("JSON.parse failed for quiz block:", err);
              const extracted = extractQuiz(block.content);
              if (extracted) {
                quizData = extracted.quiz;
              }
            }
            return (
              <QuizBlock
                key={index}
                quizzes={quizData}
                language={block.language}
                showCode
                className="flex flex-col gap-4 mb-2"
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
