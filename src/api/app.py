"""FastAPI application factory for Project Hippocrates X."""

from __future__ import annotations

# Disable the safetensors auto-conversion thread that crashes on repos with
# discussions disabled (e.g. aaditya/Llama3-OpenBioLLM-8B → 403 Forbidden).
# Must run before any transformers import.
try:
    import transformers.safetensors_conversion as _sc
    _sc.auto_conversion = lambda *a, **kw: None  # type: ignore[attr-defined]
except Exception:
    pass

import logging
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.routes import (
    analysis,
    analytics,
    consultations,
    doctors,
    follow_ups,
    medical_records,
    patients,
    patient_intelligence,
    search,
    transcription,
)
from src.config import settings

# Absolute path to the compiled React app (present in Docker, absent in dev)
_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "app" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    warmup_thread = threading.Thread(target=_warmup_models, daemon=True)
    warmup_thread.start()

    cleanup_thread = threading.Thread(target=_idle_cleanup_loop, daemon=True)
    cleanup_thread.start()

    yield

    _cleanup_stop.set()


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

    # In development the Vite dev server handles CORS; in production the
    # frontend is served from the same origin so CORS is only needed for
    # external clients or the Vite proxy during local dev.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(doctors.router)
    app.include_router(patients.router)
    app.include_router(medical_records.router)
    app.include_router(consultations.router)
    app.include_router(analysis.router)
    app.include_router(analytics.router)
    app.include_router(patient_intelligence.router)
    app.include_router(follow_ups.router)
    app.include_router(search.router)
    app.include_router(transcription.router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "project": "Hippocrates X"}

    # ── Production static file serving ────────────────────────────────────────
    # When the Docker image is built, the React app is compiled into app/dist/.
    # We mount the assets folder and add a catch-all that serves index.html for
    # any unknown path so React Router handles client-side navigation.
    if _FRONTEND_DIST.is_dir():
        app.mount(
            "/assets",
            StaticFiles(directory=_FRONTEND_DIST / "assets"),
            name="assets",
        )

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):  # noqa: ARG001
            return FileResponse(_FRONTEND_DIST / "index.html")

    return app

app = create_app()
