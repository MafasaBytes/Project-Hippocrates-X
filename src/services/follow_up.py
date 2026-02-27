"""AI-powered follow-up engine.

Generates intelligent follow-up recommendations after consultations end,
tracks their completion, and flags overdue items.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.db import repositories as repo
from src.db.models import FollowUpStatus, FollowUpType
from src.services.fusion import FusionOrchestrator


_TYPE_MAP = {
    "appointment": FollowUpType.APPOINTMENT,
    "lab_check": FollowUpType.LAB_CHECK,
    "medication_review": FollowUpType.MEDICATION_REVIEW,
    "symptom_check": FollowUpType.SYMPTOM_CHECK,
    "custom": FollowUpType.CUSTOM,
}


class FollowUpService:
    def __init__(self, fusion: FusionOrchestrator):
        self._fusion = fusion

    async def generate_follow_ups(
        self,
        session: AsyncSession,
        consultation_id: uuid.UUID,
    ) -> list[dict]:
        """Analyze a completed consultation and generate follow-up recommendations."""
        consultation = await repo.get_consultation(session, consultation_id)
        if consultation is None:
            return []

        analysis_texts = []
        for ar in consultation.analysis_results:
            resp = ar.result.get("response", "") if isinstance(ar.result, dict) else ""
            if resp:
                analysis_texts.append(resp[:600])

        combined = "\n---\n".join(analysis_texts)
        if not combined and not consultation.summary:
            return []

        context = consultation.summary or ""
        if combined:
            context = f"Consultation Summary:\n{consultation.summary or 'N/A'}\n\nAnalysis Results:\n{combined}"

        prompt = (
            "Based on the following consultation results, generate specific follow-up "
            "recommendations. Return a JSON array where each item has:\n"
            '- "type": one of "appointment", "lab_check", "medication_review", "symptom_check", "custom"\n'
            '- "description": clear description of the follow-up action\n'
            '- "days_from_now": integer number of days until due\n'
            '- "reasoning": why this follow-up is recommended\n\n'
            "Generate 2-5 follow-ups. Be specific and clinically relevant.\n\n"
            f"Consultation data:\n{context}"
        )

        result = await asyncio.to_thread(
            self._fusion.reasoning.generate,
            prompt,
            max_new_tokens=1024,
            temperature=0.2,
        )

        follow_ups = self._parse_follow_ups(result.get("response", ""))
        created = []
        now = datetime.now(timezone.utc)

        for fu in follow_ups:
            fu_type = _TYPE_MAP.get(fu.get("type", "custom"), FollowUpType.CUSTOM)
            days = fu.get("days_from_now", 7)
            if not isinstance(days, int) or days < 1:
                days = 7

            record = await repo.create_follow_up(
                session,
                consultation_id=consultation_id,
                patient_id=consultation.patient_id,
                doctor_id=consultation.doctor_id,
                follow_up_type=fu_type,
                description=fu.get("description", "Follow-up required"),
                due_date=now + timedelta(days=days),
                ai_generated=True,
                ai_reasoning=fu.get("reasoning", ""),
            )
            created.append({
                "id": str(record.id),
                "type": record.follow_up_type.value,
                "description": record.description,
                "due_date": record.due_date.isoformat(),
                "ai_reasoning": record.ai_reasoning,
            })

        return created

    def _parse_follow_ups(self, text: str) -> list[dict]:
        """Extract JSON array from the LLM response, tolerating markdown fences."""
        text = text.strip()
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    text = part
                    break

        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1:
            return []

        try:
            data = json.loads(text[start:end + 1])
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass
        return []

    async def complete_follow_up(
        self,
        session: AsyncSession,
        follow_up_id: uuid.UUID,
        outcome_notes: str | None = None,
    ) -> dict | None:
        fu = await repo.update_follow_up(
            session,
            follow_up_id,
            status=FollowUpStatus.COMPLETED,
            completed_at=datetime.now(timezone.utc),
            outcome_notes=outcome_notes,
        )
        if fu is None:
            return None
        return self._to_dict(fu)

    async def cancel_follow_up(
        self,
        session: AsyncSession,
        follow_up_id: uuid.UUID,
    ) -> dict | None:
        fu = await repo.update_follow_up(
            session, follow_up_id, status=FollowUpStatus.CANCELLED
        )
        if fu is None:
            return None
        return self._to_dict(fu)

    async def check_overdue(self, session: AsyncSession) -> int:
        return await repo.mark_overdue_follow_ups(session)

    @staticmethod
    def _to_dict(fu) -> dict:
        return {
            "id": str(fu.id),
            "consultation_id": str(fu.consultation_id),
            "patient_id": str(fu.patient_id),
            "doctor_id": str(fu.doctor_id),
            "type": fu.follow_up_type.value,
            "description": fu.description,
            "due_date": fu.due_date.isoformat(),
            "status": fu.status.value,
            "ai_generated": fu.ai_generated,
            "ai_reasoning": fu.ai_reasoning,
            "completed_at": fu.completed_at.isoformat() if fu.completed_at else None,
            "outcome_notes": fu.outcome_notes,
            "created_at": fu.created_at.isoformat() if fu.created_at else None,
        }
