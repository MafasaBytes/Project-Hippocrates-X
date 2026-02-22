"""Consultation session lifecycle management.

Handles starting sessions, adding inputs, running analysis,
ending sessions with AI-generated summaries, and persisting everything to the DB.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from src.db import repositories as repo
from src.db.models import ConsultationStatus, ConsultationType, InputType
from src.services.fusion import FusionOrchestrator


class ConsultationService:
    def __init__(self, fusion: FusionOrchestrator):
        self._fusion = fusion

    async def start(
        self,
        session: AsyncSession,
        *,
        doctor_id: uuid.UUID,
        patient_id: uuid.UUID,
        consultation_type: ConsultationType,
    ) -> dict:
        consultation = await repo.create_consultation(
            session,
            doctor_id=doctor_id,
            patient_id=patient_id,
            consultation_type=consultation_type,
        )
        return {
            "consultation_id": str(consultation.id),
            "status": consultation.status.value,
            "started_at": consultation.started_at.isoformat(),
            "type": consultation.consultation_type.value,
        }

    async def add_input(
        self,
        session: AsyncSession,
        *,
        consultation_id: uuid.UUID,
        input_type: InputType,
        file_path: str | None = None,
        raw_text: str | None = None,
    ) -> dict:
        inp = await repo.add_input(
            session,
            consultation_id=consultation_id,
            input_type=input_type,
            file_path=file_path,
            raw_text=raw_text,
        )
        return {
            "input_id": str(inp.id),
            "type": inp.input_type.value,
            "created_at": inp.created_at.isoformat(),
        }

    async def run_analysis(
        self,
        session: AsyncSession,
        *,
        consultation_id: uuid.UUID,
        prompt: str,
        image_path: str | Path | None = None,
        clinical_text: str | None = None,
        audio_path: str | Path | None = None,
        input_id: uuid.UUID | None = None,
    ) -> dict:
        """Run multi-modal analysis within a consultation context."""
        result = self._fusion.analyze(
            prompt,
            image_path=image_path,
            clinical_text=clinical_text,
            audio_path=audio_path,
        )

        analysis = await repo.save_analysis(
            session,
            consultation_id=consultation_id,
            prompt=prompt,
            result=result,
            input_id=input_id,
            embedding=result.get("embedding"),
        )

        return {
            "analysis_id": str(analysis.id),
            "response": result["response"],
            "model": result["model"],
            "modalities_used": result.get("context_modalities", []),
        }

    async def end(
        self,
        session: AsyncSession,
        consultation_id: uuid.UUID,
        *,
        generate_summary: bool = True,
    ) -> dict:
        consultation = await repo.get_consultation(session, consultation_id)
        if consultation is None:
            raise ValueError(f"Consultation {consultation_id} not found")

        summary = None
        if generate_summary and consultation.analysis_results:
            summary = self._generate_summary(consultation)

        updated = await repo.end_consultation(session, consultation_id, summary=summary)
        return {
            "consultation_id": str(updated.id),
            "status": updated.status.value,
            "ended_at": updated.ended_at.isoformat() if updated.ended_at else None,
            "summary": updated.summary,
        }

    def _generate_summary(self, consultation) -> str:
        """Build a post-session summary from all analysis results."""
        all_responses = []
        for ar in consultation.analysis_results:
            response = ar.result.get("response", "") if isinstance(ar.result, dict) else ""
            if response:
                all_responses.append(f"- {response[:500]}")

        combined = "\n".join(all_responses)
        if not combined:
            return "No analysis was performed during this consultation."

        summary_prompt = (
            "Summarize the following consultation analysis results into a concise "
            "clinical summary suitable for medical records:\n\n" + combined
        )

        result = self._fusion.reasoning.generate(summary_prompt, max_new_tokens=512, temperature=0.2)
        return result["response"]
