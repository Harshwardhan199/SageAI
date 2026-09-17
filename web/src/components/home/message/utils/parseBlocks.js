export const parseBlocks = (text, isUser) => {
  const blocks = [];

  if (!isUser && text) {
    // Regex for completed code blocks: ```lang\ncode```
    const completedBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = completedBlockRegex.exec(text)) !== null) {
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

      lastIndex = completedBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      // Check for unclosed/streaming code block: ```lang\ncode...
      const openCodeBlockRegex = /```(\w+)?\n([\s\S]*)$/;
      const openMatch = openCodeBlockRegex.exec(remainingText);

      if (openMatch) {
        if (openMatch.index > 0) {
          blocks.push({
            type: "text",
            content: remainingText.slice(0, openMatch.index),
          });
        }
        blocks.push({
          type: "code",
          language: openMatch[1] || "python",
          content: openMatch[2],
        });
      } else {
        blocks.push({
          type: "text",
          content: remainingText,
        });
      }
    }
  } else if (text) {
    blocks.push({ type: "text", content: text });
  }

  return blocks;
};