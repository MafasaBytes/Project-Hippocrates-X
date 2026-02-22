"""Patient CRUD + search endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import PatientCreate, PatientOut
from src.db import repositories as repo

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("", response_model=list[PatientOut])
async def search_patients(
    q: str = Query("", min_length=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    if not q:
        return []
    return await repo.search_patients(db, q, limit=limit)


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    return await repo.create_patient(
        db,
        name=body.name,
        date_of_birth=body.date_of_birth,
        medical_record_number=body.medical_record_number,
    )


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient
