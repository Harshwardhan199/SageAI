import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { cleanText } from "./utils/markdown";

const MarkdownBlock = ({ content }) => {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {cleanText(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownBlock;
