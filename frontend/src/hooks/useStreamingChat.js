import { useState, useCallback } from "react";
import { config } from "../config";
import { authStore } from "../context/AuthContext";

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamError, setStreamError] = useState(null);

  const streamPrompt = useCallback(async ({ prompt, parts, model, currentChat, projectId, onMeta, onToken, onComplete }) => {
    setIsStreaming(true);
    setStreamingText("");
    setStreamError(null);

    const tokenStr = authStore.getAccessToken() || "";

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/user/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStr}`
        },
        credentials: "include",
        body: JSON.stringify({ prompt, parts, model, currentChat, projectId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Streaming request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === "[DONE]") {
              break;
            }

            try {
              const data = JSON.parse(jsonStr);

              if (data.meta) {
                if (onMeta) onMeta(data.meta);
              }

              if (data.token) {
                accumulated += data.token;
                setStreamingText(accumulated);
                if (onToken) onToken(data.token, accumulated);
              }

              if (data.error) {
                setStreamError(data.error);
              }
            } catch (e) {
              // Ignore partial line parses
            }
          }
        }
      }

      if (onComplete) onComplete(accumulated);
    } catch (err) {
      console.error("[useStreamingChat] Stream error:", err);
      setStreamError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    streamingText,
    streamError,
    streamPrompt
  };
}
