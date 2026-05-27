// Transcripción real bajo demanda.
//
// Configuración (env vars):
//   TRANSCRIPTION_API_KEY   (obligatoria — si falta, lanza TranscriptionNotConfiguredError)
//   TRANSCRIPTION_API_URL   (opcional, default https://api.openai.com/v1/audio/transcriptions)
//   TRANSCRIPTION_MODEL     (opcional, default whisper-1)
//
// Flujo:
//   1. Pide URL firmada de lectura al bucket vía presignDownload(mediaKey).
//   2. Descarga el archivo como Blob.
//   3. Lo envía multipart al proveedor Whisper-compatible.
//   4. Devuelve el texto plano.
//
// Sin TRANSCRIPTION_API_KEY: el endpoint que lo invoca debe devolver 503
// controlado. La app no debe romper por falta de configuración.

import { presignDownload } from "./s3";

export class TranscriptionNotConfiguredError extends Error {
  constructor() {
    super("Transcripción no configurada");
    this.name = "TranscriptionNotConfiguredError";
  }
}

export function isTranscriptionProviderConfigured(): boolean {
  return Boolean(process.env.TRANSCRIPTION_API_KEY);
}

function filenameFromKey(key: string): string {
  const last = key.split("/").pop() || "audio";
  return last.includes(".") ? last : `${last}.bin`;
}

export type TranscribeResult = { text: string };

export async function transcribeFromMediaKey(mediaKey: string): Promise<TranscribeResult> {
  const apiKey = process.env.TRANSCRIPTION_API_KEY;
  if (!apiKey) throw new TranscriptionNotConfiguredError();

  const url = process.env.TRANSCRIPTION_API_URL || "https://api.openai.com/v1/audio/transcriptions";
  const model = process.env.TRANSCRIPTION_MODEL || "whisper-1";

  const downloadUrl = await presignDownload(mediaKey);
  if (!downloadUrl) throw new Error("No se pudo generar URL de descarga del archivo");

  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) throw new Error(`No se pudo descargar el archivo (HTTP ${fileRes.status})`);
  const blob = await fileRes.blob();

  const form = new FormData();
  form.append("file", blob, filenameFromKey(mediaKey));
  form.append("model", model);
  form.append("language", "es");
  form.append("response_format", "json");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Proveedor de transcripción respondió HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== "object" || typeof (data as { text?: unknown }).text !== "string") {
    throw new Error("Respuesta de transcripción sin texto");
  }
  const text = (data as { text: string }).text.trim();
  if (!text) throw new Error("Transcripción vacía");
  return { text };
}
