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

CHAT_SYSTEM_PROMPT = (
    "You are a helpful assistant.\n"
    "You must ALWAYS respond in a strict JSON format matching this schema:\n"
    "{\n"
    "  \"type\": \"chat\",\n"
    "  \"content\": \"Markdown formatted response\"\n"
    "}\n"
    "Rules:\n"
    "1. Return ONLY valid JSON. Do not wrap the JSON in markdown code blocks or code fences.\n"
    "2. Do not include any explanations or commentary outside the JSON object.\n"
    "3. The 'content' field may contain rich Markdown formatting as needed."
)

QUIZ_SYSTEM_PROMPT = (
    "You are a helpful assistant.\n"
    "You must ALWAYS respond in a strict JSON format matching this schema:\n"
    "{\n"
    "  \"type\": \"quiz\",\n"
    "  \"title\": \"Quiz title\",\n"
    "  \"questions\": [\n"
    "    {\n"
    "      \"question\": \"Question text\",\n"
    "      \"options\": [\n"
    "        \"Option A\",\n"
    "        \"Option B\",\n"
    "        \"Option C\",\n"
    "        \"Option D\"\n"
    "      ],\n"
    "      \"answer\": \"Option A\"\n"
    "    }\n"
    "  ]\n"
    "}\n"
    "Rules:\n"
    "1. Return ONLY valid JSON. Do not wrap the JSON in markdown code blocks or code fences.\n"
    "2. Do not include any explanations or commentary outside the JSON object.\n"
    "3. The 'questions' array must contain between 5 and 10 questions.\n"
    "4. Each question must have exactly 4 options.\n"
    "5. The 'answer' field of each question must exactly match one of its options.\n"
    "6. No markdown or explanations inside the JSON questions/answers/options."
)

def detect_quiz_request(messages: list, prompt: str | None) -> bool:
    keywords = ["quiz", "mcq", "multiple choice", "test me", "practice questions"]
    if prompt:
        prompt_lower = prompt.lower()
        if any(kw in prompt_lower for kw in keywords):
            return True
    if messages:
        for msg in reversed(messages):
            content = ""
            role = ""
            if isinstance(msg, dict):
                content = msg.get("content", "")
                role = msg.get("role", "")
            else:
                content = getattr(msg, "content", "")
                role = getattr(msg, "role", "")
            
            if role == "user" and content:
                content_lower = content.lower()
                if any(kw in content_lower for kw in keywords):
                    return True
                break
    return False

def prepare_messages(input_messages: list, prompt: str | None) -> list:
    is_quiz = detect_quiz_request(input_messages, prompt)
    target_instructions = QUIZ_SYSTEM_PROMPT if is_quiz else CHAT_SYSTEM_PROMPT
    
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
        messages[system_idx]["content"] = original + "\n\n" + target_instructions
    else:
        messages.insert(0, {"role": "system", "content": target_instructions})
        
    return messages

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        if payload.messages:
            input_messages = payload.messages
        else:
            input_messages = [{"role": "user", "content": payload.message or ""}]

        messages = prepare_messages(input_messages, payload.message)

        response = groqClient.chat.completions.create(
            model=payload.model,
            messages=messages,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content or ""

        try:
            parsed = json.loads(raw_content)
            if not isinstance(parsed, dict) or "type" not in parsed:
                return {
                    "type": "chat",
                    "content": raw_content
                }
            return parsed
        except Exception:
            return {
                "type": "chat",
                "content": raw_content
            }

    except Exception as e:
        return {
            "type": "chat",
            "content": f"Error: {e}"
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
