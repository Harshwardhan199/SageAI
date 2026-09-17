const KEY_LABELS = {
  text: "User Text",
  transcript: "Voice Transcript",
  imageAnalysis: "Image Analysis",
  pdfText: "PDF Content",
  videoAnalysis: "Video Analysis",
  ocrText: "OCR Text"
};

class PromptBuilder {
  /**
   * Builds a structured prompt for reasoning models.
   * @param {Object} inputs Dictionary of modality processing outputs
   * @returns {string} The combined prompt
   */
  static buildPrompt(inputs) {
    const sections = [];

    // Prioritize standard keys in standard order, then append any dynamic/custom keys
    const orderedKeys = ["text", "transcript", "imageAnalysis"];
    const allKeys = [
      ...orderedKeys,
      ...Object.keys(inputs).filter(k => !orderedKeys.includes(k))
    ];

    for (const key of allKeys) {
      if (inputs[key] && typeof inputs[key] === "string" && inputs[key].trim()) {
        const label = KEY_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
        sections.push(`${label}:\n${inputs[key].trim()}`);
      }
    }

    sections.push("Answer the user's question.");
    return sections.join("\n\n");
  }
}

module.exports = PromptBuilder;
