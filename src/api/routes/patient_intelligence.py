"""Patient Intelligence endpoints — deep-dive AI analysis outside consultations."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_fusion
from src.db import repositories as repo
from src.services.fusion import FusionOrchestrator
from src.services.patient_intelligence import PatientIntelligenceService

router = APIRouter(prefix="/api/patients/{patient_id}/intelligence", tags=["patient-intelligence"])


def _get_intelligence_service(
    fusion: FusionOrchestrator = Depends(get_fusion),
) -> PatientIntelligenceService:
    return PatientIntelligenceService(fusion=fusion)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3)


class DifferentialRequest(BaseModel):
    symptoms: list[str] = Field(..., min_length=1)


class TreatmentCompareRequest(BaseModel):
    options: list[str] = Field(..., min_length=2)


class IntelligenceResponse(BaseModel):
    type: str
    patient_id: str
    response: str
    model: str
    generated_at: str
    question: str | None = None
    symptoms: list[str] | None = None
    options: list[str] | None = None
    error: str | None = None


async def _ensure_patient(db: AsyncSession, patient_id: uuid.UUID):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient


@router.post("/deep-dive", response_model=IntelligenceResponse)
async def deep_dive(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    svc: PatientIntelligenceService = Depends(_get_intelligence_service),
):
    """Full AI deep-dive on a patient's complete clinical picture."""
    await _ensure_patient(db, patient_id)
    return await svc.deep_dive(db, patient_id)


@router.post("/ask", response_model=IntelligenceResponse)
async def ask_about_patient(
    patient_id: uuid.UUID,
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
    svc: PatientIntelligenceService = Depends(_get_intelligence_service),
):
    """Freeform AI question about a specific patient with full history context."""
    await _ensure_patient(db, patient_id)
    return await svc.ask(db, patient_id, body.question)


@router.post("/differential", response_model=IntelligenceResponse)
async def differential_diagnosis(
    patient_id: uuid.UUID,
    body: DifferentialRequest,
    db: AsyncSession = Depends(get_db),
    svc: PatientIntelligenceService = Depends(_get_intelligence_service),
):
    """AI-generated differential diagnosis considering the patient's full history."""
    await _ensure_patient(db, patient_id)
    return await svc.differential_diagnosis(db, patient_id, body.symptoms)


@router.post("/compare-treatments", response_model=IntelligenceResponse)
async def compare_treatments(
    patient_id: uuid.UUID,
    body: TreatmentCompareRequest,
    db: AsyncSession = Depends(get_db),
    svc: PatientIntelligenceService = Depends(_get_intelligence_service),
):
    """Compare treatment options considering patient allergies, conditions, and history."""
    await _ensure_patient(db, patient_id)
    return await svc.compare_treatments(db, patient_id, body.options)
