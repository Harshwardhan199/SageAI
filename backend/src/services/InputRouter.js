const VisionService = require("./VisionService");
const AudioService = require("./AudioService");
const PromptBuilder = require("./PromptBuilder");

// Extensible registry mapping modality types to their processing rules
const PROCESSORS = {
  image: {
    process: (url) => VisionService.analyze(url),
    key: "imageAnalysis"
  },
  audio: {
    process: (url) => AudioService.transcribe(url),
    key: "transcript"
  }
};

class InputRouter {
  /**
   * Routes the multi-modal input parts to their specialized processing services
   * and builds the final consolidated prompt context.
   * @param {Array} parts Array of message parts [{ type, value, url }]
   * @returns {Promise<string>} Final prompt for reasoning model
   */
  static async route(parts) {
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      throw new Error("InputRouter requires an array of message parts.");
    }

    const textParts = parts.filter(p => p.type === "text");
    const otherParts = parts.filter(p => p.type !== "text");

    // Case 1: Text only
    if (otherParts.length === 0) {
      return textParts.map(p => p.value).join("\n");
    }

    // Determine Case 3: Audio only (no text, and all other parts are audio)
    const onlyAudio = otherParts.length > 0 && 
                      otherParts.every(p => p.type === "audio") && 
                      textParts.length === 0;

    const results = {
      text: textParts.map(p => p.value).join("\n"),
      transcript: "",
      imageAnalysis: ""
    };

    // Process all non-text parts concurrently/sequentially using registry
    for (const part of otherParts) {
      const processor = PROCESSORS[part.type];
      if (processor) {
        try {
          const output = await processor.process(part.url);
          
          // Append output to key value (joining multiple of same type if present)
          if (results[processor.key]) {
            results[processor.key] += "\n\n" + output;
          } else {
            results[processor.key] = output;
          }
        } catch (err) {
          console.error(`InputRouter failed to process part type ${part.type}:`, err.message);
          throw new Error(`Modality processing failed (${part.type}): ${err.message}`);
        }
      }
    }

    // Case 3: Audio only -> return transcript directly
    if (onlyAudio) {
      return results.transcript;
    }

    // Case 2 & 4: Merged PromptBuilder output
    return PromptBuilder.buildPrompt(results);
  }
}

module.exports = InputRouter;
