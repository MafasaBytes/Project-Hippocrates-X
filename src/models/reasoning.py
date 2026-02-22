"""OpenBioLLM-8B reasoning engine for multi-modal medical fusion.

Model: aaditya/Llama3-OpenBioLLM-8B (8B params, DPO+RLHF)
Accepts structured context from vision, NLP, and audio modalities
and generates medical reasoning responses.
"""

from __future__ import annotations

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from src.config import settings

SYSTEM_PROMPT = (
    "You are an expert medical assistant powered by Project Hippocrates X. "
    "You analyze clinical data from multiple modalities (medical images, clinical text, "
    "and transcribed doctor-patient conversations) to provide evidence-based medical "
    "reasoning. Always state your confidence level and recommend further evaluation "
    "when uncertain. You do not provide definitive diagnoses -- you support the "
    "clinician's decision-making process."
)


class ReasoningEngine:
    def __init__(self, model_name: str | None = None, device: str | None = None):
        self._model_name = model_name or settings.reasoning_model
        self._device = device or self._resolve_device()
        self._torch_dtype = torch.float16 if self._device == "cuda" else torch.float32
        self._model = None
        self._tokenizer = None

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        return "cuda" if torch.cuda.is_available() else "cpu"

    def load(self) -> None:
        self._tokenizer = AutoTokenizer.from_pretrained(
            self._model_name, token=settings.hf_token
        )
        self._model = AutoModelForCausalLM.from_pretrained(
            self._model_name,
            torch_dtype=self._torch_dtype,
            low_cpu_mem_usage=True,
            device_map=self._device if self._device == "auto" else None,
            token=settings.hf_token,
        )
        if self._device != "auto":
            self._model = self._model.to(self._device)

    @property
    def model(self) -> AutoModelForCausalLM:
        if self._model is None:
            self.load()
        return self._model

    @property
    def tokenizer(self) -> AutoTokenizer:
        if self._tokenizer is None:
            self.load()
        return self._tokenizer

    def _build_prompt(self, user_prompt: str, context_sections: list[dict]) -> str:
        """Assemble a structured prompt from multi-modal context sections.

        Each section dict should have keys: 'modality' and a relevant content key
        (e.g. 'embedding', 'transcript', 'input_preview').
        """
        parts: list[str] = []

        for section in context_sections:
            modality = section.get("modality", "unknown")
            if modality == "vision":
                parts.append(
                    f"[MEDICAL IMAGE ANALYSIS]\n"
                    f"Model: {section.get('model', 'N/A')}\n"
                    f"Feature dimensions: {section.get('sequence_length', '?')} tokens x {section.get('hidden_dim', '?')}d\n"
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

        context_block = "\n\n".join(parts)
        return (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
            f"{SYSTEM_PROMPT}<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"Given the following clinical data:\n\n{context_block}\n\n"
            f"Doctor's question: {user_prompt}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        )

    @torch.no_grad()
    def generate(
        self,
        prompt: str,
        context_sections: list[dict] | None = None,
        *,
        max_new_tokens: int = 1024,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ) -> dict:
        """Generate a medical reasoning response.

        Args:
            prompt: The doctor's question or instruction.
            context_sections: List of dicts from vision/nlp/audio .analyze() calls.
            max_new_tokens: Maximum tokens to generate.
            temperature: Sampling temperature (lower = more deterministic).
            top_p: Nucleus sampling threshold.

        Returns:
            Dict with 'response' text and generation metadata.
        """
        full_prompt = self._build_prompt(prompt, context_sections or [])

        inputs = self.tokenizer(full_prompt, return_tensors="pt").to(self.model.device)
        input_len = inputs["input_ids"].shape[1]

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
