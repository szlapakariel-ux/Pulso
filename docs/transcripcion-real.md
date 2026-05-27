# Pulso · Transcripción real bajo demanda

## Objetivo

Que la psicóloga pueda solicitar la transcripción de un audio/video del
paciente. La transcripción se persiste en `Transcription.text` y habilita la
generación de IA descriptiva (PR #4).

La psicóloga interpreta. Pulso solo transcribe.

## Flujo

1. Psicóloga toca **Solicitar transcripción** en `EntryControls`.
2. `POST /api/psychologist/entries/[entryId]/transcription-request`:
   - valida rol PSYCHOLOGIST y ownership del registro;
   - marca `Transcription.status = PENDING`;
   - `presignDownload(mediaKey)` → URL firmada del bucket;
   - descarga el archivo (`fetch`) → `Blob`;
   - envía multipart al endpoint Whisper-compatible;
   - persiste `status = COMPLETED, text = …`.
3. UI muestra los 4 estados (`NOT_REQUESTED` / `PENDING` / `COMPLETED` / `FAILED`).

## Configuración (env vars)

| Variable | Obligatoria | Default |
|---|---|---|
| `TRANSCRIPTION_API_KEY` | sí | — |
| `TRANSCRIPTION_API_URL` | no | `https://api.openai.com/v1/audio/transcriptions` |
| `TRANSCRIPTION_MODEL` | no | `whisper-1` |

Sin `TRANSCRIPTION_API_KEY` el endpoint responde
`503 "Transcripción no configurada en este entorno."` y el `Transcription.status`
queda `FAILED`. La app sigue corriendo.

## Seguridad

- API key solo en env, nunca hardcodeada ni commiteada.
- El endpoint valida rol PSYCHOLOGIST y ownership.
- No se loguean: la URL firmada de descarga, el contenido del archivo ni el
  texto transcripto.
- No se llama al proveedor en build/lint/tests.
- La transcripción no se muestra al paciente.

## Estados visibles

| Estado | UI |
|---|---|
| `NOT_REQUESTED` | "Sin solicitar" + botón. |
| `PENDING` | "Transcribiendo…" + botón deshabilitado. |
| `COMPLETED` | "Completada" + texto + botón "Solicitada" (deshabilitado). |
| `FAILED` | "Falló la transcripción" + botón habilitado para reintentar. |

## Fuera de alcance

- Transcripción para el paciente.
- Reintentos automáticos.
- Diarización (separar hablantes).
- Activación automática de IA descriptiva tras COMPLETED.
- WhatsApp / envíos.
