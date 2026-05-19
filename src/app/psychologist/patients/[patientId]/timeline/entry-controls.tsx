"use client";

import { useState } from "react";

type Note = { id: string; content: string; createdAt: string };
type Trans = { status: "NOT_REQUESTED" | "PENDING" | "COMPLETED" | "FAILED"; text: string | null } | null;

export default function EntryControls({
  entryId,
  initialNotes,
  initialTranscription,
}: {
  entryId: string;
  initialNotes: Note[];
  initialTranscription: Trans;
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [trans, setTrans] = useState<Trans>(initialTranscription);
  const [requestingTrans, setRequestingTrans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/psychologist/entries/${entryId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la nota");
      setNotes((prev) => [data.note, ...prev]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingNote(false);
    }
  }

  async function requestTrans() {
    setRequestingTrans(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/psychologist/entries/${entryId}/transcription-request`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo solicitar");
      setTrans({ status: data.status, text: data.text ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setRequestingTrans(false);
    }
  }

  const transLabel = (() => {
    if (!trans || trans.status === "NOT_REQUESTED") return "Sin solicitar";
    if (trans.status === "PENDING") return "Transcripción pendiente de configuración";
    if (trans.status === "FAILED") return "Falló la transcripción";
    return "Completada";
  })();

  return (
    <div className="space-y-4 border-t border-pulso-mute pt-3">
      <section>
        <h5 className="text-sm font-semibold mb-2">Notas privadas</h5>
        <p className="text-xs text-pulso-soft mb-2">Solo vos podés ver estas notas.</p>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-pulso-bg p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-pulso-soft mt-1">
                {new Date(n.createdAt).toLocaleString("es-AR")}
              </p>
            </li>
          ))}
          {notes.length === 0 && <li className="text-sm text-pulso-soft">Sin notas todavía.</li>}
        </ul>
        <form onSubmit={saveNote} className="mt-2 flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribir una nota privada…"
            className="input min-h-[64px] flex-1"
          />
          <button type="submit" disabled={savingNote} className="btn-primary self-end">
            {savingNote ? "Guardando…" : "Agregar"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h5 className="text-sm font-semibold">Transcripción</h5>
          <button
            type="button"
            onClick={requestTrans}
            disabled={requestingTrans || trans?.status === "PENDING" || trans?.status === "COMPLETED"}
            className="btn-ghost text-sm py-2"
          >
            {requestingTrans
              ? "Solicitando…"
              : trans?.status === "COMPLETED"
                ? "Solicitada"
                : "Solicitar transcripción"}
          </button>
        </div>
        <p className="text-sm text-pulso-soft mt-1">{transLabel}</p>
        {trans?.text && (
          <p className="mt-2 whitespace-pre-wrap text-sm rounded-lg bg-pulso-bg p-3">
            {trans.text}
          </p>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
