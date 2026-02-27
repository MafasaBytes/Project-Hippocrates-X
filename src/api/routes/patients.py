"""Patient CRUD + search endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import PatientCreate, PatientOut, PatientUpdate
from src.db import repositories as repo

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("", response_model=list[PatientOut])
async def list_or_search_patients(
    q: str = Query("", min_length=0),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    if q:
        return await repo.search_patients(db, q, limit=limit)
    return await repo.list_patients(db, limit=limit, offset=offset)


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    return await repo.create_patient(db, **body.model_dump(exclude_none=True))


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    patient = await repo.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: uuid.UUID,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No fields to update")
    patient = await repo.update_patient(db, patient_id, **updates)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient
