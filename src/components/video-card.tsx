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
        className="relative block w-full overflow-hidden rounded-lg bg-black aspect-video group"
        aria-label="Ver video"
      >
        <video
          src={src}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white/90 text-pulso-bg px-4 py-2 text-sm font-medium shadow">
            ▶ Ver video
          </span>
        </span>
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
