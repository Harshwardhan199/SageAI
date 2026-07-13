const axios = require("axios");

class VisionService {
  /**
   * Analyzes an image using the Python llm_api Qwen-Vision analysis endpoint.
   * @param {string} imageUrl Public HTTP URL or base64 data URI
   * @returns {Promise<string>} The image analysis text
   */
  static async analyze(imageUrl) {
    try {
      const llmApiUrl = process.env.LLM_API_URL || "http://localhost:8000";
      const response = await axios.post(`${llmApiUrl}/vision`, {
        image_url: imageUrl
      });

      const text = response.data;
      if (text.startsWith("Error:")) {
        throw new Error(text);
      }
      return text;
    } catch (err) {
      console.error("VisionService analyze failed:", err.message);
      throw new Error(`Vision image analysis failed: ${err.message}`);
    }
  }
}

module.exports = VisionService;
