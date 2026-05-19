// Stub para transcripción bajo demanda.
// TODO: conectar proveedor real (Whisper / OpenAI / AssemblyAI).
// Mientras no esté configurado, la solicitud queda en estado PENDING y se muestra
// "Transcripción pendiente de configuración" en la UI del psicólogo.

export async function requestTranscription(entryId: string): Promise<{
  status: "PENDING" | "COMPLETED" | "FAILED";
  text?: string;
}> {
  // No inventar transcripciones. Devolver PENDING hasta que se configure proveedor.
  void entryId;
  return { status: "PENDING" };
}

export function isTranscriptionProviderConfigured() {
  return false;
}
