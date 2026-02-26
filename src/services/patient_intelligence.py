"""Patient Intelligence service — deep-dive analysis outside consultations.

Gives doctors AI-powered tools to critically analyze a patient's full clinical
picture at any time, without requiring an active consultation session.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.db import repositories as repo
from src.services.fusion import FusionOrchestrator


class PatientIntelligenceService:
    def __init__(self, fusion: FusionOrchestrator):
        self._fusion = fusion

    async def _get_full_context(self, session: AsyncSession, patient_id: uuid.UUID) -> dict:
        """Build an extended patient history including analysis result details."""
        history = await repo.get_patient_history_summary(session, patient_id)
        if not history:
            return {}

        analysis_details = await repo.get_patient_analysis_details(session, patient_id)
        history["analysis_details"] = analysis_details
        return history

    async def deep_dive(
        self,
        session: AsyncSession,
        patient_id: uuid.UUID,
    ) -> dict:
        """Full patient deep-dive: patterns, risks, trends, and recommendations."""
        context = await self._get_full_context(session, patient_id)
        if not context.get("patient_name"):
            return {"error": "Patient not found or has no data."}

        prompt = (
            "Perform a comprehensive deep-dive analysis on this patient. "
            "Address each of the following:\n\n"
            "1. PATTERN RECOGNITION: Identify patterns across all visits and records.\n"
            "2. RISK FACTORS: Identify current and emerging risk factors.\n"
            "3. MEDICATION INTERACTIONS: Flag potential medication interactions "
            "from prescriptions in the records.\n"
            "4. TREND ANALYSIS: Are symptoms worsening, stable, or improving over time?\n"
            "5. AREAS OF CONCERN: What should be monitored closely?\n"
            "6. RECOMMENDED NEXT STEPS: Suggest concrete clinical next steps.\n\n"
            "For each finding, state your confidence level (high/medium/low) and "
            "cite the specific records or consultations that support it."
        )

        result = await asyncio.to_thread(
            self._fusion.reasoning.generate,
            prompt,
            [{"modality": "patient_history", **context}],
            max_new_tokens=2048,
            temperature=0.2,
        )

        return {
            "type": "deep_dive",
            "patient_id": str(patient_id),
            "response": result["response"],
            "model": result["model"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def ask(
        self,
        session: AsyncSession,
        patient_id: uuid.UUID,
        question: str,
    ) -> dict:
        """Freeform question about a patient with full history context."""
        context = await self._get_full_context(session, patient_id)
        if not context.get("patient_name"):
            return {"error": "Patient not found or has no data."}

        prompt = (
            f"A doctor asks the following question about this patient:\n\n"
            f"\"{question}\"\n\n"
            "Answer thoroughly using the patient's full clinical history. "
            "Cite specific records and consultations where relevant. "
            "State your confidence level and flag any uncertainties."
        )

        result = await asyncio.to_thread(
            self._fusion.reasoning.generate,
            prompt,
            [{"modality": "patient_history", **context}],
            max_new_tokens=1536,
            temperature=0.3,
        )

        return {
            "type": "ask",
            "patient_id": str(patient_id),
            "question": question,
            "response": result["response"],
            "model": result["model"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def differential_diagnosis(
        self,
        session: AsyncSession,
        patient_id: uuid.UUID,
        symptoms: list[str],
    ) -> dict:
        """Generate differential diagnosis considering the patient's full history."""
        context = await self._get_full_context(session, patient_id)
        if not context.get("patient_name"):
            return {"error": "Patient not found or has no data."}

        symptoms_text = ", ".join(symptoms)
        prompt = (
            f"The patient presents with the following new symptoms: {symptoms_text}\n\n"
            "Considering the patient's full clinical history (allergies, chronic "
            "conditions, past consultations, lab results, and medications), generate "
            "a ranked differential diagnosis.\n\n"
            "For each diagnosis:\n"
            "- State the condition name\n"
            "- Likelihood (high/medium/low)\n"
            "- Supporting evidence from the patient's history\n"
            "- Recommended diagnostic steps to confirm or rule out\n"
            "- Any contraindicated tests or treatments given the patient's profile"
        )

        result = await asyncio.to_thread(
            self._fusion.reasoning.generate,
            prompt,
            [{"modality": "patient_history", **context}],
            max_new_tokens=2048,
            temperature=0.2,
        )

        return {
            "type": "differential_diagnosis",
            "patient_id": str(patient_id),
            "symptoms": symptoms,
            "response": result["response"],
            "model": result["model"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def compare_treatments(
        self,
        session: AsyncSession,
        patient_id: uuid.UUID,
        options: list[str],
    ) -> dict:
        """Compare treatment options given patient allergies, conditions, and history."""
        context = await self._get_full_context(session, patient_id)
        if not context.get("patient_name"):
            return {"error": "Patient not found or has no data."}

        options_text = "\n".join(f"- {opt}" for opt in options)
        prompt = (
            f"Compare the following treatment options for this patient:\n"
            f"{options_text}\n\n"
            "For each option, evaluate:\n"
            "- Suitability given the patient's allergies and chronic conditions\n"
            "- Potential drug interactions with current medications\n"
            "- Expected efficacy based on the patient's history\n"
            "- Side effect risks specific to this patient's profile\n"
            "- Contraindications\n\n"
            "Conclude with a recommendation ranking and rationale."
        )

        result = await asyncio.to_thread(
            self._fusion.reasoning.generate,
            prompt,
            [{"modality": "patient_history", **context}],
            max_new_tokens=2048,
            temperature=0.2,
        )

        return {
            "type": "treatment_comparison",
            "patient_id": str(patient_id),
            "options": options,
            "response": result["response"],
            "model": result["model"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
