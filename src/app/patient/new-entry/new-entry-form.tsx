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
    try {
      setProgress("Preparando subida…");
      const initRes = await fetch("/api/patient/entries", {
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
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "No se pudo iniciar la subida");

      setProgress("Subiendo archivo…");
      const putRes = await fetch(initData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Falló la subida del archivo");

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
      const doneData = await doneRes.json();
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
