"""Doctor CRUD endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import DoctorCreate, DoctorOut
from src.db import repositories as repo

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.post("", response_model=DoctorOut, status_code=201)
async def create_doctor(
    body: DoctorCreate,
    db: AsyncSession = Depends(get_db),
):
    return await repo.create_doctor(db, name=body.name, specialization=body.specialization)


@router.get("/{doctor_id}", response_model=DoctorOut)
async def get_doctor(
    doctor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    doctor = await repo.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    return doctor
