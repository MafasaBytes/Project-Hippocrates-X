"""FastAPI application factory for Project Hippocrates X."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routes import analysis, consultations, doctors, patients, search, transcription
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Project Hippocrates X",
        description=(
            "Multi-modal medical doctor assistant powered by pre-trained "
            "HuggingFace models. Fuses vision (CXformer), NLP (Bio_ClinicalBERT), "
            "audio (Whisper), and reasoning (OpenBioLLM) to support clinical "
            "decision-making."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(doctors.router)
    app.include_router(patients.router)
    app.include_router(consultations.router)
    app.include_router(analysis.router)
    app.include_router(search.router)
    app.include_router(transcription.router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "project": "Hippocrates X"}

    return app


app = create_app()
