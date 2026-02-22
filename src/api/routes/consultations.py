"""Consultation CRUD and session management endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_consultation_service, get_db
from src.api.schemas import (
    ConsultationCreate,
    ConsultationDetail,
    ConsultationEndOut,
    ConsultationEndRequest,
    ConsultationOut,
    InputOut,
    TextInputCreate,
)
from src.db import repositories as repo
from src.db.models import InputType
from src.services.consultation import ConsultationService
from src.utils.file_handlers import classify_file, save_upload

router = APIRouter(prefix="/api/consultations", tags=["consultations"])


@router.post("", response_model=ConsultationOut, status_code=201)
async def start_consultation(
    body: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
    svc: ConsultationService = Depends(get_consultation_service),
):
    doctor = await repo.get_doctor(db, body.doctor_id)
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    patient = await repo.get_patient(db, body.patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")

    return await svc.start(
        db,
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        consultation_type=body.consultation_type,
    )


@router.get("/{consultation_id}", response_model=ConsultationDetail)
async def get_consultation(
    consultation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")
    return consultation


@router.get("", response_model=list[ConsultationDetail])
async def list_consultations(
    doctor_id: uuid.UUID | None = None,
    patient_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    return await repo.list_consultations(
        db, doctor_id=doctor_id, patient_id=patient_id, status=status, limit=limit, offset=offset
    )


@router.patch("/{consultation_id}", response_model=ConsultationEndOut)
async def end_consultation(
    consultation_id: uuid.UUID,
    body: ConsultationEndRequest | None = None,
    db: AsyncSession = Depends(get_db),
    svc: ConsultationService = Depends(get_consultation_service),
):
    try:
        return await svc.end(
            db, consultation_id, generate_summary=body.generate_summary if body else True
        )
    except ValueError as e:
        raise HTTPException(404, str(e))


# ── Inputs ──


@router.post("/{consultation_id}/inputs/text", response_model=InputOut, status_code=201)
async def add_text_input(
    consultation_id: uuid.UUID,
    body: TextInputCreate,
    db: AsyncSession = Depends(get_db),
    svc: ConsultationService = Depends(get_consultation_service),
):
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")
    return await svc.add_input(
        db, consultation_id=consultation_id, input_type=InputType.TEXT, raw_text=body.raw_text
    )


@router.post("/{consultation_id}/inputs/file", response_model=InputOut, status_code=201)
async def add_file_input(
    consultation_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    svc: ConsultationService = Depends(get_consultation_service),
):
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")

    file_type = classify_file(file.filename or "")
    if file_type is None:
        raise HTTPException(400, f"Unsupported file type: {file.filename}")

    content = await file.read()
    path = await save_upload(content, file.filename or "upload", str(consultation_id))

    return await svc.add_input(
        db,
        consultation_id=consultation_id,
        input_type=InputType(file_type),
        file_path=str(path),
    )
