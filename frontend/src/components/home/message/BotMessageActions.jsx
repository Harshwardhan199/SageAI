import { useState } from "react";

const BotMessageActions = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let textToCopy = "";

    if (message.type === "quiz") {
      const sourceData = message.content || message.questions;
      const quizData = Array.isArray(sourceData)
        ? sourceData
        : (typeof sourceData === "string" && sourceData.trim() !== "")
        ? JSON.parse(sourceData)
        : [];

      textToCopy = message.title ? `### ${message.title}\n\n` : "### Quiz\n\n";
      quizData.forEach((q, idx) => {
        textToCopy += `Q${idx + 1}. ${q.question}\n`;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
            textToCopy += `${letter}) ${opt}\n`;
          });
        }
        textToCopy += `Answer: ${q.answer}\n\n`;
      });
      textToCopy = textToCopy.trim();
    } else {
      textToCopy = message.content || "";
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-start gap-1 opacity-0 group-hover:opacity-100 transition-all duration-250 mt-1">
      {/* Copy */}
      <div
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f1f1f] cursor-pointer"
        onClick={handleCopy}
        title="Copy response"
      >
        <img
          src={
            copied
              ? "https://img.icons8.com/?size=100&id=98955&format=png&color=ffffff"
              : "https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff"
          }
          alt="Copy"
          className="w-4 h-4"
        />
      </div>
    </div>
  );
};

export default BotMessageActions;
