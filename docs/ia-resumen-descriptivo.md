# Pulso · IA descriptiva (título + resumen)

## Objetivo

Asistir a la psicóloga generando, **a pedido**, dos artefactos descriptivos a
partir de la transcripción de un registro del paciente:

- **`aiTitle`**: título sugerido breve (≤ 80 caracteres).
- **`aiSummary`**: resumen descriptivo de lo dicho (≤ 900 caracteres).

La IA describe contenido. **La psicóloga interpreta.**

## Límites estrictos (qué NO hace la IA)

- No interpreta clínicamente.
- No diagnostica.
- No sugiere tratamiento ni "trabajar X en sesión".
- No genera nivel de alerta ni de riesgo.
- No nombra emoción predominante.
- No infiere nada que no esté en la transcripción.
- No usa vocabulario clínico-evaluativo: "presenta", "se observa", "síntomas",
  "crisis", "riesgo", "alerta", "recomendación", "tratamiento", "diagnóstico",
  "emoción predominante".

Si el paciente usa una palabra clínica en su discurso, la IA puede repetirla
**aclarando que fue dicha por él** (ej: *"El paciente menciona sentirse
ansioso"*).

## Dependencia obligatoria

El endpoint requiere **transcripción no vacía**. Sin transcripción:

```
HTTP 400
"Primero pedí la transcripción para generar el resumen."
```

La psicóloga primero pide transcripción, después puede pedir el resumen IA.

## Estilo

- Español rioplatense neutro, claro, conciso.
- Sujeto: "El paciente".
- Verbos: "comenta", "menciona", "describe", "se refiere a", "cuenta".
- Si la transcripción es muy corta o ininteligible, decirlo literalmente:
  *"El registro contiene muy poco contenido audible."* No inventar.

## Ejemplos

### ✅ Correcto

> **Título sugerido:**
> Comentario sobre el viaje al trabajo
>
> **Resumen de lo dicho:**
> El paciente comenta que durante el viaje al trabajo se sintió incómodo y que
> le costó ordenar lo que estaba pensando. Menciona que grabar el audio le
> sirvió para dejar registrado el momento.

### ❌ Incorrecto (prohibido)

> "Se observa ansiedad moderada y sería recomendable trabajar regulación
> emocional en sesión."

Eso es interpretación clínica. Lo hace la psicóloga, no la IA.

## Arquitectura

- `src/lib/ai-summary.ts` — función `generateDescriptiveSummary(input)`.
- `POST /api/psychologist/entries/[entryId]/ai-summary` — endpoint, solo rol
  PSYCHOLOGIST, solo registros de su paciente.
- UI: sección "Título y resumen sugeridos (IA)" dentro de `EntryControls`
  del timeline de la psicóloga.

### Estados de `aiStatus`

| Estado | UI |
|---|---|
| `NOT_REQUESTED` | Botón "Generar título y resumen IA" (si hay transcripción). |
| `PENDING` | "Generando…". |
| `COMPLETED` | Muestra título + resumen + disclaimer. Botón "Regenerar". |
| `FAILED` | "Falló la generación. Probá de nuevo." + botón. |

Si todavía no hay transcripción: *"Para generar título/resumen IA, primero
pedí la transcripción."*

## Configuración (env vars)

| Variable | Obligatoria | Default |
|---|---|---|
| `AI_API_KEY` | sí | — |
| `AI_API_URL` | no | `https://api.openai.com/v1/chat/completions` |
| `AI_MODEL` | no | `gpt-4o-mini` |

Sin `AI_API_KEY`, el endpoint devuelve `503 "IA no configurada en este
entorno."` y el `aiStatus` queda en `FAILED`. La app sigue funcionando
normalmente — solo el botón de IA da error controlado.

## Seguridad

- API key solo en env, **nunca** hardcodeada ni commiteada.
- El endpoint valida rol PSYCHOLOGIST y que el `entry` pertenezca a un paciente
  de esa psicóloga.
- No se exponen `uploadUrl`, secrets, ni la transcripción en logs.
- No se llama al proveedor IA en build/lint/tests.

## Fuera de alcance en esta fase

- Mostrar IA al paciente.
- WhatsApp.
- Envío automático.
- Cualquier interpretación clínica o categorización emocional.
