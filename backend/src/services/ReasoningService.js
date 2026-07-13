const axios = require("axios");

class ReasoningService {
  static allowedModels = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b"
  ];

  /**
   * Generates response from selected reasoning model.
   * @param {string} model Model identifier
   * @param {string} prompt Combined prompt context
   * @param {Array} chatHistory List of historical messages
   * @param {Array} semanticMatches Vector search context matches
   * @returns {Promise<string>} LLM reasoning response
   */
  static async generateResponse(model, prompt, chatHistory = [], semanticMatches = []) {
    if (!this.allowedModels.includes(model)) {
      throw new Error(`Model ${model} is not allowed for reasoning.`);
    }

    try {
      const llmApiUrl = process.env.LLM_API_URL || "http://localhost:8000";

      // Build messages array containing full conversation context
      const messages = [];

      // System prompt with long term memory context
      let systemPrompt = "You are a helpful assistant.";
      if (semanticMatches && semanticMatches.length > 0) {
        systemPrompt += "\n\nHere is some relevant context from previous conversation memory:\n" +
          semanticMatches.map(m => `- ${m.text}`).join("\n");
      }
      messages.push({
        role: "system",
        content: systemPrompt
      });

      // Add history turns
      for (const msg of chatHistory) {
        const textContent = msg.text || (msg.parts && msg.parts.filter(p => p.type === "text").map(p => p.value).join("\n")) || "";
        messages.push({
          role: msg.role === "model" || msg.sender === "bot" ? "assistant" : "user",
          content: textContent
        });
      }

      // Add current prompt
      messages.push({
        role: "user",
        content: prompt
      });

      // Delegate reasoning response generation entirely to llm_api service
      const response = await axios.post(`${llmApiUrl}/chat`, {
        model: model,
        messages: messages
      });

      const resData = response.data;
      if (typeof resData === "string" && resData.startsWith("Error:")) {
        throw new Error(resData);
      }
      return resData;
    } catch (err) {
      console.error(`ReasoningService failed for model ${model}:`, err.message);
      throw new Error(`Reasoning model (${model}) failed: ${err.message}`);
    }
  }
}

module.exports = ReasoningService;
