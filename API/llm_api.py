import json
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import requests

from dotenv import load_dotenv

#from sentence_transformers import SentenceTransformer
from groq import Groq
from google import genai

load_dotenv()

app = FastAPI()

class ChatRequest(BaseModel):
    model: str
    message: str

groqClient = Groq(api_key=os.getenv("GROQ_API_KEY"))

class EmbedRequest(BaseModel):
    text: str

geminiClient = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
#embedding_model = SentenceTransformer('all-MiniLM-L6-v2') 

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
    """
    Generate embedding for a given text.
    """
    result = geminiClient.models.embed_content(
        model = "gemini-embedding-001",
        contents = req.text
    )

    #embedding = embedding_model.encode(req.text).tolist()  
    #print(embedding)
    return {"embedding": embedding}
