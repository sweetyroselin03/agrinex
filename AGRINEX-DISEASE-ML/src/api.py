"""
AgriNex Disease ML - Backend API Service (Model V2-B Integration + Local AI Chatbot)

FastAPI server providing real-time crop disease prediction and system health monitoring
for the AgriNex mobile and web applications using Model V2-B (60 classes) and an offline AI chatbot.

Usage:
    uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
import io
from pathlib import Path
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

# Add src directory to path
src_dir = Path(__file__).resolve().parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from predict_disease import AgriNexDiseasePredictor
from agri_chatbot import AgriNexChatbot

# Global predictor & chatbot instances
predictor: Optional[AgriNexDiseasePredictor] = None
chatbot: Optional[AgriNexChatbot] = None


class ChatContext(BaseModel):
    plant: Optional[str] = Field(None, description="Plant/crop name from latest prediction")
    disease: Optional[str] = Field(None, description="Disease name from latest prediction")
    status: Optional[str] = Field(None, description="Status: Healthy, Diseased, or Uncertain")
    confidence: Optional[float] = Field(None, description="Model prediction confidence score")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query message")
    context: Optional[ChatContext] = Field(None, description="Optional prediction context")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load Model V2-B and local chatbot knowledge on startup."""
    global predictor, chatbot
    BASE_DIR = Path(__file__).resolve().parent.parent
    v2b_model_path = BASE_DIR / "models" / "agrinex_disease_model_v2b_best.pth"
    knowledge_path = BASE_DIR / "data" / "chatbot_knowledge.json"

    print("🚀 Initializing AgriNex Model V2-B in memory...")
    try:
        predictor = AgriNexDiseasePredictor(model_path=v2b_model_path)
        print("✅ AgriNex Model V2-B successfully loaded into memory!")
    except Exception as e:
        print(f"❌ Critical Error loading AgriNex model: {e}")
        predictor = None

    print("🤖 Loading AgriNex Local Agricultural Chatbot Knowledge Base...")
    try:
        chatbot = AgriNexChatbot(knowledge_path=knowledge_path)
        print("✅ AgriNex Local Chatbot successfully loaded into memory!")
    except Exception as e:
        print(f"❌ Error loading chatbot knowledge base: {e}")
        chatbot = None

    yield

    print("🛑 Shutting down AgriNex API service...")


app = FastAPI(
    title="AgriNex Disease ML API (V2-B + Chatbot)",
    description="Production-grade AI disease detection and offline agricultural chatbot service for AgriNex.",
    version="2.1.0",
    lifespan=lifespan
)

# CORS middleware for cross-origin frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", summary="Health Check & Model Status")
async def health_check() -> Dict[str, Any]:
    """Endpoint returning API health status, loaded model state, device, chatbot state, and class count."""
    if predictor is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "model_loaded": False,
                "chatbot_loaded": chatbot is not None,
                "device": None,
                "number_of_classes": 0,
                "error": "Model V2-B failed to initialize"
            }
        )

    return {
        "status": "ok",
        "model_loaded": True,
        "chatbot_loaded": chatbot is not None,
        "device": str(predictor.device),
        "number_of_classes": predictor.num_classes,
        "model_version": "V2-B (60 classes)"
    }


@app.post("/predict", summary="Predict Crop Disease from Uploaded Image")
async def predict(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts an uploaded crop image file via multipart/form-data (.jpg, .jpeg, .png, .webp),
    runs V2-B disease inference, applies OOD low-confidence threshold guard,
    and returns structured diagnostic JSON.
    """
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AgriNex disease model is not initialized or unavailable."
        )

    # 1. Validate file format
    filename = file.filename or ""
    file_ext = Path(filename).suffix.lower()
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    if file_ext not in valid_extensions and not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format '{file_ext}'. Supported formats: JPG, JPEG, PNG, WEBP."
        )

    # 2. Decode Image
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise ValueError("Uploaded image file is empty.")

        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or unreadable image file: {str(e)}"
        )

    # 3. Perform Prediction
    try:
        prediction_result = predictor.predict(image)
        return prediction_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference processing error: {str(e)}"
        )


@app.post("/chat", summary="Conversational Agricultural AI Chatbot")
async def chat(request: ChatRequest) -> Dict[str, Any]:
    """
    Processes user agricultural question, resolves prediction context if provided,
    searches offline local knowledge base, and returns structured chatbot answer.
    """
    if chatbot is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AgriNex Chatbot service is not initialized or unavailable."
        )

    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message field cannot be empty."
        )

    context_dict = request.context.model_dump() if request.context else None

    try:
        response_data = chatbot.ask(request.message, context=context_dict)
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot processing error: {str(e)}"
        )
