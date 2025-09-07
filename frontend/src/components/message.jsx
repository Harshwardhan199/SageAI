import React, { forwardRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const Message = forwardRef(({ sender, text, style }, ref) => {
  const isUser = sender === "user";

  // Regex to find ```lang ... ``` blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Plain text before code
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    // Code block (keep backticks as is)
    parts.push({
      type: "code",
      language: match[1] || "text",
      content: match[2],
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Remaining plain text after last code block
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  // Remove inline single-backticks only from plain text
  const cleanText = (s) => s.replace(/`/g, "");

  return (
    <div
      ref={ref}
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`py-2 rounded-2xl shadow max-w-full whitespace-pre-wrap ${isUser ? "px-4 bg-[#1f1f1f] text-white" : "text-white"
          }`}
        style={style}
      >
        {parts.map((part, i) =>
          part.type === "code" ? (
            <div key={i} className="custom-scrollbar rounded-lg shadow-md my-2 overflow-x-auto">
              <SyntaxHighlighter
                style={oneDark}
                language={"python"}
                PreTag="div"
                showLineNumbers={true}
              >
                {part.content.trim()}
              </SyntaxHighlighter>
            </div>
          ) : (
            <span key={i}>{cleanText(part.content)}</span>
          )
        )}
      </div>
    </div>
  );
});

export default Message;
