"""Analytics endpoints — aggregate intelligence across the platform."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.services.analytics import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_analytics() -> AnalyticsService:
    return AnalyticsService()


@router.get("/consultations")
async def consultation_stats(
    days: int = Query(30, ge=1, le=365),
    doctor_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.consultation_stats(db, days=days, doctor_id=doctor_id)


@router.get("/modalities")
async def modality_usage(
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.modality_usage(db)


@router.get("/demographics")
async def patient_demographics(
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.patient_demographics(db)


@router.get("/ai-performance")
async def ai_performance(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.ai_performance(db, days=days)


@router.get("/doctors/{doctor_id}")
async def doctor_activity(
    doctor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    result = await svc.doctor_activity(db, doctor_id)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result


@router.get("/risk-cohorts")
async def risk_cohorts(
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.risk_cohorts(db)


@router.get("/follow-ups")
async def follow_up_stats(
    db: AsyncSession = Depends(get_db),
    svc: AnalyticsService = Depends(_get_analytics),
):
    return await svc.follow_up_stats(db)
