"""Multi-modal analysis endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_consultation_service, get_db, get_fusion
from src.api.schemas import AnalysisOut, AnalysisRequest, StandaloneAnalysisRequest
from src.db import repositories as repo
from src.services.consultation import ConsultationService
from src.services.fusion import FusionOrchestrator
from src.utils.file_handlers import save_upload

router = APIRouter(tags=["analysis"])


@router.post(
    "/api/consultations/{consultation_id}/analyze",
    response_model=AnalysisOut,
)
async def analyze_in_consultation(
    consultation_id: uuid.UUID,
    body: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
    svc: ConsultationService = Depends(get_consultation_service),
):
    """Run multi-modal analysis within an active consultation.

    Attach images/audio via the /inputs endpoints first, then reference
    them with input_id, or provide clinical_text inline.
    """
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")

    image_path = None
    audio_path = None

    if body.input_id:
        for inp in consultation.inputs:
            if inp.id == body.input_id:
                if inp.input_type.value == "image":
                    image_path = inp.file_path
                elif inp.input_type.value == "audio":
                    audio_path = inp.file_path
                break

    return await svc.run_analysis(
        db,
        consultation_id=consultation_id,
        prompt=body.prompt,
        image_path=image_path,
        clinical_text=body.clinical_text,
        audio_path=audio_path,
        input_id=body.input_id,
    )


@router.post("/api/analyze", response_model=AnalysisOut)
async def standalone_analysis(
    body: StandaloneAnalysisRequest,
    fusion: FusionOrchestrator = Depends(get_fusion),
):
    """Run multi-modal analysis without a consultation context.

    Useful for quick one-off questions with optional clinical text.
    """
    result = fusion.analyze(body.prompt, clinical_text=body.clinical_text)
    return AnalysisOut(
        analysis_id="standalone",
        response=result["response"],
        model=result["model"],
        modalities_used=result.get("context_modalities", []),
    )
