# Storage: CORS en Cloudflare R2 (bucket `pulso-media`)

Fuente de verdad operativa para la configuración de CORS del bucket de
almacenamiento que usa Pulso. Si la subida desde `/patient/new-entry` falla
con el mensaje *"No se pudo subir el archivo al almacenamiento. Probable
CORS del bucket R2/S3 o URL firmada inválida."*, el problema casi siempre
está acá, no en el código ni en Railway.

> Pegar la policy en Cloudflare R2 es una acción **manual**. Un commit de
> este repo no cambia CORS. Un redeploy de Railway tampoco.

---

## Contexto del flujo

Pulso sube archivos con **URL firmada (presigned PUT)** directo al bucket,
sin pasar por el backend de Next:

1. El cliente llama `POST /api/patient/entries` con `action=init` y el
   `contentType` del archivo (ej. `audio/ogg`, `video/mp4`).
2. El backend firma una URL `PUT` para esa key y ese `Content-Type` usando
   `presignUpload` (`src/lib/s3.ts:30-33`).
3. El navegador hace `PUT` a esa URL del bucket con
   `headers: { "Content-Type": file.type }` y el `body` del archivo
   (`src/app/patient/new-entry/new-entry-form.tsx:55-61`).
4. Si todo va bien, el cliente llama `POST /api/patient/entries` con
   `action=complete` para persistir el registro.

El paso 3 cruza un origin distinto (la app está en
`pulso-production-ad5d.up.railway.app`, el bucket está en
`*.r2.cloudflarestorage.com`), así que el navegador hace primero un
preflight `OPTIONS`. Si el bucket no autoriza ese origin / método / header,
el `PUT` ni siquiera se envía y el frontend cae en el `catch` con el
mensaje de arriba.

---

## Policy CORS final (R2 → bucket `pulso-media` → Settings → CORS Policy)

```json
[
  {
    "AllowedOrigins": [
      "https://pulso-production-ad5d.up.railway.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Reglas

- **Bucket correcto:** `pulso-media`. No tocar otros buckets del proyecto.
- **`AllowedOrigins` debe ser exacto, sin barra final y sin path.**
  - OK: `https://pulso-production-ad5d.up.railway.app`
  - NO: `https://pulso-production-ad5d.up.railway.app/`
  - NO: `https://pulso-production-ad5d.up.railway.app/patient/new-entry`
  - NO: `*` (rompe el contrato de seguridad del bucket privado).
- **`AllowedMethods`:** `PUT` para subir, `GET`+`HEAD` para descargas/CDN
  cuando el bucket sirva por URL firmada de lectura.
- **`AllowedHeaders: ["*"]`:** tolerante a propósito. El SDK puede firmar
  con headers extra (ej. `x-amz-content-sha256`, `x-amz-date`) y restringir
  a `Content-Type` deja afuera variantes válidas.
- **`ExposeHeaders: ["ETag"]`:** opcional, útil si más adelante se hacen
  multipart uploads o se verifica integridad post-PUT.
- **`MaxAgeSeconds: 3600`:** cachea el preflight 1h para no spamear OPTIONS.

### Dominio propio (futuro)

Si se agrega CNAME (Railway custom domain o Vercel), sumar el origin nuevo
al array. **No reemplazar** los existentes hasta confirmar la migración:

```json
"AllowedOrigins": [
  "https://pulso-production-ad5d.up.railway.app",
  "https://pulso.example.com",
  "http://localhost:3000"
]
```

---

## Diagnóstico

Cuando el frontend muestra:

> *"No se pudo subir el archivo al almacenamiento. Probable CORS del
> bucket R2/S3 o URL firmada inválida."*

Interpretarlo así:

- `POST /api/patient/entries` (`action=init`) **ya respondió 200** y el
  cliente recibió la `uploadUrl` firmada. Si fallara ahí, el mensaje sería
  *"No se pudo iniciar la subida"*.
- La falla está en el `PUT` directo al bucket, es decir en la red entre el
  navegador y `*.r2.cloudflarestorage.com`.
- Si las variables S3 en Railway están definidas y el servicio responde
  `200` en `/api/healthz`, Railway no es sospechoso.
- El sospechoso principal es **CORS del bucket** en Cloudflare R2.

### Cómo confirmar

1. Abrir DevTools → pestaña **Network** → reintentar la subida.
2. Buscar la request `OPTIONS` a `*.r2.cloudflarestorage.com`.
   - Si responde 403/`No CORSConfiguration` o el `Access-Control-Allow-Origin`
     no incluye el origin de la app → es CORS. Aplicar la policy de arriba.
3. Si el `OPTIONS` pasa pero el `PUT` da 403 con `SignatureDoesNotMatch` →
   la URL firmada o las credenciales son el problema, no CORS.
4. Si el `PUT` da 200 pero la app sigue mostrando error → mirar el
   `action=complete`, no es CORS.

### Lo que no cambia el resultado

- Reintentar la subida sin tocar Cloudflare.
- Redeploy de Railway.
- Bumpear la versión del cliente.
- Cambiar el archivo (`.ogg` vs `.mp4` vs `.webm`): el bucket rechaza
  cualquier preflight si CORS no está, da igual el `Content-Type`.

---

## Checklist post-configuración

Una vez pegada la policy en Cloudflare R2:

- [ ] Guardar la policy en R2 → bucket `pulso-media` → Settings → CORS Policy.
- [ ] Esperar ~30 segundos (R2 propaga la config).
- [ ] Recargar la app en el navegador (Ctrl+Shift+R para descartar caché).
- [ ] Entrar como **paciente demo 1** o **paciente demo 2** desde `/login`.
- [ ] Ir a `/patient/new-entry`.
- [ ] Probar una subida `.ogg` (audio).
- [ ] Probar una subida `.mp4` (video).
- [ ] Confirmar que el registro aparece en `/patient/timeline`.
- [ ] (Opcional) Como psicóloga demo, abrir la timeline del paciente y
      reproducir el archivo recién subido.

Si alguno falla, volver a "Diagnóstico" arriba antes de tocar código.
