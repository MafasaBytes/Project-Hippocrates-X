"""Analytics service — aggregate intelligence across patients and operations.

Provides consultation stats, modality usage, demographics, AI performance,
doctor activity, and risk cohort groupings.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from collections import Counter

from sqlalchemy import func, select, case, extract
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import (
    AnalysisResult,
    Consultation,
    ConsultationInput,
    ConsultationStatus,
    Doctor,
    FollowUp,
    FollowUpStatus,
    InputType,
    Patient,
)


class AnalyticsService:
    """Read-only analytics queries over the Hippocrates-X data."""

    async def consultation_stats(
        self,
        session: AsyncSession,
        *,
        days: int = 30,
        doctor_id: uuid.UUID | None = None,
    ) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        base = select(Consultation).where(Consultation.started_at >= cutoff)
        if doctor_id:
            base = base.where(Consultation.doctor_id == doctor_id)

        result = await session.execute(base)
        consultations = list(result.scalars().all())

        total = len(consultations)
        completed = sum(1 for c in consultations if c.status == ConsultationStatus.COMPLETED)
        active = sum(1 for c in consultations if c.status == ConsultationStatus.ACTIVE)
        cancelled = sum(1 for c in consultations if c.status == ConsultationStatus.CANCELLED)

        durations = []
        for c in consultations:
            if c.ended_at and c.started_at:
                dur = (c.ended_at - c.started_at).total_seconds()
                durations.append(dur)

        avg_duration_min = (sum(durations) / len(durations) / 60) if durations else 0

        by_day: dict[str, int] = Counter()
        for c in consultations:
            day_key = c.started_at.strftime("%Y-%m-%d")
            by_day[day_key] += 1

        return {
            "period_days": days,
            "total": total,
            "completed": completed,
            "active": active,
            "cancelled": cancelled,
            "completion_rate": round(completed / total * 100, 1) if total else 0,
            "avg_duration_minutes": round(avg_duration_min, 1),
            "by_day": dict(sorted(by_day.items())),
        }

    async def modality_usage(self, session: AsyncSession) -> dict:
        stmt = (
            select(
                ConsultationInput.input_type,
                func.count(ConsultationInput.id),
            )
            .group_by(ConsultationInput.input_type)
        )
        result = await session.execute(stmt)
        rows = result.all()

        usage = {r[0].value: r[1] for r in rows}
        total = sum(usage.values())
        return {
            "counts": usage,
            "total_inputs": total,
            "percentages": {
                k: round(v / total * 100, 1) if total else 0
                for k, v in usage.items()
            },
        }

    async def patient_demographics(self, session: AsyncSession) -> dict:
        patients_result = await session.execute(select(Patient))
        patients = list(patients_result.scalars().all())

        gender_dist: dict[str, int] = Counter()
        city_dist: dict[str, int] = Counter()
        has_allergies = 0
        has_chronic = 0

        for p in patients:
            g = p.gender.value if p.gender else "unspecified"
            gender_dist[g] += 1
            if p.city:
                city_dist[p.city] += 1
            if p.allergies:
                has_allergies += 1
            if p.chronic_conditions:
                has_chronic += 1

        return {
            "total_patients": len(patients),
            "gender_distribution": dict(gender_dist),
            "top_cities": dict(city_dist.most_common(10)),
            "patients_with_allergies": has_allergies,
            "patients_with_chronic_conditions": has_chronic,
        }

    async def ai_performance(self, session: AsyncSession, *, days: int = 30) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = select(AnalysisResult).where(AnalysisResult.created_at >= cutoff)
        result = await session.execute(stmt)
        analyses = list(result.scalars().all())

        total = len(analyses)
        models_used: dict[str, int] = Counter()
        total_input_tokens = 0
        total_output_tokens = 0

        for a in analyses:
            r = a.result if isinstance(a.result, dict) else {}
            model = r.get("model", "unknown")
            models_used[model] += 1
            total_input_tokens += r.get("input_tokens", 0)
            total_output_tokens += r.get("output_tokens", 0)

        modalities_used: dict[str, int] = Counter()
        for a in analyses:
            r = a.result if isinstance(a.result, dict) else {}
            for m in r.get("context_modalities", []):
                modalities_used[m] += 1

        return {
            "period_days": days,
            "total_analyses": total,
            "models_used": dict(models_used),
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "avg_input_tokens": round(total_input_tokens / total) if total else 0,
            "avg_output_tokens": round(total_output_tokens / total) if total else 0,
            "modalities_in_context": dict(modalities_used),
        }

    async def doctor_activity(
        self, session: AsyncSession, doctor_id: uuid.UUID
    ) -> dict:
        doctor = await session.get(Doctor, doctor_id)
        if not doctor:
            return {"error": "Doctor not found"}

        cons_stmt = select(Consultation).where(Consultation.doctor_id == doctor_id)
        result = await session.execute(cons_stmt)
        consultations = list(result.scalars().all())

        total = len(consultations)
        completed = sum(1 for c in consultations if c.status == ConsultationStatus.COMPLETED)

        fu_stmt = select(FollowUp).where(FollowUp.doctor_id == doctor_id)
        fu_result = await session.execute(fu_stmt)
        follow_ups = list(fu_result.scalars().all())

        pending_fus = sum(1 for f in follow_ups if f.status == FollowUpStatus.PENDING)
        overdue_fus = sum(1 for f in follow_ups if f.status == FollowUpStatus.OVERDUE)

        return {
            "doctor_id": str(doctor_id),
            "doctor_name": doctor.name,
            "specialization": doctor.specialization,
            "total_consultations": total,
            "completed_consultations": completed,
            "total_follow_ups": len(follow_ups),
            "pending_follow_ups": pending_fus,
            "overdue_follow_ups": overdue_fus,
        }

    async def risk_cohorts(self, session: AsyncSession) -> dict:
        """Group patients by risk level based on chronic conditions count."""
        patients_result = await session.execute(select(Patient))
        patients = list(patients_result.scalars().all())

        cohorts: dict[str, list[dict]] = {"high": [], "medium": [], "low": []}

        for p in patients:
            conditions = p.chronic_conditions or []
            allergies = p.allergies or []
            score = len(conditions) * 2 + len(allergies)

            entry = {
                "patient_id": str(p.id),
                "name": p.name,
                "chronic_conditions": conditions,
                "allergies": allergies,
                "risk_score": score,
            }

            if score >= 4:
                cohorts["high"].append(entry)
            elif score >= 2:
                cohorts["medium"].append(entry)
            else:
                cohorts["low"].append(entry)

        for key in cohorts:
            cohorts[key].sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "high_risk_count": len(cohorts["high"]),
            "medium_risk_count": len(cohorts["medium"]),
            "low_risk_count": len(cohorts["low"]),
            "cohorts": cohorts,
        }

    async def follow_up_stats(self, session: AsyncSession) -> dict:
        result = await session.execute(select(FollowUp))
        follow_ups = list(result.scalars().all())

        by_status: dict[str, int] = Counter()
        by_type: dict[str, int] = Counter()
        ai_generated = 0

        for fu in follow_ups:
            by_status[fu.status.value] += 1
            by_type[fu.follow_up_type.value] += 1
            if fu.ai_generated:
                ai_generated += 1

        return {
            "total": len(follow_ups),
            "by_status": dict(by_status),
            "by_type": dict(by_type),
            "ai_generated": ai_generated,
            "manual": len(follow_ups) - ai_generated,
        }
