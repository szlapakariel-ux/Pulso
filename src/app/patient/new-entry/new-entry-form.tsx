"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MediaType = "AUDIO" | "VIDEO";

export default function NewEntryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("AUDIO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setMediaType(f.type.startsWith("video/") ? "VIDEO" : "AUDIO");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Poné un título breve");
    if (!file) return setError("Adjuntá un audio o video");
    setLoading(true);
    const isDev = process.env.NODE_ENV !== "production";
    let stage: "init" | "upload" | "complete" = "init";
    try {
      setProgress("Preparando subida…");
      let initRes: Response;
      try {
        initRes = await fetch("/api/patient/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "init",
            title,
            mediaType,
            contentType: file.type,
            sizeBytes: file.size,
          }),
        });
      } catch {
        throw new Error("No se pudo contactar el servidor para iniciar la subida.");
      }
      if (isDev) console.debug("[upload] init status", initRes.status);
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "No se pudo iniciar la subida");

      stage = "upload";
      setProgress("Subiendo archivo…");
      let putRes: Response;
      try {
        putRes = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        throw new Error(
          "No se pudo subir el archivo al almacenamiento. Probable CORS del bucket R2/S3 o URL firmada inválida.",
        );
      }
      if (isDev) console.debug("[upload] PUT status", putRes.status);
      if (!putRes.ok) {
        throw new Error(
          `No se pudo subir el archivo al almacenamiento (HTTP ${putRes.status}). Probable CORS del bucket R2/S3 o URL firmada inválida.`,
        );
      }

      stage = "complete";
      setProgress("Guardando…");
      let doneRes: Response;
      try {
        doneRes = await fetch("/api/patient/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            title,
            mediaType,
            mediaKey: initData.key,
          }),
        });
      } catch {
        throw new Error("No se pudo confirmar el guardado con el servidor.");
      }
      if (isDev) console.debug("[upload] complete status", doneRes.status);
      const doneData = await doneRes.json();
      if (!doneRes.ok) throw new Error(doneData.error || "No se pudo guardar el registro");
      router.replace("/patient/timeline");
      router.refresh();
    } catch (err) {
      if (isDev) console.debug("[upload] failed at stage", stage);
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="title">Título breve</label>
        <input
          id="title"
          required
          maxLength={120}
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Ansiedad antes de la reunión"
        />
      </div>

      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMediaType("AUDIO")}
            className={mediaType === "AUDIO" ? "btn-primary" : "btn-ghost"}
          >
            Audio
          </button>
          <button
            type="button"
            onClick={() => setMediaType("VIDEO")}
            className={mediaType === "VIDEO" ? "btn-primary" : "btn-ghost"}
          >
            Video
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="file">Archivo</label>
        <input
          id="file"
          type="file"
          accept={mediaType === "AUDIO" ? "audio/*" : "video/*"}
          capture={mediaType === "VIDEO" ? "user" : undefined}
          onChange={onFileChange}
          className="input"
          required
        />
        <p className="text-xs text-pulso-soft mt-1">
          Podés grabar desde el celular o adjuntar un archivo existente.
        </p>
      </div>

      {progress && <p className="text-sm text-pulso-soft">{progress}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Guardando…" : "Guardar registro"}
      </button>
    </form>
  );
}
