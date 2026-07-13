const axios = require("axios");

class AudioService {
  /**
   * Transcribes audio using the Python llm_api whisper transcription endpoint.
   * @param {string} audioUrl Public HTTP URL or base64 data URI
   * @returns {Promise<string>} The transcript
   */
  static async transcribe(audioUrl) {
    try {
      const llmApiUrl = process.env.LLM_API_URL || "http://localhost:8000";
      const response = await axios.post(`${llmApiUrl}/transcribe`, {
        audio_url: audioUrl
      });

      const text = response.data;
      if (text.startsWith("Error:")) {
        throw new Error(text);
      }
      return text;
    } catch (err) {
      console.error("AudioService transcribe failed:", err.message);
      throw new Error(`Speech-to-Text transcription failed: ${err.message}`);
    }
  }
}

module.exports = AudioService;
