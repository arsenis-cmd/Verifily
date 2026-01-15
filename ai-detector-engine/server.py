"""FastAPI server for AI Detection Engine"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn
import logging

from detector import EnsembleDetector
from config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Detection Engine",
    description="Local AI content detection service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
logger.info("Starting AI Detection Engine...")
detector = EnsembleDetector()
logger.info("AI Detection Engine ready!")

# Request/Response models
class DetectRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")

class DetectResponse(BaseModel):
    ai_probability: float = Field(..., ge=0, le=1, description="AI probability (0-1)")
    classification: str = Field(..., description="Classification: AI, LIKELY_AI, MIXED, LIKELY_HUMAN, HUMAN")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    scores: dict = Field(..., description="Individual detector scores")
    details: Optional[dict] = Field(None, description="Detailed analysis")
    inference_time_ms: float = Field(..., description="Inference time in milliseconds")
    weights_used: Optional[dict] = Field(None, description="Weights used in ensemble")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Detection Engine",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "detect": "POST /detect - Detect AI content",
            "health": "GET /health - Health check",
            "stats": "GET /stats - Detector statistics"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    stats = detector.get_stats()
    return {
        "status": "healthy",
        "ml_model_loaded": stats['ml_available'],
        "device": stats['device']
    }

@app.get("/stats")
async def stats():
    """Get detector statistics"""
    return detector.get_stats()

@app.post("/detect", response_model=DetectResponse)
async def detect(request: DetectRequest):
    """
    Detect AI-generated content in text

    Args:
        request: DetectRequest with text to analyze

    Returns:
        DetectResponse with detection results
    """
    try:
        result = detector.detect(request.text)

        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/test")
async def test():
    """Test endpoint with sample text"""
    test_cases = [
        {
            "name": "AI-like text",
            "text": "In conclusion, leveraging modern cloud infrastructure can facilitate robust and comprehensive solutions. It is important to note that utilizing best practices will delve into the core aspects of scalability."
        },
        {
            "name": "Human-like text",
            "text": "lol honestly i can't believe how much time i spent debugging this. turns out it was just a typo smh 🤦"
        }
    ]

    results = []
    for test in test_cases:
        result = detector.detect(test['text'])
        results.append({
            'name': test['name'],
            'text': test['text'][:100] + '...' if len(test['text']) > 100 else test['text'],
            'classification': result['classification'],
            'ai_probability': result['ai_probability'],
            'confidence': result['confidence']
        })

    return {
        "test_results": results,
        "detector_stats": detector.get_stats()
    }

def main():
    """Start the server"""
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()
