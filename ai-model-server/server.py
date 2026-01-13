"""
AI Detection Model Server
Run this on a separate computer with the AI model
Exposes a simple HTTP API that your main backend can call
"""
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI(title="AI Detection Model Server")

# CORS - allow your main backend to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and tokenizer (loaded once on startup)
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class DetectRequest(BaseModel):
    text: str

class DetectResponse(BaseModel):
    ai_probability: float
    human_probability: float
    confidence: float
    model_name: str

@app.on_event("startup")
async def load_model():
    """Load the AI detection model on startup"""
    global model, tokenizer

    print("🔄 Loading AI detection model...")
    print(f"   Device: {device}")

    # Option 1: RoBERTa OpenAI Detector (fastest, good accuracy)
    model_name = "roberta-base-openai-detector"

    # Option 2: Better detector (uncomment to use)
    # model_name = "Hello-SimpleAI/chatgpt-detector-roberta"

    # Option 3: Best detector (needs more RAM)
    # model_name = "TrustSafeAI/RADAR-Vicuna-7B"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        model = model.to(device)
        model.eval()

        print(f"✅ Model loaded: {model_name}")
        print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
        print(f"   Ready to detect AI text!")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        print("   Installing transformers: pip install transformers torch")
        raise

@app.post("/detect", response_model=DetectResponse)
async def detect_ai(request: DetectRequest):
    """
    Detect if text is AI-generated
    Returns probability between 0 (human) and 1 (AI)
    """
    if not model or not tokenizer:
        return DetectResponse(
            ai_probability=0.5,
            human_probability=0.5,
            confidence=0.0,
            model_name="error - model not loaded"
        )

    try:
        # Tokenize input
        inputs = tokenizer(
            request.text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(device)

        # Run inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)

        # Get AI probability (assumes label 1 = AI, label 0 = Human)
        # Adjust based on your model's label mapping
        ai_prob = probabilities[0][1].item()
        human_prob = probabilities[0][0].item()

        # Confidence is the difference between the two
        confidence = abs(ai_prob - human_prob)

        return DetectResponse(
            ai_probability=round(ai_prob, 4),
            human_probability=round(human_prob, 4),
            confidence=round(confidence, 4),
            model_name="roberta-base-openai-detector"
        )

    except Exception as e:
        print(f"Detection error: {e}")
        return DetectResponse(
            ai_probability=0.5,
            human_probability=0.5,
            confidence=0.0,
            model_name=f"error: {str(e)}"
        )

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": device
    }

@app.get("/")
async def root():
    return {
        "name": "AI Detection Model Server",
        "status": "running",
        "device": device,
        "model_loaded": model is not None
    }

if __name__ == "__main__":
    print("🚀 Starting AI Detection Model Server")
    print("   This server runs the AI model and exposes an API")
    print("   Your main backend will call this server")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=5000)
