"""Configuration for AI Detection Engine"""

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    # Models
    MODEL_NAME: str = "distilbert-base-uncased"
    MODEL_CACHE_DIR: str = "./models"
    DEVICE: str = "cpu"  # or "cuda" for GPU

    # Detection
    MIN_TEXT_LENGTH: int = 20
    MAX_TEXT_LENGTH: int = 5000

    # Ensemble weights
    PATTERN_WEIGHT: float = 0.40
    STATISTICAL_WEIGHT: float = 0.30
    ML_WEIGHT: float = 0.30

    # Thresholds
    AI_THRESHOLD: float = 0.85
    LIKELY_AI_THRESHOLD: float = 0.65
    MIXED_THRESHOLD: float = 0.45
    LIKELY_HUMAN_THRESHOLD: float = 0.25

    class Config:
        env_file = ".env"

settings = Settings()
