import api from "../api/axios";
import { config } from "../config";
import { authStore } from "../context/AuthContext";

/**
 * Dynamically extracts text content from streaming partial JSON objects
 * so the user sees clean Markdown instead of raw JSON syntax.
 */
export function extractStreamingContent(rawStream) {
  if (!rawStream) return "";

  const trimmed = rawStream.trim();
  if (!trimmed.startsWith("{")) {
    return rawStream;
  }

  try {
    const parsed = JSON.parse(rawStream);
    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks
        .filter((b) => b.type === "chat")
        .map((b) => b.content)
        .join("\n\n");
    }
  } catch (e) {
    // Stream in progress
  }

  const matches = [];
  const regex = /"content"\s*:\s*"((?:[^"\\]|\\.)*)/g;
  let match;
  while ((match = regex.exec(rawStream)) !== null) {
    let unescaped = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\t/g, "\t");
    matches.push(unescaped);
  }

  if (matches.length > 0) {
    return matches.join("\n\n");
  }

  return "";
}

export const chatService = {
  getChatMessages: async (chatId) => {
    const res = await api.post("/user/getChat", { chatId });
    return res.data.messages;
  },

  sendPrompt: async ({ prompt, parts, model, currentChat, projectId }) => {
    const res = await api.post("/user/chat", {
      prompt,
      parts,
      model,
      currentChat,
      projectId
    });
    return res.data;
  },

  deleteChat: async (chatId) => {
    const res = await api.post("/user/deleteChat", { chatId });
    return res.data;
  },

  renameChat: async (chatId, title) => {
    const res = await api.post("/user/renameChat", { chatId, title });
    return res.data;
  },

  moveChat: async (chatId, projectId) => {
    const res = await api.post("/user/moveChat", { chatId, projectId });
    return res.data;
  },

  deleteMessage: async (messageId) => {
    const res = await api.post("/user/deleteMessage", { messageId });
    return res.data;
  },

  streamChat: async ({ prompt, parts, model, currentChat, projectId, onToken, onComplete, onMeta }) => {
    const tokenStr = authStore.getAccessToken() || "";
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Streaming failed");
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
          const payload = line.substring(6).trim();
          if (payload === "[DONE]") break;
          try {
            const data = JSON.parse(payload);
            if (data.meta && onMeta) onMeta(data.meta);
            if (data.token) {
              accumulated += data.token;
              const cleanContent = extractStreamingContent(accumulated);
              if (onToken) onToken(data.token, accumulated, cleanContent);
            }
          } catch (e) {}
        }
      }
    }

    if (onComplete) onComplete(accumulated);
    return accumulated;
  }
};
