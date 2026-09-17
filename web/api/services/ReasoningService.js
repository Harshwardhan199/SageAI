const GroqService = require("./groq/groqService");

class ReasoningService {
  static allowedModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b"
  ];

  /**
   * Generates response from selected reasoning model via GroqService.
   * @param {string} model Model identifier
   * @param {string} prompt Combined prompt context
   * @param {Array} chatHistory List of historical messages
   * @param {Array} semanticMatches Vector search context matches
   * @param {string} sharedContext Shared workspace context
   * @returns {Promise<object>} LLM reasoning response object with blocks
   */
  static async generateResponse(model, prompt, chatHistory = [], semanticMatches = [], sharedContext = "") {
    if (!this.allowedModels.includes(model)) {
      throw new Error(`Model ${model} is not allowed for reasoning.`);
    }

    try {
      const messages = [];

      let systemPrompt = "You are a helpful assistant.";

      if (sharedContext && sharedContext.trim()) {
        systemPrompt += `\n\nProject Workspace Context Instructions:\n${sharedContext.trim()}`;
      }

      if (semanticMatches && semanticMatches.length > 0) {
        const memorySnippets = semanticMatches
          .map((m) => {
            const textContent =
              m.text ||
              (m.parts && m.parts.map((p) => p.value).join(" ")) ||
              (m.blocks && m.blocks.map((b) => typeof b.content === "string" ? b.content : JSON.stringify(b.content || b)).join(" ")) ||
              "";
            return textContent.trim() ? `- ${textContent.trim()}` : null;
          })
          .filter(Boolean);

        if (memorySnippets.length > 0) {
          systemPrompt += "\n\nHere is relevant context retrieved from previous workspace conversations:\n" + memorySnippets.join("\n");
        }
      }

      messages.push({
        role: "system",
        content: systemPrompt
      });

      for (const msg of chatHistory) {
        const textContent = msg.text || (msg.parts && msg.parts.filter(p => p.type === "text").map(p => p.value).join("\n")) || "";
        messages.push({
          role: msg.role === "model" || msg.sender === "bot" ? "assistant" : "user",
          content: textContent
        });
      }

      messages.push({
        role: "user",
        content: prompt
      });

      const response = await GroqService.chatCompletion({
        model,
        messages
      });

      return response;
    } catch (err) {
      console.error(`ReasoningService failed for model ${model}:`, err.message);
      throw new Error(`Reasoning model (${model}) failed: ${err.message}`);
    }
  }
}

module.exports = ReasoningService;
