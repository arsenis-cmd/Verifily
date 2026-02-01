"""
ML Training and Management Endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.ml.training_data_collector import training_collector
from app.ml.model_trainer import model_trainer

router = APIRouter(prefix="/api/v1/ml", tags=["machine-learning"])


class TrainRequest(BaseModel):
    min_examples: int = 100
    num_epochs: int = 3
    batch_size: int = 16
    learning_rate: float = 2e-5


@router.get("/training-data/stats")
async def get_training_stats():
    """
    Get statistics about collected training data
    """
    stats = await training_collector.get_stats()
    return {
        "success": True,
        "stats": stats,
        "ready_for_training": stats['available_for_training'] >= 100
    }


@router.post("/train")
async def train_model(request: TrainRequest):
    """
    Trigger model fine-tuning on collected data
    Requires at least 100 verified examples
    """
    # Check if we have enough data
    stats = await training_collector.get_stats()

    if stats['available_for_training'] < request.min_examples:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough training data. Have {stats['available_for_training']}, need {request.min_examples}"
        )

    # Start training (async - this takes a while)
    try:
        result = await model_trainer.fine_tune(
            num_epochs=request.num_epochs,
            batch_size=request.batch_size,
            learning_rate=request.learning_rate,
            min_examples=request.min_examples
        )

        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Training failed - not enough data or other error"
            )

        return {
            "success": True,
            "message": "Model training complete",
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {str(e)}"
        )


@router.get("/models")
async def list_models():
    """
    List all trained models
    """
    latest_model = model_trainer.get_latest_model()

    if latest_model is None:
        return {
            "success": True,
            "models": [],
            "latest": None
        }

    # Read metadata
    import json
    metadata_path = latest_model / 'metadata.json'
    if metadata_path.exists():
        with open(metadata_path) as f:
            metadata = json.load(f)
    else:
        metadata = {}

    return {
        "success": True,
        "models": [str(latest_model)],
        "latest": {
            "path": str(latest_model),
            **metadata
        }
    }


@router.post("/export-data")
async def export_training_data(output_path: str = "training_data.jsonl"):
    """
    Export collected training data to JSONL format
    """
    try:
        count = await training_collector.export_for_training(output_path)
        return {
            "success": True,
            "message": f"Exported {count} examples to {output_path}",
            "count": count,
            "path": output_path
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )
