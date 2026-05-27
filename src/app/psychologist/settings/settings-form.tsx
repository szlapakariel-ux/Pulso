"use client";

import { useState } from "react";

type Channel = "MANUAL" | "WHATSAPP" | "EMAIL";

type Initial = {
  enabled: boolean;
  sendTime: string;
  channel: Channel;
  timezone: string;
};

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [sendTime, setSendTime] = useState(initial.sendTime);
  const [channel, setChannel] = useState<Channel>(initial.channel);
  const [timezone] = useState(initial.timezone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/psychologist/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, sendTime, channel, timezone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage("Configuración guardada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="card space-y-4">
      <div className="flex items-center justify-between">
        <label className="label" htmlFor="enabled">
          Activar resumen diario
        </label>
        <input
          id="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5"
        />
      </div>

      <div>
        <label className="label" htmlFor="sendTime">
          Hora de envío
        </label>
        <input
          id="sendTime"
          type="time"
          value={sendTime}
          onChange={(e) => setSendTime(e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="channel">
          Canal
        </label>
        <select
          id="channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="input"
        >
          <option value="MANUAL">Manual</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      <div>
        <label className="label">Zona horaria</label>
        <p className="text-sm text-pulso-soft">{timezone}</p>
      </div>

      <p className="text-xs text-pulso-soft border-l-2 border-pulso-mute pl-3">
        El envío automático todavía no está activo. Esta configuración prepara el resumen
        diario.
      </p>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
