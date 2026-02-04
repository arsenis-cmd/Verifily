from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import init_db
from app.routes import detect_router, stats_router, attention_router
from app.routes.factcheck import router as factcheck_router
from app.routes.companion import router as companion_router
from app.routes.impressions import router as impressions_router
from app.routes.verify import router as verify_router

# ML Training Router (optional - may not be available)
try:
    from app.routes.ml import router as ml_router
    ML_ROUTER_AVAILABLE = True
except ImportError:
    ML_ROUTER_AVAILABLE = False
    logger.warning("ML router not available - training features disabled")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PoC MVP API...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("Running without database - verification features disabled")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="PoC MVP API",
    description="Proof of Consideration - AI Content Detection",
    version="0.1.0",
    lifespan=lifespan
)

# CORS - allow extension and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(detect_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
app.include_router(attention_router, prefix="/api/v1")
app.include_router(verify_router)  # Already has /api/v1 prefix
app.include_router(factcheck_router)
app.include_router(companion_router)
app.include_router(impressions_router)

# ML Training Router (if available)
if ML_ROUTER_AVAILABLE:
    app.include_router(ml_router)
    logger.info("ML training endpoints enabled at /api/v1/ml")

@app.get("/")
async def root():
    return {
        "name": "PoC MVP API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
# Force rebuild Wed Feb  4 12:49:21 JST 2026
