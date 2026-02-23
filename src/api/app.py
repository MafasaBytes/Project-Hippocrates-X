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

from src.api.routes import analysis, consultations, doctors, patients, search, transcription
from src.config import settings

logger = logging.getLogger(__name__)

_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "app" / "dist"

_CLEANUP_INTERVAL = 60  # seconds between idle-model sweeps
_cleanup_stop = threading.Event()


def _warmup_models() -> None:
    """Pre-load only the lightweight NLP model at startup.

    Heavier models (reasoning, vision, audio) are loaded on-demand via
    consultation-type hints or lazy property access.
    """
    from src.api.deps import get_fusion

    fusion = get_fusion()
    try:
        logger.info("Warming up NLP model (Bio_ClinicalBERT)…")
        _ = fusion.nlp
        logger.info("NLP model ready.")
    except Exception:
        logger.exception("NLP warm-up failed — will retry on first request")


def _idle_cleanup_loop() -> None:
    """Periodically unload models that have exceeded their idle TTL."""
    from src.api.deps import get_fusion

    fusion = get_fusion()
    while not _cleanup_stop.is_set():
        _cleanup_stop.wait(_CLEANUP_INTERVAL)
        if _cleanup_stop.is_set():
            break
        try:
            fusion.cleanup_idle()
        except Exception:
            logger.exception("Error during idle model cleanup")


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
    app.include_router(consultations.router)
    app.include_router(analysis.router)
    app.include_router(search.router)
    app.include_router(transcription.router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "project": "Hippocrates X"}

    @app.get("/health/models")
    async def health_models():
        from src.api.deps import get_fusion

        fusion = get_fusion()
        models = fusion.model_status()
        total_mb = sum(m["approx_memory_mb"] for m in models)
        return {
            "models": models,
            "total_loaded_memory_mb": round(total_mb, 1),
        }

    # -- Production static file serving --
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
