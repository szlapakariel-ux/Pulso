"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo";

export default function DemoSelector() {
  const router = useRouter();
  const [loading, setLoading] = useState<DemoProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enter(profile: DemoProfile) {
    setError(null);
    setLoading(profile);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo ingresar");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {(Object.keys(DEMO_PROFILES) as DemoProfile[]).map((key) => {
        const def = DEMO_PROFILES[key];
        const isLoading = loading === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => enter(key)}
            disabled={loading !== null}
            className={
              key === "psychologist"
                ? "btn-primary w-full disabled:opacity-60"
                : "btn-ghost w-full disabled:opacity-60"
            }
          >
            {isLoading ? "Ingresando…" : def.label}
          </button>
        );
      })}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
