import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { cleanText } from "./utils/markdown";
import { extractQuiz } from "./utils/quizParser";

import QuizBlock from "./QuizBlock";

const MarkdownBlock = ({ content }) => {
  const quizContent = extractQuiz(content);

  if (quizContent) {
    const { quiz, before, after } = quizContent;

    return (
      <div className="flex flex-col gap-4">
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

        <QuizBlock quizzes={quiz} showCode={false} escapeOptions={true} />

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
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {cleanText(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownBlock;
