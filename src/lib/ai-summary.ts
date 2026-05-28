// IA descriptiva: genera aiTitle/aiSummary a partir de la transcripción.
//
// IMPORTANTE: este módulo NO interpreta clínicamente. Solo describe lo que el
// paciente dijo. Las reglas anti-clínicas se aplican en el prompt y se
// validan en la salida.
//
// Configuración (env vars, sin defaults peligrosos):
//   AI_API_KEY   (obligatoria — si falta, lanza "IA no configurada")
//   AI_API_URL   (opcional, default https://api.openai.com/v1/chat/completions)
//   AI_MODEL     (opcional, default gpt-4o-mini)

export type DescriptiveSummaryInput = {
  transcriptText: string;
  mediaType: "AUDIO" | "VIDEO";
  contextLabel?: string | null;
  contextNote?: string | null;
  recordedAt?: Date | null;
};

export type DescriptiveSummaryOutput = {
  aiTitle: string;
  aiSummary: string;
};

const MAX_TITLE = 80;
const MAX_SUMMARY = 350;

const SYSTEM_PROMPT = `Sos un asistente que describe brevemente lo que un paciente dijo en un audio o video grabado para su psicóloga.

Tu único trabajo: producir un título corto y un resumen descriptivo del CONTENIDO LITERAL del registro.

REGLAS ESTRICTAS:
- NO interpretes clínicamente.
- NO diagnostiques.
- NO sugieras tratamiento ni recomendaciones.
- NO generes nivel de alerta, riesgo ni emoción predominante.
- NO inventes nada que no esté en la transcripción.
- NO uses estas palabras o equivalentes: "presenta", "se observa", "síntomas", "crisis", "riesgo", "alerta", "trabajar en sesión", "recomendación", "tratamiento", "diagnóstico", "emoción predominante".
- Escribí en español rioplatense neutro, claro y conciso.
- Tratá al sujeto como "El paciente" y usá fórmulas como "El paciente comenta…", "El paciente menciona…", "En el registro se refiere a…".
- Si el paciente usa una palabra clínica, podés repetirla aclarando que fue dicha por él (ej: "El paciente menciona sentirse ansioso").
- Si la transcripción es muy corta o ininteligible, decilo: "El registro contiene muy poco contenido audible." No inventes.

LÍMITES:
- aiTitle: máximo ${MAX_TITLE} caracteres.
- aiSummary: máximo ${MAX_SUMMARY} caracteres.

EXTENSIÓN DEL RESUMEN:
El resumen debe ser muy breve, útil para escaneo rápido. Máximo 2 frases (idealmente 1). No repetir detalles innecesarios. No enumerar. No reemplaza la transcripción completa: la psicóloga puede leer la transcripción si necesita el detalle.

FORMATO DE SALIDA OBLIGATORIO:
JSON válido con exactamente estas claves:
{"aiTitle":"...","aiSummary":"..."}

No agregues texto fuera del JSON.`;

function buildUserMessage(input: DescriptiveSummaryInput): string {
  const parts: string[] = [];
  parts.push(`Tipo de registro: ${input.mediaType === "AUDIO" ? "audio" : "video"}.`);
  if (input.contextLabel) parts.push(`Contexto declarado por el paciente: ${input.contextLabel}.`);
  if (input.contextNote) parts.push(`Nota contextual del paciente: ${input.contextNote}.`);
  if (input.recordedAt) {
    parts.push(`Fecha de grabación: ${input.recordedAt.toISOString().slice(0, 16).replace("T", " ")}.`);
  }
  parts.push("");
  parts.push("Transcripción literal:");
  parts.push(input.transcriptText.trim());
  return parts.join("\n");
}

function trimTo(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

class AiNotConfiguredError extends Error {
  constructor() {
    super("IA no configurada");
    this.name = "AiNotConfiguredError";
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function generateDescriptiveSummary(
  input: DescriptiveSummaryInput,
): Promise<DescriptiveSummaryOutput> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  if (!input.transcriptText || input.transcriptText.trim().length === 0) {
    throw new Error("Transcripción vacía");
  }

  const url = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 500,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Proveedor IA respondió HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  const content = extractAssistantContent(data);
  if (!content) throw new Error("Respuesta IA sin contenido");

  let parsed: { aiTitle?: unknown; aiSummary?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Respuesta IA no es JSON válido");
  }

  const aiTitle = typeof parsed.aiTitle === "string" ? parsed.aiTitle.trim() : "";
  const aiSummary = typeof parsed.aiSummary === "string" ? parsed.aiSummary.trim() : "";

  if (!aiTitle || !aiSummary) {
    throw new Error("Respuesta IA incompleta");
  }

  return {
    aiTitle: trimTo(aiTitle, MAX_TITLE),
    aiSummary: trimTo(aiSummary, MAX_SUMMARY),
  };
}

function extractAssistantContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const msg = (choices[0] as { message?: unknown }).message;
  if (!msg || typeof msg !== "object") return null;
  const content = (msg as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

export { AiNotConfiguredError };
