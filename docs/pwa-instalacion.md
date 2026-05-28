# Pulso · Instalación como app en celular (PWA)

## Qué es la app instalable

Pulso es una app web progresiva (PWA). No se descarga de la App Store ni de
Google Play. Se instala directamente desde el navegador y queda en la pantalla
de inicio como una app normal.

Una vez instalada:
- Se abre sin barra de navegador (pantalla completa).
- Tiene ícono propio en la pantalla de inicio.
- Funciona igual que la web, con las mismas funcionalidades.

---

## Cómo instalar en Android (Chrome)

1. Abrir Pulso en Chrome.
2. Tocar el menú (tres puntos, arriba a la derecha).
3. Tocar **"Agregar a pantalla de inicio"** o **"Instalar app"**.
4. Confirmar. El ícono de Pulso aparece en tu pantalla de inicio.

En algunos dispositivos Chrome muestra un banner automático en la parte inferior
de la pantalla invitando a instalar. También se puede tocar para instalar desde
ahí.

---

## Cómo instalar en iPhone/iPad (Safari)

1. Abrir Pulso en Safari (debe ser Safari, no Chrome ni otro navegador).
2. Tocar el ícono de **compartir** (cuadrado con flecha hacia arriba, abajo en la
   pantalla).
3. Deslizar hacia abajo y tocar **"Agregar a pantalla de inicio"**.
4. Editar el nombre si querés y tocar **Agregar**. El ícono aparece en tu
   pantalla de inicio.

---

## Qué NO hace todavía

- **No funciona sin internet.** No hay modo offline. Se necesita conexión para
  grabar, subir y ver registros.
- **No tiene notificaciones push.** No va a mandarte avisos cuando la psicóloga
  revise un registro.
- **No tiene integración con WhatsApp.** El envío automático por WhatsApp está
  documentado pero no implementado.
- **No es un APK.** No existe archivo para instalar manualmente por fuera del
  navegador.
- **No está en Google Play ni en App Store.** Se instala únicamente desde el
  navegador como se indica arriba.

---

## Cómo desinstalar

**Android:**
Mantener presionado el ícono de Pulso en la pantalla de inicio → tocar
"Desinstalar" o "Eliminar".

**iPhone/iPad:**
Mantener presionado el ícono de Pulso → tocar "Eliminar app" → confirmar.

Desinstalar no borra tus datos. Los registros quedan guardados en el servidor.

---

## Checklist de prueba

Antes de dar la instalación como validada:

- [ ] El ícono aparece en pantalla de inicio con fondo verde sage.
- [ ] Al abrir, no se ve la barra del navegador (pantalla standalone).
- [ ] El nombre en la pantalla de inicio dice "Pulso".
- [ ] El color de la barra de estado (iOS) o de la barra superior (Android) es
      verde sage #5C8770.
- [ ] Se puede grabar y subir audio desde la app instalada.
- [ ] Se puede ver el timeline desde la app instalada.
- [ ] Al cerrar y volver a abrir, la sesión sigue activa (si no expiró).

---

## Notas técnicas

- Manifest: `/manifest.webmanifest` (generado automáticamente por Next.js desde
  `src/app/manifest.ts`).
- Íconos: `public/icons/icon-192.svg` y `public/icons/icon-512.svg`.
- `theme_color`: `#5C8770` (verde sage Sereno).
- `background_color`: `#F8F7F2` (papel Sereno).
- `display`: `standalone`.

Los íconos son SVG. Chrome en Android los soporta desde la versión 93. Para
dispositivos más viejos o Safari < 15, el ícono podría verse diferente o usar
el favicon por defecto. En esos casos, se recomienda agregar PNG de 192×192 y
512×512 como fallback en una iteración futura.
