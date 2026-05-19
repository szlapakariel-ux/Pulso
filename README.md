# Pulso

App de acompañamiento entre sesiones. El paciente registra audios o videos cortos
con un título y fecha; el psicólogo ve la línea de tiempo, agrega notas privadas
y solicita transcripciones bajo demanda.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL (Railway) + S3/R2**.

---

## Roles

- **Paciente**: ve solo su propia línea de tiempo, crea registros, reproduce sus archivos.
- **Psicólogo**: ve la lista de pacientes asignados, su línea de tiempo, agrega notas privadas y solicita transcripciones.

Permisos aplicados en **backend** (no solo en frontend). Ver checklist más abajo.

---

## Setup local

```bash
cp .env.example .env
# completar DATABASE_URL, AUTH_SECRET y credenciales S3/R2

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Abrir `http://localhost:3000`.

### Usuarios de prueba (después del seed)

| Rol         | Email                  | Password |
|-------------|------------------------|----------|
| Psicóloga   | `psicologo@pulso.app`  | `123456` |
| Paciente 1  | `paciente@pulso.app`   | `123456` |
| Paciente 2  | `paciente2@pulso.app`  | `123456` |

> Los registros de seed apuntan a `mediaKey` ficticias: aparecen en la timeline,
> pero la reproducción solo funciona con archivos subidos desde la app a R2/S3.

---

## Comandos

```bash
npm install
npm run dev               # desarrollo
npm run build             # build de producción (incluye prisma generate)
npm run lint
npm start                 # servidor de producción
npx prisma migrate dev    # crear/aplicar migración en dev
npx prisma migrate deploy # aplicar migraciones en prod
npx prisma db seed        # poblar usuarios y datos de prueba
npx prisma validate
```

---

## Deploy

### Base de datos (Railway)

1. Crear un proyecto en Railway y agregar PostgreSQL.
2. Copiar el `DATABASE_URL` (formato `postgresql://...`) a las variables del proyecto.
3. Ejecutar migraciones: `npx prisma migrate deploy`.
4. (Opcional) Seed: `npx prisma db seed`.

### App (Railway o Vercel)

- Variables de entorno: todas las que aparecen en `.env.example`.
- Railway: agregar como servicio Node/Next; build command `npm run build`, start `npm start`.
- Vercel: importar el repo; agregar variables; build command por defecto.

### Almacenamiento (Cloudflare R2 o S3)

- Crear bucket privado.
- Crear access key.
- Configurar CORS para permitir PUT desde el dominio de la app:
  ```json
  [
    {
      "AllowedOrigins": ["https://<tu-dominio>"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["*"]
    }
  ]
  ```
- Si el bucket es público, definir `S3_PUBLIC_BASE_URL` (las descargas serán directas).
  Si es privado, dejarla vacía y se usarán URLs firmadas de lectura.

---

## Páginas

```
/login
/patient/timeline
/patient/new-entry
/psychologist/patients
/psychologist/patients/[patientId]/timeline
```

## Endpoints (API Routes)

```
POST  /api/auth/login
POST  /api/auth/logout

GET   /api/patient/timeline
POST  /api/patient/entries           # action=init -> URL firmada; action=complete -> persiste

GET   /api/psychologist/patients
GET   /api/psychologist/patients/:patientId/timeline
POST  /api/psychologist/entries/:entryId/notes
POST  /api/psychologist/entries/:entryId/transcription-request
```

---

## Arquitectura

- **Next.js App Router** con Server Components para vistas, Route Handlers para API.
- **Auth**: cookie HttpOnly + JWT firmado con `jose` (HS256). Rol embebido en el token,
  pero el rol y la pertenencia se vuelven a verificar contra la DB en cada request crítico.
- **Prisma + PostgreSQL**: solo metadatos. Archivos viven en R2/S3.
- **Subida directa al bucket**: el cliente pide URL firmada (`action=init`), sube por
  `PUT`, y avisa con `action=complete`. Las claves del bucket nunca llegan al frontend.
- **Descarga**: si `S3_PUBLIC_BASE_URL` está definido, se sirve por CDN; si no, URL firmada
  de lectura por 1h. Como las URL son derivadas server-side, el cliente no ve claves.
- **Transcripción bajo demanda**: `src/lib/transcription.ts` es un stub que devuelve
  `PENDING`. La UI muestra *"Transcripción pendiente de configuración"* hasta que se
  conecte un proveedor real (Whisper, OpenAI, AssemblyAI).
- **Aislamiento**: cada query filtra por `patientId === user.id` (paciente) o
  `psychologistId === user.id` (psicólogo). Las relaciones se revalidan antes de
  cualquier escritura.

---

## Checklist de seguridad aplicado

- [x] Auth con cookie HttpOnly + JWT firmado (`AUTH_SECRET` por env).
- [x] Validación de rol en **todos** los endpoints sensibles (`requireRole`).
- [x] Validación de pertenencia paciente-psicólogo antes de leer/escribir.
- [x] Endpoint de paciente nunca devuelve `notes` ni `transcription`.
- [x] Validación server-side con `zod` en cada body de API.
- [x] Validación de tipo MIME y tamaño máximo (`MAX_UPLOAD_MB`).
- [x] `mediaKey` validada server-side: debe empezar con `patients/<userId>/` antes
      de persistir, evitando que un paciente reclame un objeto ajeno.
- [x] URLs firmadas para subida (PUT) y descarga (GET) — claves S3 nunca al frontend.
- [x] Variables de entorno para todos los secretos; `.env` ignorado por git.
- [x] Middleware redirige a `/login` rutas protegidas sin sesión.
- [x] `cookies()` con `secure` en producción y `sameSite=lax`.
- [x] Errores de permisos con códigos 401/403 claros, sin filtrar datos internos.

---

## TODO futuro

- [ ] Conectar proveedor real de transcripción en `src/lib/transcription.ts`
      (recomendado: Whisper API u OpenAI). El endpoint ya hace `upsert` del estado.
- [ ] Worker/queue para procesar transcripciones de forma asíncrona y actualizar el estado.
- [ ] Grabación in-browser con `MediaRecorder` (hoy se usa el selector de archivos
      del SO, que ya cubre cámara/mic en móvil).
- [ ] Eliminación de registros y borrado de objetos en R2 al borrar entrada.
- [ ] Rate limiting en `/api/auth/login`.
- [ ] Self-onboarding: alta de psicólogos y asignación de pacientes desde UI
      (hoy es solo por seed/DB).
- [ ] Tests E2E (Playwright) cubriendo flujos paciente / psicólogo y aislamiento.
- [ ] Internacionalización (hoy ES-AR fijo).
- [ ] Indicador de progreso real durante la subida (XHR + onprogress).

---

## Probar paciente

1. Login con `paciente@pulso.app / 123456`.
2. Tocar **+ Nuevo registro**.
3. Poner título, elegir Audio o Video, adjuntar/grabar.
4. Guardar → vuelve a `/patient/timeline` con el registro recién creado.
5. Verificar que **no** existe ningún link al panel del psicólogo.

## Probar psicólogo

1. Login con `psicologo@pulso.app / 123456`.
2. Ver lista de pacientes.
3. Entrar a la timeline de un paciente.
4. Agregar una nota privada → aparece solo en este panel.
5. Tocar **Solicitar transcripción** → estado pasa a *Transcripción pendiente de configuración*.
6. Confirmar que el paciente, al loguearse en otra sesión, **no** ve ni la nota
   ni el estado de transcripción.
