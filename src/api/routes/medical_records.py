"""Medical record CRUD and patient timeline endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import (
    MedicalRecordCreate,
    MedicalRecordOut,
    RecordTypeEnum,
    TimelineConsultationEntry,
    TimelineMedicalRecordEntry,
)
from src.db import repositories as repo
from src.db.models import RecordType
from src.utils.file_handlers import save_upload

router = APIRouter(prefix="/api/patients/{patient_id}", tags=["medical-records"])


@router.post("/records", response_model=MedicalRecordOut, status_code=201)
async def create_record(
    patient_id: uuid.UUID,
    body: MedicalRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")

    record = await repo.create_medical_record(
        db,
        patient_id=patient_id,
        record_type=RecordType(body.record_type.value),
        title=body.title,
        description=body.description,
        raw_text=body.raw_text,
        metadata_json=body.metadata_json,
        record_date=body.record_date,
    )
    return record


@router.post("/records/upload", response_model=MedicalRecordOut, status_code=201)
async def upload_record(
    patient_id: uuid.UUID,
    file: UploadFile = File(...),
    record_type: str = Form(...),
    title: str = Form(...),
    record_date: str = Form(...),
    description: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")

    from datetime import datetime
    file_path = await save_upload(file, sub_dir=f"records/{patient_id}")
    parsed_date = datetime.fromisoformat(record_date)

    record = await repo.create_medical_record(
        db,
        patient_id=patient_id,
        record_type=RecordType(record_type),
        title=title,
        description=description,
        file_path=file_path,
        record_date=parsed_date,
    )
    return record


@router.get("/records", response_model=list[MedicalRecordOut])
async def list_records(
    patient_id: uuid.UUID,
    record_type: RecordTypeEnum | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    rt = RecordType(record_type.value) if record_type else None
    return await repo.list_medical_records(
        db, patient_id, record_type=rt, limit=limit, offset=offset
    )


@router.get("/records/{record_id}", response_model=MedicalRecordOut)
async def get_record(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    record = await repo.get_medical_record(db, record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(404, "Record not found")
    return record


@router.delete("/records/{record_id}", status_code=204)
async def delete_record(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    record = await repo.get_medical_record(db, record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(404, "Record not found")
    await repo.delete_medical_record(db, record_id)


@router.get("/timeline")
async def get_timeline(
    patient_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return await repo.get_patient_timeline(db, patient_id, limit=limit)
