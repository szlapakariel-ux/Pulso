"use client";

import { useEffect, useState } from "react";

export default function VideoCard({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ver video"
        className="w-full flex items-center gap-3 rounded-lg border border-pulso-mute bg-pulso-bg/60 px-3 py-2 text-left hover:border-pulso-accent transition-colors"
      >
        <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-black/80 text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="flex-1 text-sm">
          <span className="block font-medium">Video</span>
          <span className="block text-xs text-pulso-soft">Tocá para reproducir</span>
        </span>
        <span className="text-xs text-pulso-soft underline">Ver</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white text-sm underline"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
            <video
              src={src}
              controls
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
