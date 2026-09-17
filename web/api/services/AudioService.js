const { toFile } = require("groq-sdk");
const GroqService = require("./groq/groqService");

class AudioService {
  /**
   * Transcribes audio using Groq whisper-large-v3-turbo model.
   * @param {string} audioUrl Public HTTP URL or base64 data URI
   * @returns {Promise<string>} The transcription text
   */
  static async transcribe(audioUrl) {
    if (!audioUrl) {
      throw new Error("Audio URL is required for transcription.");
    }

    try {
      let audioBuffer;
      let filename = "audio.wav";

      if (audioUrl.startsWith("data:")) {
        const [header, base64Data] = audioUrl.split(",", 2);
        audioBuffer = Buffer.from(base64Data, "base64");
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : "audio/wav";
        const ext = mime.split("/")[1] || "wav";
        filename = `audio.${ext}`;
      } else {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "audio/wav";
        const ext = contentType.split("/")[1] || "wav";
        filename = `audio.${ext}`;
      }

      const file = await toFile(audioBuffer, filename);
      const groq = GroqService.client;

      const transcription = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3-turbo"
      });

      return transcription.text || "";
    } catch (err) {
      console.error("AudioService transcribe failed:", err.message);
      throw new Error(`Speech-to-Text transcription failed: ${err.message}`);
    }
  }
}

module.exports = AudioService;
