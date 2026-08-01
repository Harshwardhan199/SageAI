class ContextRanker {
  /**
   * Ranks and weights vector search matches across the project context.
   * Composite Score = vectorScore * recencyWeight * sameChatBonus
   * 
   * @param {Array} rawMatches Array of raw match documents from Atlas Vector Search
   * @param {string|ObjectId} currentChatId Active chat ID
   * @param {number} topK Number of top matches to return (default 5)
   * @returns {Array} Ranked and filtered context matches
   */
  static rankMatches(rawMatches = [], currentChatId, topK = 5) {
    if (!rawMatches || rawMatches.length === 0) return [];

    const now = Date.now();
    const curChatStr = currentChatId ? currentChatId.toString() : "";

    const scored = rawMatches.map((match) => {
      // Vector score (defaults to 1 if score isn't returned by index)
      const vectorScore = match.score || match.vectorSearchScore || 1.0;

      // Recency decay: 30-day half-life decay factor
      const msgTime = match.createdAt ? new Date(match.createdAt).getTime() : now;
      const ageInDays = Math.max(0, (now - msgTime) / (1000 * 60 * 60 * 24));
      const recencyWeight = Math.max(0.5, 1.0 - (ageInDays / 60)); // minimum 0.5 decay cap

      // Same chat bonus (1.3x boost if from active chat)
      const matchChatStr = match.chatId ? match.chatId.toString() : "";
      const sameChatBonus = (matchChatStr && matchChatStr === curChatStr) ? 1.3 : 1.0;

      const finalScore = vectorScore * recencyWeight * sameChatBonus;

      return {
        ...match,
        finalScore,
        isSameChat: matchChatStr === curChatStr
      };
    });

    // Sort descending by finalScore and return top K
    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK);
  }
}

module.exports = ContextRanker;
