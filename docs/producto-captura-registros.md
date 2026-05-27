# Pulso · Captura de registros (paciente) y vista psicóloga

## Principios

- El paciente **no escribe título**. La app genera un título interno automático
  (`Audio · Tren · 19:53`) a partir de tipo, contexto y hora.
- Audio y video se **graban directamente** desde el navegador cuando hay soporte
  de `MediaRecorder` y permiso de mic/cámara.
- Adjuntar archivo queda **solo para archivos existentes** (ej. WhatsApp).
- Cada registro guarda **fecha/hora de grabación** (`recordedAt`) y
  **contexto** (`contextLabel` + `contextNote` opcional).
- Título y resumen generados por IA (`aiTitle`, `aiSummary`) quedan **reservados
  como campos del modelo** pero **sin generación automática** en esta fase.
- La psicóloga **no recibe interpretación clínica automática**: no hay nivel de
  alerta, emoción predominante ni sugerencia terapéutica.

## Flujo paciente

`/patient/new-entry`:

1. Pantalla "¿Qué querés registrar?" con 3 botones:
   - **Grabar audio** → pide micrófono, graba, permite escuchar y repetir.
   - **Grabar video** → pide cámara + micrófono, graba, permite mirar y repetir.
   - **Adjuntar archivo** → input `accept="audio/*,video/*"`; detecta `mediaType` por MIME.
2. Tras capturar, aparecen los campos de **contexto**:
   - Selector: Casa, Trabajo, Tren, Auto, Calle, Antes de dormir, Otro.
   - Nota libre opcional (≤ 280 caracteres).
3. Botón **Guardar registro**:
   - `POST /api/patient/entries action=init` → URL firmada al bucket.
   - `PUT uploadUrl` → sube el archivo.
   - `POST /api/patient/entries action=complete` → persiste con `recordedAt`,
     `contextLabel`, `contextNote`. El backend genera `title` interno.
4. Errores diferenciados por etapa (`init` / `upload` / `complete`).

### Fallback

Si `MediaRecorder` no está disponible o el navegador rechaza permisos, la
pantalla muestra:

> "No se pudo abrir la grabación directa. Podés adjuntar un archivo existente."

## Timeline paciente (`/patient/timeline`)

Tarjeta por registro:

- Tipo + fecha/hora (`recordedAt` si existe, si no `createdAt`).
- Contexto (label + nota), si fueron provistos.
- Audio → reproductor inline.
- Video → **miniatura** que abre un visor expandido (modal) al tocar; cerrar
  vuelve a la miniatura.

No se muestra `title` interno como si fuera del paciente.

## Timeline psicóloga (`/psychologist/patients/[id]/timeline`)

Cada tarjeta agrega sobre el modelo paciente:

- `aiTitle` como "Título sugerido", solo si existe.
- `aiSummary` como "Resumen de lo dicho", solo si existe.
- Notas privadas y botón de transcripción existentes.

Sin lenguaje clínico interpretativo.

## Configuración de resumen diario

`/psychologist/settings`:

- Activar resumen diario (sí/no).
- Hora de envío (`HH:MM`).
- Canal: Manual / WhatsApp / Email.
- Zona horaria fija `America/Argentina/Buenos_Aires`.

**Nada se envía todavía.** La pantalla aclara explícitamente que sólo se guarda
la preferencia. El modelo `DailySummarySettings` queda listo para conectar a un
job de envío en una fase posterior.

## Modelo de datos (cambios)

`TimelineEntry`:

- `recordedAt   DateTime?`
- `contextLabel String?`
- `contextNote  String?`
- `aiTitle      String?`
- `aiSummary    String?`
- `aiStatus     AiStatus  @default(NOT_REQUESTED)` (`NOT_REQUESTED|PENDING|COMPLETED|FAILED`)

Nuevo modelo `DailySummarySettings` (1 fila por psicóloga):

- `psychologistId String @unique`
- `channel        SummaryChannel @default(MANUAL)` (`MANUAL|WHATSAPP|EMAIL`)
- `sendTime       String  @default("08:00")`
- `timezone       String  @default("America/Argentina/Buenos_Aires")`
- `enabled        Boolean @default(false)`

Migración: `prisma/migrations/20260526120000_captura_directa_contexto_settings/`.

## Fuera de alcance de este ciclo

- No conectar LLM.
- No conectar WhatsApp/Email para envío real.
- No generar interpretación clínica.
- No tocar Cloudflare/Railway (config de CORS/bucket sigue siendo gestión de
  infraestructura).
