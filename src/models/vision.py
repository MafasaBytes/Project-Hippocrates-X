"""CXformer-base vision encoder for chest X-ray analysis.

Model: m42-health/CXformer-base (87M params, DINOv2-adapted)
Input:  PIL Image  ->  [1, 3, 518, 518]
Output: last_hidden_state  [1, 1374, 768]
"""

from __future__ import annotations

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

from src.config import settings


class VisionEncoder:
    def __init__(self, model_name: str | None = None, device: str | None = None):
        self._model_name = model_name or settings.vision_model
        self._device = device or self._resolve_device()
        self._model: AutoModel | None = None
        self._processor: AutoImageProcessor | None = None

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        return "cuda" if torch.cuda.is_available() else "cpu"

    def load(self) -> None:
        self._processor = AutoImageProcessor.from_pretrained(
            self._model_name, trust_remote_code=True, token=settings.hf_token
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
    def processor(self) -> AutoImageProcessor:
        if self._processor is None:
            self.load()
        return self._processor

    @torch.no_grad()
    def extract_features(self, image: Image.Image) -> torch.Tensor:
        """Return full hidden states [1, 1374, 768]."""
        inputs = self.processor(image, return_tensors="pt").to(self._device)
        outputs = self.model(**inputs)
        return outputs.last_hidden_state

    @torch.no_grad()
    def get_embedding(self, image: Image.Image) -> list[float]:
        """Return a single 768-d vector (mean-pooled) for downstream use."""
        hidden = self.extract_features(image)
        pooled = hidden.mean(dim=1).squeeze(0)
        return pooled.cpu().tolist()

    @torch.no_grad()
    def analyze(self, image: Image.Image) -> dict:
        """High-level analysis returning embedding + metadata for the fusion layer."""
        hidden = self.extract_features(image)
        pooled = hidden.mean(dim=1).squeeze(0).cpu().tolist()
        return {
            "modality": "vision",
            "model": self._model_name,
            "embedding": pooled,
            "sequence_length": hidden.shape[1],
            "hidden_dim": hidden.shape[2],
        }
