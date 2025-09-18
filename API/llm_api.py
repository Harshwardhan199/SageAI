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
class ChatRequest(BaseModel):
    model: str
    message: str

groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Embeddings
class EmbedRequest(BaseModel):
    text: str

API_URL = "https://api-atlas.nomic.ai/v1/embedding/text"

NOMIC_API_KEY = os.getenv("NOMIC_API_KEY")

@app.post("/chat", response_class=PlainTextResponse)
def chat(payload: ChatRequest):
    try:
        response = groqClient.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": 'You are a helpful assistant. Never generate a quiz unless asked. When asked for a quiz return the quiz in JSON format with both questions and answers, each question with 4 options and correct option(full content not number) as answer. Quiz Format example: ```json[ { "question": "What is 2+2?", "options": ["3","4","5", "6"], "answer": "4" }, { "question": "Capital of France?", "options": ["Paris","Berlin","London","Madrid"], "answer": "Paris" } ]``` Only use this format for quizzes. For non-quiz responses reply normally in plain text. When listing things you may sometimes use bullet points but not always. You may occasionally ask the user if they’d like to try an attemptable quiz in-chat, but never reveal or explain the quiz format (json) to them.'
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
    embeddings = np.array(data["embeddings"])

    return {"embedding": embeddings[0].tolist()}
