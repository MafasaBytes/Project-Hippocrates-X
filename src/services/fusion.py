"""Multi-modal fusion orchestrator.

Accepts any combination of inputs (image, text, audio) and a prompt,
runs each through its respective model, assembles context, and invokes
the reasoning LLM to produce a unified medical response.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from src.models.audio import AudioTranscriber
from src.models.nlp import ClinicalNLP
from src.models.reasoning import ReasoningEngine
from src.models.vision import VisionEncoder


class FusionOrchestrator:
    """Lazy-loads models on first use so startup stays fast."""

    def __init__(self):
        self._vision: VisionEncoder | None = None
        self._nlp: ClinicalNLP | None = None
        self._audio: AudioTranscriber | None = None
        self._reasoning: ReasoningEngine | None = None

    @property
    def vision(self) -> VisionEncoder:
        if self._vision is None:
            self._vision = VisionEncoder()
        return self._vision

    @property
    def nlp(self) -> ClinicalNLP:
        if self._nlp is None:
            self._nlp = ClinicalNLP()
        return self._nlp

    @property
    def audio(self) -> AudioTranscriber:
        if self._audio is None:
            self._audio = AudioTranscriber()
        return self._audio

    @property
    def reasoning(self) -> ReasoningEngine:
        if self._reasoning is None:
            self._reasoning = ReasoningEngine()
        return self._reasoning

    def analyze(
        self,
        prompt: str,
        *,
        image: Image.Image | None = None,
        image_path: str | Path | None = None,
        clinical_text: str | None = None,
        audio_path: str | Path | None = None,
        max_new_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> dict:
        """Run multi-modal analysis and return the reasoning response.

        All input modalities are optional -- the system adapts to whatever is provided.
        At minimum a prompt is required.
        """
        context_sections: list[dict] = []

        # ── Vision ──
        if image is not None:
            context_sections.append(self.vision.analyze(image))
        elif image_path is not None:
            img = Image.open(image_path).convert("RGB")
            context_sections.append(self.vision.analyze(img))

        # ── Clinical text ──
        if clinical_text:
            context_sections.append(self.nlp.analyze(clinical_text))

        # ── Audio ──
        if audio_path is not None:
            audio_result = self.audio.analyze(audio_path)
            context_sections.append(audio_result)
            # Also run the transcript through clinical NLP for entity extraction
            if audio_result.get("transcript"):
                transcript_analysis = self.nlp.analyze(audio_result["transcript"])
                transcript_analysis["modality"] = "text"
                transcript_analysis["input_preview"] = (
                    f"[Transcribed from audio] {transcript_analysis['input_preview']}"
                )
                context_sections.append(transcript_analysis)

        # ── Reasoning ──
        result = self.reasoning.generate(
            prompt,
            context_sections,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
        )

        # Attach the NLP embedding for storage / semantic search
        combined_text = prompt
        if clinical_text:
            combined_text = f"{clinical_text} {prompt}"
        result["embedding"] = self.nlp.get_embedding(combined_text)
        result["context_modalities"] = [s["modality"] for s in context_sections]

        return result
