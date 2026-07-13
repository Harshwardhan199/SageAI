import JSON5 from "json5";

export const extractQuiz = (content) => {
  const jsonRegex = /\[(?:\s*\{[\s\S]*?\}\s*,?)*\s*\]/m;
  const match = content.match(jsonRegex);

  if (!match) {
    return null;
  }

  try {
    const parsed = JSON5.parse(match[0].replace(/`/g, ""));

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed[0].question &&
      parsed[0].options &&
      parsed[0].answer
    ) {
      return {
        quiz: parsed,
        before: content.slice(0, match.index).trim(),
        after: content
          .slice(match.index + match[0].length)
          .trim(),
      };
    }
  } catch (err) {
    console.error("JSON.parse failed:", err, match[0]);
  }

  return null;
};