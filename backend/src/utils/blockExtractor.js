/**
 * Robust utility to parse or extract blocks from LLM generated outputs.
 * Guarantees that raw JSON syntax wrappers ({ "blocks": [...] }) are never
 * stored in MongoDB or rendered to the user.
 */

function unescapeJsonString(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

function extractBlocks(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return [{ type: "chat", content: "" }];
  }

  const trimmed = rawText.trim();

  // Case 1: Perfectly valid JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        return parsed.blocks.map((block) => {
          if (block.type === "chat") {
            return {
              type: "chat",
              content: typeof block.content === "string" ? block.content : JSON.stringify(block.content)
            };
          }
          return block;
        });
      }
    } catch (e) {
      // Direct JSON parsing failed (e.g. due to unescaped quotes inside code string)
    }
  }

  // Case 2: Extract chat blocks & quiz blocks via pattern extraction
  if (trimmed.startsWith("{") && trimmed.includes('"blocks"')) {
    const extractedBlocks = [];

    // Extract chat contents
    const chatRegex = /"type"\s*:\s*"chat"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)/g;
    let chatMatch;
    let chatText = "";

    while ((chatMatch = chatRegex.exec(trimmed)) !== null) {
      if (chatMatch[1]) {
        const text = unescapeJsonString(chatMatch[1]);
        if (text) {
          chatText += (chatText ? "\n\n" : "") + text;
        }
      }
    }

    if (chatText) {
      extractedBlocks.push({ type: "chat", content: chatText });
    }

    // Extract quiz objects if present
    const quizRegex = /"type"\s*:\s*"quiz"[\s\S]*?"questions"\s*:\s*(\[[^\]]*\])/g;
    let quizMatch;
    while ((quizMatch = quizRegex.exec(trimmed)) !== null) {
      try {
        const questions = JSON.parse(quizMatch[1]);
        extractedBlocks.push({
          type: "quiz",
          title: "Quiz",
          questions
        });
      } catch (e) {}
    }

    if (extractedBlocks.length > 0) {
      return extractedBlocks;
    }
  }

  // Case 3: Plain text / Markdown
  return [{ type: "chat", content: trimmed }];
}

module.exports = { extractBlocks, unescapeJsonString };
