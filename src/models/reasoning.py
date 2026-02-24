"""
Reasoning engines for multi-modal medical fusion.

Supports two backends:
  - "openai"  : Cloud-based reasoning via OpenAI API (gpt-4o / gpt-4o-mini).
  - "local"   : Local HuggingFace model (aaditya/Llama3-OpenBioLLM-8B).

Both expose the same ``generate()`` interface so the FusionOrchestrator
can treat them interchangeably.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from src.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an expert medical assistant powered by Project Hippocrates X. "
    "You analyze clinical data from multiple modalities (medical images, clinical text, "
    "and transcribed doctor-patient conversations) to provide evidence-based medical "
    "reasoning. Always state your confidence level and recommend further evaluation "
    "when uncertain. You do not provide definitive diagnoses -- you support the "
    "clinician's decision-making process."
)


def _build_context_block(context_sections: list[dict]) -> str:
    """Shared helper: assemble human-readable context from modality dicts."""
    parts: list[str] = []

    for section in context_sections:
        modality = section.get("modality", "unknown")
        if modality == "vision":
            parts.append(
                f"[MEDICAL IMAGE ANALYSIS]\n"
                f"Model: {section.get('model', 'N/A')}\n"
                f"Feature dimensions: {section.get('sequence_length', '?')} tokens "
                f"x {section.get('hidden_dim', '?')}d\n"
                f"(Visual features have been extracted and encoded)"
            )
        elif modality == "text":
            preview = section.get("input_preview", "")
            parts.append(
                f"[CLINICAL TEXT]\n"
                f"Tokens: {section.get('token_count', '?')}\n"
                f"Content: {preview}"
            )
        elif modality == "audio":
            transcript = section.get("transcript", "")
            parts.append(
                f"[TRANSCRIBED AUDIO]\n"
                f"Transcript: {transcript}"
            )
        elif modality == "patient_history":
            history_lines = []
            if section.get("patient_name"):
                history_lines.append(f"Patient: {section['patient_name']}")
            if section.get("date_of_birth"):
                history_lines.append(f"DOB: {section['date_of_birth']}")
            if section.get("gender"):
                history_lines.append(f"Gender: {section['gender']}")
            if section.get("blood_type"):
                history_lines.append(f"Blood type: {section['blood_type']}")
            if section.get("allergies"):
                history_lines.append(f"Allergies: {', '.join(section['allergies'])}")
            if section.get("chronic_conditions"):
                history_lines.append(f"Chronic conditions: {', '.join(section['chronic_conditions'])}")
            for cs in section.get("consultation_summaries", []):
                history_lines.append(
                    f"  [{cs.get('date', '?')}] {cs.get('type', '?')}: "
                    f"{cs.get('summary', '')[:300]}"
                )
            for mr in section.get("medical_records", []):
                history_lines.append(
                    f"  [{mr.get('date', '?')}] {mr.get('type', '?')}: "
                    f"{mr.get('title', '')} — {mr.get('description', '')[:200]}"
                )
            parts.append(
                f"[PATIENT HISTORY]\n" + "\n".join(history_lines)
            )

    return "\n\n".join(parts)

# Abstract base

class BaseReasoningEngine(ABC):
    @property
    @abstractmethod
    def is_loaded(self) -> bool: ...

    @abstractmethod
    def unload(self) -> None: ...

    @abstractmethod
    def generate(
        self,
        prompt: str,
        context_sections: list[dict] | None = None,
        *,
        max_new_tokens: int = 1024,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ) -> dict: ...

# OpenAI cloud backend

class OpenAIReasoningEngine(BaseReasoningEngine):
    def __init__(self, model: str | None = None):
        self._model = model or settings.openai_model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import OpenAI
            self._client = OpenAI(api_key=settings.openai_api_key)
        return self._client

    @property
    def is_loaded(self) -> bool:
        return self._client is not None

    def unload(self) -> None:
        self._client = None

    def generate(
        self,
        prompt: str,
        context_sections: list[dict] | None = None,
        *,
        max_new_tokens: int = 1024,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ) -> dict:
        client = self._get_client()
        context_block = _build_context_block(context_sections or [])

        user_content = (
            f"Given the following clinical data:\n\n{context_block}\n\n"
            f"Doctor's question: {prompt}"
        ) if context_block else prompt

        response = client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            max_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
        )

        choice = response.choices[0]
        usage = response.usage

        return {
            "response": choice.message.content.strip(),
            "model": response.model,
            "input_tokens": usage.prompt_tokens if usage else 0,
            "output_tokens": usage.completion_tokens if usage else 0,
        }


# Local HuggingFace backend (original implementation)

class LocalReasoningEngine(BaseReasoningEngine):
    def __init__(self, model_name: str | None = None, device: str | None = None):
        self._model_name = model_name or settings.reasoning_model
        self._device = device or self._resolve_device()

        import torch
        self._torch_dtype = torch.float16 if self._device == "cuda" else torch.float32
        self._model = None
        self._tokenizer = None

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"

    def _use_4bit(self) -> bool:
        import torch
        return settings.quantize_4bit and torch.cuda.is_available()

    def load(self) -> None:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        self._tokenizer = AutoTokenizer.from_pretrained(
            self._model_name, token=settings.hf_token
        )

        load_kwargs: dict = dict(
            low_cpu_mem_usage=True,
            token=settings.hf_token,
            use_safetensors=False,
        )

        if self._use_4bit():
            from transformers import BitsAndBytesConfig

            logger.info("Loading reasoning model with 4-bit quantization (bitsandbytes)")
            load_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
            )
            load_kwargs["device_map"] = "auto"
        else:
            load_kwargs["dtype"] = self._torch_dtype
            load_kwargs["device_map"] = self._device if self._device == "auto" else None

        self._model = AutoModelForCausalLM.from_pretrained(
            self._model_name, **load_kwargs
        )

        if not self._use_4bit() and self._device != "auto":
            self._model = self._model.to(self._device)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def unload(self) -> None:
        self._model = None
        self._tokenizer = None
        if self._device == "cuda":
            import torch
            torch.cuda.empty_cache()

    @property
    def model(self):
        if self._model is None:
            self.load()
        return self._model

    @property
    def tokenizer(self):
        if self._tokenizer is None:
            self.load()
        return self._tokenizer

    def _build_prompt(self, user_prompt: str, context_sections: list[dict]) -> str:
        context_block = _build_context_block(context_sections)
        return (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
            f"{SYSTEM_PROMPT}<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"Given the following clinical data:\n\n{context_block}\n\n"
            f"Doctor's question: {user_prompt}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        )

    def generate(
        self,
        prompt: str,
        context_sections: list[dict] | None = None,
        *,
        max_new_tokens: int = 1024,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ) -> dict:
        import torch

        full_prompt = self._build_prompt(prompt, context_sections or [])

        inputs = self.tokenizer(full_prompt, return_tensors="pt").to(self.model.device)
        input_len = inputs["input_ids"].shape[1]

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=temperature > 0,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated_ids = outputs[0][input_len:]
        response_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)

        return {
            "response": response_text.strip(),
            "model": self._model_name,
            "input_tokens": input_len,
            "output_tokens": len(generated_ids),
        }

# Backward-compatible alias

ReasoningEngine = LocalReasoningEngine


def create_reasoning_engine() -> BaseReasoningEngine:
    """Factory: pick the right backend based on settings."""
    if (
        settings.reasoning_backend == "openai"
        and settings.openai_api_key
    ):
        logger.info("Using OpenAI reasoning backend (model=%s)", settings.openai_model)
        return OpenAIReasoningEngine()
    logger.info("Using local reasoning backend (model=%s)", settings.reasoning_model)
    return LocalReasoningEngine()
