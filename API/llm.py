import json
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import requests

app = FastAPI()

class ChatRequest(BaseModel):
    model: str
    message: str

@app.post("/chat", response_class=PlainTextResponse)
def chat(payload: ChatRequest):
    try:
        r = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": payload.model,
                "messages": [{"role": "user", "content": payload.message}]
            },
            timeout=30
        )
        r.raise_for_status()

        combined_text = ""
        for line in r.text.splitlines():
            if not line.strip():
                continue
            data = json.loads(line)
            content = data.get("message", {}).get("content")
            if content:
                combined_text += content

        return combined_text

    except requests.exceptions.RequestException as e:
        return f"Error: {e}"
