"""Bio_ClinicalBERT wrapper for clinical text processing.

Model: emilyalsentzer/Bio_ClinicalBERT (110M params)
Trained on MIMIC-III clinical notes (~880M words).
Provides embeddings, tokenization, and NER-ready hidden states.
"""

from __future__ import annotations

import torch
from transformers import AutoModel, AutoTokenizer

from src.config import settings


class ClinicalNLP:
    MAX_LENGTH = 512

    def __init__(self, model_name: str | None = None, device: str | None = None):
        self._model_name = model_name or settings.nlp_model
        self._device = device or self._resolve_device()
        self._model: AutoModel | None = None
        self._tokenizer: AutoTokenizer | None = None

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        return "cuda" if torch.cuda.is_available() else "cpu"

    def load(self) -> None:
        self._tokenizer = AutoTokenizer.from_pretrained(
            self._model_name, token=settings.hf_token
        )
        self._model = AutoModel.from_pretrained(
            self._model_name, token=settings.hf_token
        ).to(self._device)
        self._model.eval()

    @property
    def model(self) -> AutoModel:
        if self._model is None:
            self.load()
        return self._model

    @property
    def tokenizer(self) -> AutoTokenizer:
        if self._tokenizer is None:
            self.load()
        return self._tokenizer

    @torch.no_grad()
    def encode(self, text: str) -> torch.Tensor:
        """Return last_hidden_state for the input text."""
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=self.MAX_LENGTH, padding=True
        ).to(self._device)
        outputs = self.model(**inputs)
        return outputs.last_hidden_state

    @torch.no_grad()
    def get_embedding(self, text: str) -> list[float]:
        """Return a single 768-d vector (CLS token) suitable for search / similarity."""
        hidden = self.encode(text)
        cls_vector = hidden[:, 0, :].squeeze(0)
        return cls_vector.cpu().tolist()

    @torch.no_grad()
    def get_token_embeddings(self, text: str) -> dict:
        """Return per-token embeddings with token strings -- useful for NER pipelines."""
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=self.MAX_LENGTH, padding=True
        ).to(self._device)
        outputs = self.model(**inputs)
        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        embeddings = outputs.last_hidden_state[0].cpu().tolist()
        return {"tokens": tokens, "embeddings": embeddings}

    @torch.no_grad()
    def analyze(self, text: str) -> dict:
        """High-level analysis returning embedding + metadata for the fusion layer."""
        cls_embedding = self.get_embedding(text)
        token_count = len(self.tokenizer.tokenize(text))
        return {
            "modality": "text",
            "model": self._model_name,
            "embedding": cls_embedding,
            "token_count": token_count,
            "input_preview": text[:200],
        }
