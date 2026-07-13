export const cleanText = (text) => {
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
};

export const escapeMarkdown = (text) => {
  return text
    .replace(/([\\`*_\[\]{}()>#+-.!])/g, "\\$1")
    .replace(/"/g, '\\"');
};