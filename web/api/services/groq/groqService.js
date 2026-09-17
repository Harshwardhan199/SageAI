const { Groq } = require("groq-sdk");

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[GroqService] GROQ_API_KEY is not set.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy_key" });
  }
  return groqClient;
}

const UNIFIED_SYSTEM_PROMPT = `You are a helpful assistant. You must respond ONLY in a strict JSON format.
The output JSON must match the following schema:
{
  "blocks": [
    {
      "type": "chat",
      "content": "Markdown formatted text"
    }
  ]
}

Rules:
1. You must respond strictly with valid JSON. Do not wrap the JSON response in markdown code blocks or code fences.
2. Do not include any explanations or commentary outside the JSON response.
3. The response must contain a top-level 'blocks' array.
4. Supported block types:
   - 'chat': Default block type for explanations, normal text, code snippets, summaries, and general conversation. The 'content' field must contain Markdown-formatted text.
   - 'quiz': ONLY include a 'quiz' block IF AND ONLY IF the user explicitly asks for a quiz, test, exam, or multiple-choice questions. NEVER generate a quiz automatically unless requested by the user. When requested, a 'quiz' block must include 'title' string, and a 'questions' array. Each question must contain 'question', exactly 4 'options', and 'answer' matching exactly one of the options. Generate 5-10 questions.
5. By default, return ONLY a 'chat' block in the 'blocks' array unless the user explicitly requests a quiz.`;

function prepareMessages(inputMessages = []) {
  const messages = inputMessages.map((msg) => ({
    role: msg.role || (msg.sender === "bot" ? "assistant" : "user"),
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content || "")
  }));

  const systemIdx = messages.findIndex((m) => m.role === "system");
  if (systemIdx !== -1) {
    const original = messages[systemIdx].content || "";
    messages[systemIdx].content = original + "\n\n" + UNIFIED_SYSTEM_PROMPT;
  } else {
    messages.unshift({ role: "system", content: UNIFIED_SYSTEM_PROMPT });
  }

  return messages;
}

const GroqService = {
  get client() {
    return getGroqClient();
  },

  UNIFIED_SYSTEM_PROMPT,
  prepareMessages,

  /**
   * Generates a non-streaming chat completion with strict JSON response format.
   */
  chatCompletion: async ({ model = "llama-3.3-70b-versatile", messages = [] }) => {
    const groq = getGroqClient();
    const preparedMessages = prepareMessages(messages);

    const response = await groq.chat.completions.create({
      model,
      messages: preparedMessages,
      response_format: { type: "json_object" }
    });

    const rawContent = response.choices[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
        return parsed;
      }
      return {
        blocks: [{ type: "chat", content: rawContent }]
      };
    } catch (err) {
      return {
        blocks: [{ type: "chat", content: rawContent }]
      };
    }
  },

  /**
   * Returns a streaming chat completion from Groq with abort signal support.
   */
  streamChatCompletion: async ({ model = "llama-3.3-70b-versatile", messages = [] }, { signal } = {}) => {
    const groq = getGroqClient();
    const preparedMessages = prepareMessages(messages);

    return groq.chat.completions.create(
      {
        model,
        messages: preparedMessages,
        stream: true
      },
      { signal }
    );
  },

  /**
   * Feedback completion for quiz questions.
   */
  generateFeedback: async ({ model = "llama-3.1-8b-instant", message = "" }) => {
    const groq = getGroqClient();
    const systemPrompt =
      "You are a helpful assistant. Your task: explain to user why their answer is wrong, or just correct them if it's factual. And do no state that user's answer is incorrect or wrong as user's asking you because its incorrect Never add extra chatty phrases or unrelated suggestions. Respond concisely.";

    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    return response.choices[0]?.message?.content || "";
  }
};

module.exports = GroqService;
