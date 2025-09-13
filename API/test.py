from transformers import AutoTokenizer, AutoModelForCausalLM

# Model name on Hugging Face
model_name = "meta-llama/Meta-Llama-3-8B-Instruct"

# Load tokenizer + model
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",   # Uses GPU if available
    load_in_4bit=True    # Quantization for smaller VRAM
)

# ----- SYSTEM INSTRUCTIONS (Prompt Template) -----
system_instruction = "You are a helpful AI assistant. Answer clearly and politely."

user_prompt = "Tell me something about AI."

# Wrap into a conversation-style input
messages = [
    {"role": "system", "content": system_instruction},
    {"role": "user", "content": user_prompt}
]

# Convert to LLaMA chat format
from transformers import pipeline
chat = pipeline("text-generation", model=model, tokenizer=tokenizer)

response = chat(messages, max_new_tokens=300, temperature=0.7)
print(response[0]['generated_text'])
