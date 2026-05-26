"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MediaType = "AUDIO" | "VIDEO";

function pickMime(kind: MediaType): string {
  const candidates =
    kind === "AUDIO"
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"]
      : [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return kind === "AUDIO" ? "audio/webm" : "video/webm";
}

function autoTitle(kind: MediaType): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${kind === "AUDIO" ? "Audio" : "Video"} ${dd}/${mm} ${hh}:${mi}`;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function NewEntryForm() {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startRecording(kind: MediaType) {
    setError(null);
    setBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setMediaType(kind);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta grabación. Probá con Chrome/Safari actualizado.");
      setMediaType(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "VIDEO" ? { facingMode: "user" } : false,
      });
      streamRef.current = stream;

      if (kind === "VIDEO") {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            if (liveVideoRef.current) {
              liveVideoRef.current.srcObject = stream;
              liveVideoRef.current.play().catch(() => {});
            }
            resolve();
          });
        });
      }

      const mimeType = pickMime(kind);
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setBlob(finalBlob);
        setPreviewUrl(URL.createObjectURL(finalBlob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Permiso denegado";
      setError(
        `No se pudo acceder al ${kind === "VIDEO" ? "micrófono/cámara" : "micrófono"}: ${msg}`,
      );
      setMediaType(null);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setMediaType(null);
    setElapsed(0);
    setError(null);
    setProgress("");
  }

  async function save() {
    if (!blob || !mediaType) return;
    setLoading(true);
    setError(null);
    try {
      const title = autoTitle(mediaType);
      const contentType = blob.type || (mediaType === "AUDIO" ? "audio/webm" : "video/webm");

      setProgress("Preparando subida…");
      const initRes = await fetch("/api/patient/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          title,
          mediaType,
          contentType,
          sizeBytes: blob.size,
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) throw new Error(initData.error || "No se pudo iniciar la subida");

      setProgress("Subiendo archivo…");
      let putRes: Response;
      try {
        putRes = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: blob,
        });
      } catch {
        throw new Error(
          "No se pudo subir el archivo. Probable problema de CORS en el bucket S3: tiene que permitir PUT desde este dominio.",
        );
      }
      if (!putRes.ok) throw new Error(`Falló la subida (HTTP ${putRes.status})`);

      setProgress("Guardando…");
      const doneRes = await fetch("/api/patient/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          title,
          mediaType,
          mediaKey: initData.key,
        }),
      });
      const doneData = await doneRes.json().catch(() => ({}));
      if (!doneRes.ok) throw new Error(doneData.error || "No se pudo guardar el registro");
      router.replace("/patient/timeline");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  if (blob && previewUrl && mediaType) {
    return (
      <div className="card space-y-4">
        <p className="text-sm text-pulso-soft">Listo. Revisalo antes de guardar.</p>
        {mediaType === "AUDIO" ? (
          <audio controls src={previewUrl} className="w-full" />
        ) : (
          <video controls src={previewUrl} playsInline className="w-full rounded-lg" />
        )}
        {progress && <p className="text-sm text-pulso-soft">{progress}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={discard} disabled={loading} className="btn-ghost">
            Volver a grabar
          </button>
        </div>
      </div>
    );
  }

  if (recording && mediaType) {
    return (
      <div className="card space-y-4">
        {mediaType === "VIDEO" && (
          <video
            ref={liveVideoRef}
            muted
            playsInline
            autoPlay
            className="w-full rounded-lg bg-black aspect-video"
          />
        )}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            Grabando · {fmtTime(elapsed)}
          </span>
        </div>
        <button type="button" onClick={stopRecording} className="btn-primary w-full">
          Detener
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <p className="text-sm text-pulso-soft">Elegí qué querés grabar:</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => startRecording("AUDIO")}
          className="btn-primary py-6 text-base"
        >
          Grabar audio
        </button>
        <button
          type="button"
          onClick={() => startRecording("VIDEO")}
          className="btn-primary py-6 text-base"
        >
          Grabar video
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
