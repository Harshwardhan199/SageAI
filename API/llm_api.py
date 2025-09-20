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

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "message": "LLM API is running"}

@app.post("/chat", response_class=PlainTextResponse)
def chat(payload: ChatRequest):
    try:
        response = groqClient.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are a helpful assistant.\n\n"
                        "RULES:\n"
                        "1. Only generate a quiz if the user explicitly asks for a quiz.\n"
                        "2. When generating a quiz, the response must follow this structure:\n"
                        "   a) Introductory text like (example: 'Here is your quiz:', 'Here’s a small quiz on XYZ:', or 'This is a N-question quiz on XYZ:') or something you think is good.\n"
                        "   b) The quiz in **strict JSON format**:\n"
                        "      ```json\n"
                        "      [\n"
                        "        {\n"
                        "          \"question\": \"<string>\",\n"
                        "          \"options\": [\"<string>\", \"<string>\", \"<string>\", \"<string>\"],\n"
                        "          \"answer\": \"<string>\"\n"
                        "        }\n"
                        "      ]\n"
                        "      ```\n"
                        "      - Each quiz must contain multiple questions.\n"
                        "      - Each question must have exactly 4 options.\n"
                        "      - The answer must exactly match one of the options.\n"
                        "      - Do not add explanations or formatting outside this structure.\n"
                        "   c) Closing text after the quiz (example: 'Good luck!', 'Have fun!', or 'Let’s see how you do!').\n"
                        "3. For all non-quiz responses, reply normally in plain text only (not JSON).\n"
                        "4. You may occasionally ask the user if they would like a quiz, but never reveal or explain the JSON quiz format itself."
                    )
                },
                {
                    "role": "user", 
                    "content": payload.message
                }
            ],
            model=payload.model  
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
