import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptionResult } from "../types/api";

const SAMPLE_RATE = 16_000;
const FLUSH_INTERVAL_MS = 3_000;
const BUFFER_SIZE = 4096;

type Status = "idle" | "connecting" | "recording" | "error";

export function useTranscription() {
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [chunks, setChunks] = useState<TranscriptionResult["chunks"]>([]);
  const [error, setError] = useState<string | null>(null);

  const connected = status === "recording";

  const cleanup = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const sendFlush = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("flush");
    }
  }, []);

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "recording") return;
    setStatus("connecting");
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permissions."
          : "Could not access microphone."
      );
      return;
    }
    streamRef.current = stream;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/api/transcribe`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("recording");

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      ctxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        ws.send(float32.buffer.slice(0));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      flushTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("flush");
      }, FLUSH_INTERVAL_MS);
    };

    ws.onmessage = (e) => {
      const data: TranscriptionResult = JSON.parse(e.data);
      if (data.text) {
        setTranscript((prev) => (prev ? `${prev} ${data.text}` : data.text));
      }
      setChunks((prev) => [...prev, ...(data.chunks ?? [])]);
    };

    ws.onerror = () => {
      setStatus("error");
      setError("WebSocket connection failed. Is the backend running?");
      cleanup();
    };

    ws.onclose = () => {
      if (status !== "error") setStatus("idle");
      cleanup();
    };
  }, [status, cleanup]);

  const flush = useCallback(() => {
    sendFlush();
  }, [sendFlush]);

  const finish = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("done");
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("idle");
  }, [cleanup]);

  const reset = useCallback(() => {
    setTranscript("");
    setChunks([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [cleanup]);

  return {
    status,
    connected,
    transcript,
    chunks,
    error,
    connect,
    flush,
    finish,
    disconnect,
    reset,
  };
}
