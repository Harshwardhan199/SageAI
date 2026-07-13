import json
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import requests

import numpy as np

import os
from dotenv import load_dotenv

from groq import Groq

load_dotenv()

app = FastAPI()

# Text Generation
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    message: str | None = None
    messages: list[ChatMessage] | None = None

groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Embeddings
class EmbedRequest(BaseModel):
    text: str

class TranscribeRequest(BaseModel):
    audio_url: str

class VisionRequest(BaseModel):
    image_url: str

API_URL = "https://api-atlas.nomic.ai/v1/embedding/text"

NOMIC_API_KEY = os.getenv("NOMIC_API_KEY")

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "message": "LLM API is running"}

UNIFIED_SYSTEM_PROMPT = (
    "You are a helpful assistant. You must respond ONLY in a strict JSON format.\n"
    "The output JSON must match the following schema:\n"
    "{\n"
    "  \"blocks\": [\n"
    "    {\n"
    "      \"type\": \"chat\",\n"
    "      \"content\": \"Markdown formatted text\"\n"
    "    },\n"
    "    {\n"
    "      \"type\": \"quiz\",\n"
    "      \"title\": \"Quiz title\",\n"
    "      \"questions\": [\n"
    "        {\n"
    "          \"question\": \"Question text\",\n"
    "          \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
    "          \"answer\": \"Option A\"\n"
    "        }\n"
    "      ]\n"
    "    }\n"
    "  ]\n"
    "}\n\n"
    "Rules:\n"
    "1. You must respond strictly with valid JSON. Do not wrap the JSON response in markdown code blocks or code fences (e.g. do not use ```json).\n"
    "2. Do not include any explanations or commentary outside the JSON response.\n"
    "3. The response must contain a top-level 'blocks' array containing one or more blocks in the order requested by the user.\n"
    "4. Supported block types:\n"
    "   - 'chat': For explanations, summaries, normal text, introductions, conclusions, or general conversation. The 'content' field must contain Markdown-formatted text.\n"
    "   - 'quiz': For multiple-choice questions. Must include a 'title' string, and a 'questions' array. Each question must contain 'question', exactly 4 'options', and 'answer' matching exactly one of the options. Generate 5-10 questions. No markdown or explanations inside the questions, options, or answers.\n"
    "5. Combine multiple blocks if the user's prompt has multiple logical parts (e.g. explain a topic then quiz the user)."
)

def prepare_messages(input_messages: list) -> list:
    messages = []
    for msg in input_messages:
        if isinstance(msg, dict):
            messages.append({"role": msg.get("role"), "content": msg.get("content")})
        else:
            messages.append({"role": msg.role, "content": msg.content})
            
    system_idx = -1
    for idx, msg in enumerate(messages):
        if msg.get("role") == "system":
            system_idx = idx
            break
            
    if system_idx != -1:
        original = messages[system_idx].get("content") or ""
        messages[system_idx]["content"] = original + "\n\n" + UNIFIED_SYSTEM_PROMPT
    else:
        messages.insert(0, {"role": "system", "content": UNIFIED_SYSTEM_PROMPT})
        
    return messages

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        if payload.messages:
            input_messages = payload.messages
        else:
            input_messages = [{"role": "user", "content": payload.message or ""}]

        messages = prepare_messages(input_messages)

        response = groqClient.chat.completions.create(
            model=payload.model,
            messages=messages,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content or ""

        try:
            parsed = json.loads(raw_content)
            if not isinstance(parsed, dict) or "blocks" not in parsed or not isinstance(parsed["blocks"], list):
                return {
                    "blocks": [
                        {
                            "type": "chat",
                            "content": raw_content
                        }
                    ]
                }
            return parsed
        except Exception:
            return {
                "blocks": [
                    {
                        "type": "chat",
                        "content": raw_content
                    }
                ]
            }

    except Exception as e:
        return {
            "blocks": [
                {
                    "type": "chat",
                    "content": f"Error: {e}"
                }
            ]
        }

@app.post("/feedback", response_class=PlainTextResponse)
def chat(payload: ChatRequest):
    try:
        response = groqClient.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful assistant. Your task: explain to user why their answer is wrong, or just correct them if it's factual. And do no state that user's answer is incorrect or wrong as user's asking you because its incorrect Never add extra chatty phrases or unrelated suggestions. Respond concisely."
                },
                {
                    "role": "user", 
                    "content": payload.message
                }
            ],
            model= payload.model  
        )

        print(response.choices[0].message.content)

        return response.choices[0].message.content

    except requests.exceptions.RequestException as e:
        return f"Error: {e}"

@app.post("/transcribe", response_class=PlainTextResponse)
def transcribe(payload: TranscribeRequest):
    try:
        import base64
        import io
        if payload.audio_url.startswith("data:"):
            header, base64_data = payload.audio_url.split(",", 1)
            audio_bytes = base64.b64decode(base64_data)
            mime = header.split(";")[0].split(":")[1]
            ext = mime.split("/")[1] if "/" in mime else "wav"
            filename = f"audio.{ext}"
        else:
            response = requests.get(payload.audio_url)
            response.raise_for_status()
            audio_bytes = response.content
            content_type = response.headers.get("content-type", "")
            ext = content_type.split("/")[1] if "/" in content_type else "wav"
            filename = f"audio.{ext}"

        transcription = groqClient.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model="whisper-large-v3-turbo"
        )
        return transcription.text
    except Exception as e:
        return f"Error: {e}"

@app.post("/vision", response_class=PlainTextResponse)
def vision(payload: VisionRequest):
    try:
        response = groqClient.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze the image.\n\n"
                                "Return:\n"
                                "- detected text\n"
                                "- UI elements\n"
                                "- errors\n"
                                "- code\n"
                                "- charts\n"
                                "- diagrams\n"
                                "- important visual context\n\n"
                                "Keep it concise."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": payload.image_url
                            }
                        }
                    ]
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

@app.post("/embed")
async def get_embedding(req: EmbedRequest):
    print("Request recieved")
    headers = {
        "Authorization": f"Bearer {NOMIC_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "texts": [req.text],
        "model": "nomic-embed-text-v1.5",
        "task_type": "search_document"
    }

    response = requests.post(API_URL, json=payload, headers=headers)

    data = response.json()

    print(response.status_code)
    print(response.text)

    embeddings = np.array(data["embeddings"])

    return {"embedding": embeddings[0].tolist()}
