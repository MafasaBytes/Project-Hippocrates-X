"""Real-time transcription service for WebSocket streaming.

Receives audio chunks over a WebSocket, buffers them, and returns
partial / final transcriptions using the AudioTranscriber.
"""

from __future__ import annotations

import io

import numpy as np
import soundfile as sf

from src.models.audio import AudioTranscriber


class StreamingTranscriber:
    """Accumulates audio chunks and transcribes on demand."""

    SAMPLE_RATE = 16_000

    def __init__(self, transcriber: AudioTranscriber | None = None):
        self._transcriber = transcriber or AudioTranscriber()
        self._buffer: list[np.ndarray] = []

    def add_chunk(self, raw_bytes: bytes) -> None:
        """Decode an audio chunk (WAV or raw PCM) and append to the buffer."""
        try:
            audio_array, sr = sf.read(io.BytesIO(raw_bytes), dtype="float32")
            if sr != self.SAMPLE_RATE:
                # Basic resampling: just accept the data as-is for now.
                # A production system would use librosa.resample here.
                pass
        except Exception:
            audio_array = np.frombuffer(raw_bytes, dtype=np.float32)

        if audio_array.ndim > 1:
            audio_array = audio_array.mean(axis=1)

        self._buffer.append(audio_array)

    def transcribe_buffer(self) -> dict:
        """Transcribe everything accumulated so far."""
        if not self._buffer:
            return {"text": "", "chunks": []}

        full_audio = np.concatenate(self._buffer)
        return self._transcriber.transcribe_array(full_audio, self.SAMPLE_RATE)

    def transcribe_and_flush(self) -> dict:
        """Transcribe and clear the buffer."""
        result = self.transcribe_buffer()
        self._buffer.clear()
        return result

    def clear(self) -> None:
        self._buffer.clear()
