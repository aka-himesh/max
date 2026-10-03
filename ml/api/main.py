"""
FastAPI ML Service for Urban Issues & Pothole Detection
Port: 8001 (RULES.md Section 3)
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ..inference.detector import UrbanIssuesDetector
from ..model.classes import CLASSES

app = FastAPI(
    title="Urban Issues & Pothole ML Service",
    description="YOLOv8 Inference microservice for municipal defect detection",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = UrbanIssuesDetector()
detector.load_model()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ml-detector", "model": detector.model_name}

@app.get("/model/info")
async def model_info():
    return {
        "model_name": detector.model_name,
        "model_version": detector.model_version,
        "classes": CLASSES,
        "conf_threshold": detector.conf_threshold,
        "iou_threshold": detector.iou_threshold,
    }

@app.post("/detect")
async def detect_defects(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Unsupported media type. Image required.")
    
    image_bytes = await image.read()
    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 8 MB size limit.")

    result = detector.detect(image_bytes, filename=image.filename or "")
    return {"data": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
