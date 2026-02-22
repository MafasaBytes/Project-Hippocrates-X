import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptionResult } from "../types/api";

interface UseTranscriptionOptions {
  autoConnect?: boolean;
}

export function useTranscription(opts: UseTranscriptionOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chunks, setChunks] = useState<TranscriptionResult["chunks"]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/api/transcribe`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const data: TranscriptionResult = JSON.parse(e.data);
      setTranscript(data.text);
      setChunks(data.chunks);
    };
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    }
  }, []);

  const flush = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("flush");
    }
  }, []);

  const finish = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send("done");
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (opts.autoConnect) connect();
    return () => disconnect();
  }, [opts.autoConnect, connect, disconnect]);

  return { connected, transcript, chunks, connect, sendAudio, flush, finish, disconnect };
}
