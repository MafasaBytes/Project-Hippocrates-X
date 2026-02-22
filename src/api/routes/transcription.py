"""WebSocket endpoint for real-time audio transcription during consultations."""

from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.services.transcription import StreamingTranscriber

router = APIRouter(tags=["transcription"])


@router.websocket("/api/transcribe")
async def transcribe_stream(ws: WebSocket):
    """Real-time audio transcription over WebSocket.

    Protocol:
      - Client sends binary audio chunks (WAV frames or raw float32 PCM).
      - Client sends text message "flush" to get a transcription of buffered audio.
      - Client sends text message "done" to get the final transcription and close.
      - Server responds with JSON: {"text": "...", "chunks": [...]}
    """
    await ws.accept()
    transcriber = StreamingTranscriber()

    try:
        while True:
            message = await ws.receive()

            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message:
                transcriber.add_chunk(message["bytes"])
                continue

            if "text" in message:
                command = message["text"].strip().lower()

                if command == "flush":
                    result = transcriber.transcribe_buffer()
                    await ws.send_text(json.dumps(result))

                elif command == "done":
                    result = transcriber.transcribe_and_flush()
                    await ws.send_text(json.dumps(result))
                    await ws.close()
                    break

    except WebSocketDisconnect:
        pass
