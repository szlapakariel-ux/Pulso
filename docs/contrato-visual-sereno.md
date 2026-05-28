# Pulso · Contrato visual Sereno

## 1. Objetivo del contrato
Documentar la dirección visual base de Pulso para futura implementación como app web instalable/PWA.

Pulso debe sentirse como:
- un espacio de registro
- simple
- cálido
- seguro
- humano
- mobile-first
- no clínico frío
- no dashboard empresarial

Frase guía:
"Un espacio para registrar. Nada más, nada menos."

## 2. Dirección visual aprobada

Nombre de dirección:
Sereno

Concepto:
La app debe desaparecer para que el registro sea lo único.

Idea central:
Pulso no debe sentirse como una herramienta médica pesada, sino como un espacio silencioso de acompañamiento.

Lenguaje visual:
- calma silenciosa
- contención
- claridad
- baja fricción
- profesionalismo humano
- pocos elementos
- mucha respiración visual

## 3. Paleta base

Registrar esta paleta como base inicial:

- Primario: #5C8770
- Soft: #EAF1EC
- Papel: #F8F7F2
- Tinta: #1B221F
- Acento: #C99563

Uso sugerido:

Primario #5C8770:
- botones principales
- ícono de app
- indicadores importantes
- elementos activos

Soft #EAF1EC:
- fondos de bloques suaves
- resumen IA
- estados secundarios

Papel #F8F7F2:
- fondo general cálido
- pantalla base
- cards amplias

Tinta #1B221F:
- texto principal
- títulos
- navegación

Acento #C99563:
- detalles puntuales
- no usar como color dominante
- evitar sobrecargar

## 4. Tipografía

Propuesta base:
- Display / Body: Geist
- Acentos puntuales: Instrument Serif

Criterio:
- priorizar legibilidad mobile
- evitar estética decorativa excesiva
- usar serif solo como acento emocional, no para textos largos
- mantener jerarquía clara

## 5. Ícono de app

Dirección aprobada:
- fondo verde salvia
- línea de pulso simple en color papel
- debe funcionar en 512x512
- debe funcionar en 192x192
- debe funcionar chico en pantalla de inicio

Criterio:
El ícono debe transmitir:
- calma
- registro
- salud emocional sin parecer hospital
- simpleza

No usar:
- cerebro
- cruz médica
- corazón clínico
- símbolos de emergencia
- emojis
- exceso de detalle

## 6. UX paciente

La experiencia del paciente debe ser extremadamente simple.

Acciones principales:
- Grabar audio
- Grabar video
- Adjuntar
- Agregar contexto opcional
- Guardar registro
- Ver timeline propio

Prioridad:
El paciente debe poder registrar algo rápido, sin pensar demasiado.

Pantallas base:
- Login
- Home paciente
- Grabación de audio
- Detalle / timeline del registro

Textos de tono sugeridos:
- "Te escuchamos."
- "Tomate el tiempo que necesites."
- "Contame qué pasó (opcional)."

Evitar:
- lenguaje clínico
- etiquetas diagnósticas
- métricas emocionales visibles
- gamification
- presión por completar campos

## 7. UX psicóloga

La psicóloga necesita entender rápido qué pasó sin quedar enterrada en texto.

Elementos importantes:
- paciente
- fecha/hora
- tipo de registro
- audio/video
- contexto del paciente
- título IA
- resumen IA
- transcripción colapsada

Regla principal:
El resumen IA debe ser protagonista.
La transcripción completa debe quedar secundaria.

Comportamiento aprobado:
- Transcripción colapsada por default.
- Botón "Ver transcripción".
- Botón "Ocultar transcripción".
- Si la psicóloga pide transcripción explícitamente, puede abrirse al finalizar.
- Si la psicóloga pide resumen IA, no debe abrirse automáticamente la transcripción.

## 8. Resumen IA

El bloque de resumen IA debe:
- estar visualmente destacado
- ser claro
- no parecer diagnóstico
- no competir con la transcripción completa
- ayudar a ahorrar lectura

Debe incluir aviso:
"Resumen descriptivo automático. No es interpretación clínica."

No usar:
- "diagnóstico"
- "evaluación clínica"
- "riesgo"
- "perfil psicológico"
- "alerta" salvo decisión futura explícita

## 9. Cards y timeline

Las cards deben ser:
- claras
- respiradas
- con buena separación
- legibles en celular
- con jerarquía simple

Cada card debería priorizar:
- momento del registro
- tipo de contenido
- título o contexto
- estado enviado / resumido
- acceso rápido al audio/video

Evitar:
- bordes duros excesivos
- sombras pesadas
- muchas etiquetas
- saturación visual

## 10. Qué adoptar ahora

Adoptar en próximos microciclos:
- paleta base
- ícono de app
- manifest PWA
- metadata visual
- estilo general de botones
- estilo de cards
- fondo cálido
- resumen IA destacado
- transcripción colapsada

## 11. Qué dejar para después

No implementar todavía:
- rediseño total
- modo offline
- push notifications
- service worker complejo
- WhatsApp real
- notificaciones
- gamification
- métricas emocionales
- dashboard clínico avanzado
- cambios grandes de arquitectura

## 12. Riesgos de diseño

Riesgos a evitar:
- que parezca una app médica fría
- que parezca un CRM
- que el paciente sienta que está siendo evaluado
- que la psicóloga vea demasiada información junta
- que la IA parezca interpretar clínicamente
- que el resumen duplique la transcripción

## 13. PWA futura

Este contrato servirá como base para:
- ícono instalable
- manifest
- theme color
- background color
- pantalla de inicio
- sensación de app real en celular

Pero este microciclo NO debe implementar PWA todavía.

## 14. Decisión final

Dirección visual Sereno:
Aprobada como base inicial de Pulso.

Estado:
Contrato documental.
No implementación.
