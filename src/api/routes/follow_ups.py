"""Follow-up management endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_fusion
from src.db import repositories as repo
from src.db.models import FollowUpStatus, FollowUpType
from src.services.follow_up import FollowUpService
from src.services.fusion import FusionOrchestrator

router = APIRouter(tags=["follow-ups"])


def _get_follow_up_service(
    fusion: FusionOrchestrator = Depends(get_fusion),
) -> FollowUpService:
    return FollowUpService(fusion=fusion)


class FollowUpOut(BaseModel):
    id: str
    consultation_id: str
    patient_id: str
    doctor_id: str
    type: str
    description: str
    due_date: str
    status: str
    ai_generated: bool
    ai_reasoning: str | None
    completed_at: str | None
    outcome_notes: str | None
    created_at: str | None


class FollowUpCreate(BaseModel):
    follow_up_type: str
    description: str
    due_date: str
    ai_reasoning: str | None = None


class FollowUpUpdate(BaseModel):
    status: str | None = None
    outcome_notes: str | None = None


def _follow_up_to_out(fu) -> FollowUpOut:
    return FollowUpOut(
        id=str(fu.id),
        consultation_id=str(fu.consultation_id),
        patient_id=str(fu.patient_id),
        doctor_id=str(fu.doctor_id),
        type=fu.follow_up_type.value,
        description=fu.description,
        due_date=fu.due_date.isoformat(),
        status=fu.status.value,
        ai_generated=fu.ai_generated,
        ai_reasoning=fu.ai_reasoning,
        completed_at=fu.completed_at.isoformat() if fu.completed_at else None,
        outcome_notes=fu.outcome_notes,
        created_at=fu.created_at.isoformat() if fu.created_at else None,
    )


@router.get("/api/follow-ups", response_model=list[FollowUpOut])
async def list_follow_ups(
    doctor_id: uuid.UUID | None = None,
    patient_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    status_enum = None
    if status:
        try:
            status_enum = FollowUpStatus(status)
        except ValueError:
            raise HTTPException(422, f"Invalid status: {status!r}")

    follow_ups = await repo.list_follow_ups(
        db, doctor_id=doctor_id, patient_id=patient_id, status=status_enum,
        limit=limit, offset=offset,
    )
    return [_follow_up_to_out(fu) for fu in follow_ups]


@router.get("/api/follow-ups/{follow_up_id}", response_model=FollowUpOut)
async def get_follow_up(
    follow_up_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    fu = await repo.get_follow_up(db, follow_up_id)
    if not fu:
        raise HTTPException(404, "Follow-up not found")
    return _follow_up_to_out(fu)


@router.patch("/api/follow-ups/{follow_up_id}", response_model=FollowUpOut)
async def update_follow_up(
    follow_up_id: uuid.UUID,
    body: FollowUpUpdate,
    db: AsyncSession = Depends(get_db),
    svc: FollowUpService = Depends(_get_follow_up_service),
):
    fu = await repo.get_follow_up(db, follow_up_id)
    if not fu:
        raise HTTPException(404, "Follow-up not found")

    if body.status == "completed":
        result = await svc.complete_follow_up(db, follow_up_id, body.outcome_notes)
    elif body.status == "cancelled":
        result = await svc.cancel_follow_up(db, follow_up_id)
    else:
        updates = {}
        if body.outcome_notes is not None:
            updates["outcome_notes"] = body.outcome_notes
        updated = await repo.update_follow_up(db, follow_up_id, **updates)
        if not updated:
            raise HTTPException(404, "Follow-up not found")
        return _follow_up_to_out(updated)

    if result is None:
        raise HTTPException(404, "Follow-up not found")
    return FollowUpOut(**result)


@router.post(
    "/api/consultations/{consultation_id}/follow-ups",
    response_model=FollowUpOut,
    status_code=201,
)
async def create_follow_up(
    consultation_id: uuid.UUID,
    body: FollowUpCreate,
    db: AsyncSession = Depends(get_db),
):
    """Manually create a follow-up for a consultation."""
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")

    from datetime import datetime

    try:
        fu_type = FollowUpType(body.follow_up_type)
    except ValueError:
        raise HTTPException(422, f"Invalid follow-up type: {body.follow_up_type!r}")

    due = datetime.fromisoformat(body.due_date)

    fu = await repo.create_follow_up(
        db,
        consultation_id=consultation_id,
        patient_id=consultation.patient_id,
        doctor_id=consultation.doctor_id,
        follow_up_type=fu_type,
        description=body.description,
        due_date=due,
        ai_generated=False,
        ai_reasoning=body.ai_reasoning,
    )
    return _follow_up_to_out(fu)


@router.post("/api/consultations/{consultation_id}/follow-ups/generate")
async def generate_follow_ups(
    consultation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    svc: FollowUpService = Depends(_get_follow_up_service),
):
    """AI-generate follow-up recommendations from consultation results."""
    consultation = await repo.get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Consultation not found")

    follow_ups = await svc.generate_follow_ups(db, consultation_id)
    return {"generated": len(follow_ups), "follow_ups": follow_ups}
