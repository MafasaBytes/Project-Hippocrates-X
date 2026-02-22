"""Distil-Whisper wrapper for medical speech-to-text.

Model: distil-whisper/distil-large-v3.5 (756M params)
Supports both batch transcription and streaming (chunked) mode.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

from src.config import settings


class AudioTranscriber:
    def __init__(self, model_name: str | None = None, device: str | None = None):
        self._model_name = model_name or settings.audio_model
        self._device = device or self._resolve_device()
        self._torch_dtype = torch.float16 if self._device == "cuda" else torch.float32
        self._model = None
        self._processor = None
        self._pipe = None

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        return "cuda" if torch.cuda.is_available() else "cpu"

    def load(self) -> None:
        self._processor = AutoProcessor.from_pretrained(
            self._model_name, token=settings.hf_token
        )
        self._model = AutoModelForSpeechSeq2Seq.from_pretrained(
            self._model_name,
            torch_dtype=self._torch_dtype,
            low_cpu_mem_usage=True,
            token=settings.hf_token,
        ).to(self._device)

        self._pipe = pipeline(
            "automatic-speech-recognition",
            model=self._model,
            tokenizer=self._processor.tokenizer,
            feature_extractor=self._processor.feature_extractor,
            torch_dtype=self._torch_dtype,
            device=self._device,
        )

    @property
    def pipe(self):
        if self._pipe is None:
            self.load()
        return self._pipe

    def transcribe(self, audio_path: str | Path, *, language: str | None = None) -> dict:
        """Batch-transcribe a complete audio file.

        Returns dict with 'text' and optionally 'chunks' (timestamped segments).
        """
        generate_kwargs = {}
        if language:
            generate_kwargs["language"] = language

        result = self.pipe(
            str(audio_path),
            return_timestamps=True,
            generate_kwargs=generate_kwargs,
        )
        return {
            "text": result["text"],
            "chunks": result.get("chunks", []),
        }

    def transcribe_array(
        self, audio_array: np.ndarray, sampling_rate: int = 16_000, *, language: str | None = None
    ) -> dict:
        """Transcribe from a raw numpy audio array (for real-time / streaming use)."""
        generate_kwargs = {}
        if language:
            generate_kwargs["language"] = language

        result = self.pipe(
            {"raw": audio_array, "sampling_rate": sampling_rate},
            return_timestamps=True,
            generate_kwargs=generate_kwargs,
        )
        return {
            "text": result["text"],
            "chunks": result.get("chunks", []),
        }

    def analyze(self, audio_path: str | Path) -> dict:
        """High-level analysis returning transcript + metadata for the fusion layer."""
        result = self.transcribe(audio_path)
        return {
            "modality": "audio",
            "model": self._model_name,
            "transcript": result["text"],
            "chunks": result.get("chunks", []),
        }
