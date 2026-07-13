export const parseBlocks = (text, isUser) => {
  const blocks = [];

  if (!isUser) {
    const blockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      if (match[1] === "json") {
        blocks.push({
          type: "quiz",
          content: match[2],
        });
      } else {
        blocks.push({
          type: "code",
          language: match[1] || "python",
          content: match[2],
        });
      }

      lastIndex = blockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      blocks.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }
  }

  return blocks;
};