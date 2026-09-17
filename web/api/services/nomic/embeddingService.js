const NOMIC_API_URL = "https://api-atlas.nomic.ai/v1/embedding/text";

const EmbeddingService = {
  /**
   * Generates a 768-dimensional text embedding vector via Nomic API.
   * @param {string} text Input text to embed
   * @returns {Promise<Array<number>>} Vector array or empty array on failure
   */
  generateEmbedding: async (text) => {
    const apiKey = process.env.NOMIC_API_KEY;
    if (!apiKey) {
      console.warn("[EmbeddingService] NOMIC_API_KEY is missing");
      return [];
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return [];
    }

    const payload = {
      texts: [text.trim()],
      model: "nomic-embed-text-v1.5",
      task_type: "search_document"
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(NOMIC_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn(`[EmbeddingService] Nomic API returned status ${response.status}: ${errorText}`);
        return [];
      }

      const data = await response.json();
      if (data && Array.isArray(data.embeddings) && data.embeddings.length > 0) {
        const embedding = data.embeddings[0];
        if (Array.isArray(embedding) && embedding.length === 768) return embedding;
        console.warn(`[EmbeddingService] Expected a 768-dimensional embedding, received ${embedding?.length || 0}.`);
        return [];
      }

      console.warn("[EmbeddingService] Unexpected Nomic response structure:", data);
      return [];
    } catch (err) {
      console.error("[EmbeddingService] Nomic embedding request failed:", err.message);
      return [];
    }
  }
};

module.exports = EmbeddingService;
