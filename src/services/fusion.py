"""Multi-modal fusion orchestrator.

Accepts any combination of inputs (image, text, audio) and a prompt,
runs each through its respective model, assembles context, and invokes
the reasoning LLM to produce a unified medical response.
"""

from __future__ import annotations

import logging
import threading
import time
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL import Image
    from src.models.audio import AudioTranscriber
    from src.models.nlp import ClinicalNLP
    from src.models.reasoning import ReasoningEngine
    from src.models.vision import VisionEncoder

logger = logging.getLogger(__name__)

MODALITIES = ("vision", "nlp", "audio", "reasoning")

# Per-modality TTL defaults (seconds). Heavier / rarer models expire faster.
_DEFAULT_TTL: dict[str, int] = {
    "vision": 600,      # 10 min
    "audio": 600,       # 10 min
    "nlp": 1800,        # 30 min
    "reasoning": 1800,  # 30 min
}

# Approximate FP16 memory per model (bytes) for the /health/models endpoint
_APPROX_MEM: dict[str, int] = {
    "vision": 175_000_000,
    "nlp": 220_000_000,
    "audio": 1_500_000_000,
    "reasoning": 16_000_000_000,
}


class FusionOrchestrator:
    """Demand-driven model lifecycle manager.

    * Lazy-loads models on first use (unchanged).
    * Tracks last-used timestamps per modality.
    * ``hint()`` pre-loads expected models in a background thread.
    * ``cleanup_idle()`` unloads models that exceed their TTL.
    """

    def __init__(self) -> None:
        self._vision: VisionEncoder | None = None
        self._nlp: ClinicalNLP | None = None
        self._audio: AudioTranscriber | None = None
        self._reasoning: ReasoningEngine | None = None

        self._last_used: dict[str, float] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Property accessors (lazy-load + timestamp tracking)
    # ------------------------------------------------------------------

    def _touch(self, modality: str) -> None:
        self._last_used[modality] = time.monotonic()

    @property
    def vision(self) -> VisionEncoder:
        if self._vision is None:
            from src.models.vision import VisionEncoder
            self._vision = VisionEncoder()
        self._touch("vision")
        return self._vision

    @property
    def nlp(self) -> ClinicalNLP:
        if self._nlp is None:
            from src.models.nlp import ClinicalNLP
            self._nlp = ClinicalNLP()
        self._touch("nlp")
        return self._nlp

    @property
    def audio(self) -> AudioTranscriber:
        if self._audio is None:
            from src.models.audio import AudioTranscriber
            self._audio = AudioTranscriber()
        self._touch("audio")
        return self._audio

    @property
    def reasoning(self) -> ReasoningEngine:
        if self._reasoning is None:
            from src.models.reasoning import ReasoningEngine
            self._reasoning = ReasoningEngine()
        self._touch("reasoning")
        return self._reasoning

    # ------------------------------------------------------------------
    # Model lifecycle helpers
    # ------------------------------------------------------------------

    def hint(self, modalities: list[str]) -> None:
        """Pre-load *modalities* in a background thread.

        Called when a consultation starts so the expected models are warm
        by the time the first analysis request arrives.
        """
        to_load = [m for m in modalities if m in MODALITIES and not self.is_loaded(m)]
        if not to_load:
            return
        thread = threading.Thread(
            target=self._load_modalities,
            args=(to_load,),
            daemon=True,
        )
        thread.start()

    def _load_modalities(self, modalities: list[str]) -> None:
        for mod in modalities:
            try:
                logger.info("Hint-loading %s model…", mod)
                _ = getattr(self, mod)
                logger.info("%s model ready.", mod)
            except Exception:
                logger.exception("Hint-load failed for %s", mod)

    def is_loaded(self, modality: str) -> bool:
        inst = self._get_instance(modality)
        if inst is None:
            return False
        return inst.is_loaded

    def unload_modality(self, modality: str) -> None:
        """Explicitly unload a single model to free memory."""
        inst = self._get_instance(modality)
        if inst is not None and inst.is_loaded:
            logger.info("Unloading %s model.", modality)
            inst.unload()
            self._last_used.pop(modality, None)

    def cleanup_idle(self, ttl_overrides: dict[str, int] | None = None) -> None:
        """Unload models whose last-used timestamp exceeds their TTL."""
        ttls = {**_DEFAULT_TTL, **(ttl_overrides or {})}
        now = time.monotonic()
        for mod in MODALITIES:
            last = self._last_used.get(mod)
            if last is None:
                continue
            if now - last > ttls.get(mod, 600) and self.is_loaded(mod):
                logger.info(
                    "Model %s idle for %.0fs (ttl=%ds) — unloading.",
                    mod, now - last, ttls.get(mod, 600),
                )
                self.unload_modality(mod)

    def model_status(self) -> list[dict]:
        """Return per-model status dicts (for /health/models)."""
        now = time.monotonic()
        out: list[dict] = []
        for mod in MODALITIES:
            loaded = self.is_loaded(mod)
            last = self._last_used.get(mod)
            out.append({
                "modality": mod,
                "loaded": loaded,
                "last_used_seconds_ago": round(now - last, 1) if last else None,
                "approx_memory_mb": round(_APPROX_MEM[mod] / 1e6, 1) if loaded else 0,
                "ttl_seconds": _DEFAULT_TTL[mod],
            })
        return out

    def _get_instance(self, modality: str):
        return {
            "vision": self._vision,
            "nlp": self._nlp,
            "audio": self._audio,
            "reasoning": self._reasoning,
        }.get(modality)

    # ------------------------------------------------------------------
    # Core analysis pipeline
    # ------------------------------------------------------------------

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
        used_nlp = False

        # -- Vision --
        if image is not None:
            context_sections.append(self.vision.analyze(image))
        elif image_path is not None:
            from PIL import Image
            img = Image.open(image_path).convert("RGB")
            context_sections.append(self.vision.analyze(img))

        # -- Clinical text --
        if clinical_text:
            context_sections.append(self.nlp.analyze(clinical_text))
            used_nlp = True

        # -- Audio --
        if audio_path is not None:
            audio_result = self.audio.analyze(audio_path)
            context_sections.append(audio_result)
            if audio_result.get("transcript"):
                transcript_analysis = self.nlp.analyze(audio_result["transcript"])
                transcript_analysis["modality"] = "text"
                transcript_analysis["input_preview"] = (
                    f"[Transcribed from audio] {transcript_analysis['input_preview']}"
                )
                context_sections.append(transcript_analysis)
                used_nlp = True

        # -- Reasoning --
        result = self.reasoning.generate(
            prompt,
            context_sections,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
        )

        # Generate NLP embedding only when meaningful text context exists.
        # A bare prompt with no clinical data does not justify loading
        # the NLP model solely for an embedding.
        if used_nlp or clinical_text:
            combined_text = prompt
            if clinical_text:
                combined_text = f"{clinical_text} {prompt}"
            result["embedding"] = self.nlp.get_embedding(combined_text)
        else:
            result["embedding"] = None

        result["context_modalities"] = [s["modality"] for s in context_sections]
        return result
