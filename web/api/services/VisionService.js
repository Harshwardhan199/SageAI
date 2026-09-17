const GroqService = require("./groq/groqService");

class VisionService {
  /**
   * Analyzes an image using Groq qwen/qwen3.6-27b vision model.
   * @param {string} imageUrl Public HTTP URL or base64 data URI
   * @returns {Promise<string>} The image analysis text
   */
  static async analyze(imageUrl) {
    if (!imageUrl) {
      throw new Error("Image URL is required for vision analysis.");
    }

    try {
      const groq = GroqService.client;

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analyze the image.\n\n" +
                  "Return:\n" +
                  "- detected text\n" +
                  "- UI elements\n" +
                  "- errors\n" +
                  "- code\n" +
                  "- charts\n" +
                  "- diagrams\n" +
                  "- important visual context\n\n" +
                  "Keep it concise."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      });

      return response.choices[0]?.message?.content || "";
    } catch (err) {
      console.error("VisionService analyze failed:", err.message);
      throw new Error(`Vision image analysis failed: ${err.message}`);
    }
  }
}

module.exports = VisionService;
