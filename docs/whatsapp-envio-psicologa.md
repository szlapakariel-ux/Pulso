# Pulso · Envío WhatsApp a la psicóloga

## Estado

**Funcionalidad no activa.** Este documento es el contrato de diseño para la
futura integración. No hay código de envío, ni endpoint, ni webhook real en
esta fase.

---

## Objetivo

Notificar a la psicóloga por WhatsApp cuando un paciente sube un nuevo registro
(audio o video), incluyendo el resumen IA si ya fue generado.

---

## Identificación del paciente

El mensaje identifica al paciente por **nombre y apellido completo** tal como
figura en su perfil de Pulso (`User.name`). No se usa apodo, nickname ni alias.

**Regla de privacidad:** el mensaje WhatsApp viaja por infraestructura de Meta.
Por eso:

- Solo se incluye el nombre completo, no el número de teléfono, DNI, diagnóstico
  ni ningún otro dato sensible.
- El resumen (`aiSummary`) es descriptivo y no clínico (ver
  `ia-resumen-descriptivo.md`).
- El link al audio/video apunta a una URL firmada de duración limitada
  (presigned URL). La psicóloga debe abrir el link desde la app para ver el
  contenido completo.

---

## Plantilla del mensaje

```
Pulso — Registro recibido

Paciente:
{nombre_apellido_paciente}

Contexto:
{contexto}

Fecha:
{fecha_hora}

Título:
{aiTitle}

Resumen breve:
{aiSummary}

Audio:
{link}

Nota:
Resumen descriptivo automático. No es interpretación clínica.
```

### Variables

| Variable | Fuente | Notas |
|---|---|---|
| `{nombre_apellido_paciente}` | `User.name` del paciente | Nombre completo tal como fue registrado |
| `{contexto}` | `TimelineEntry.contextLabel` | Ej: "Antes de dormir", "Después de sesión". Si está vacío: "Sin contexto declarado" |
| `{fecha_hora}` | `TimelineEntry.recordedAt` o `createdAt` | Formato: `DD/MM/YYYY HH:MM` (zona horaria Argentina) |
| `{aiTitle}` | `TimelineEntry.aiTitle` | Solo si `aiStatus === "COMPLETED"`. Si no: omitir bloque completo |
| `{aiSummary}` | `TimelineEntry.aiSummary` | Solo si `aiStatus === "COMPLETED"`. Si no: omitir bloque completo |
| `{link}` | Presigned URL de lectura del `mediaKey` | Duración limitada. Si falla la generación: omitir bloque |

### Bloques opcionales

Si el resumen IA no está disponible (`aiStatus !== "COMPLETED"`), se omiten los
bloques **Título** y **Resumen breve** completamente (no se muestran vacíos).

Si el link falla, se omite el bloque **Audio** y se agrega al final:
`⚠️ No se pudo generar el link al archivo.`

---

## Qué NO se envía

- DNI, fecha de nacimiento, número de teléfono ni ningún otro dato identificador
  adicional.
- Transcripción completa (puede ser extensa y sensible).
- Interpretación clínica, diagnóstico, nivel de riesgo ni emoción predominante.
- `uploadUrl`, `mediaKey` ni ningún secret interno.
- Contenido de notas privadas de la psicóloga.
- Datos de otras pacientes.

---

## Configuración (futura)

| Variable | Descripción |
|---|---|
| `WHATSAPP_API_KEY` | Token de acceso a la API de WhatsApp Business |
| `WHATSAPP_API_URL` | Endpoint del proveedor (Meta o compatible) |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número remitente |

La psicóloga configura su número de WhatsApp receptor desde
`/psychologist/settings` (campo `whatsappPhone`, aún no implementado).

El envío se activa solo si `DailySummarySettings.channel === "WHATSAPP"` y
`DailySummarySettings.enabled === true`.

---

## Arquitectura futura

- Trigger: `POST /api/patient/entries` action `complete` → si la psicóloga
  tiene WhatsApp activo, encolar envío.
- Worker o cron: procesa la cola y llama al proveedor.
- No se llama al proveedor de WhatsApp en build, lint ni tests.
- En caso de fallo: reintentos con backoff, luego marcar como `FAILED` en log
  interno. No interrumpe el flujo del paciente.

---

## Fuera de alcance en esta fase

- Envío real a WhatsApp.
- Configuración de número en UI.
- Plantilla de resumen diario (múltiples registros del día).
- Respuesta del paciente por WhatsApp.
- Cualquier interpretación clínica automatizada.
