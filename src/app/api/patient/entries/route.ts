import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole } from "@/lib/auth";
import { presignUpload, isS3Configured } from "@/lib/s3";
import { handle } from "@/lib/http";

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 100);
const ALLOWED_AUDIO = ["audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"];
const ALLOWED_VIDEO = ["video/webm", "video/mp4", "video/quicktime", "video/ogg"];

const InitBody = z.object({
  action: z.literal("init"),
  title: z.string().min(1).max(120),
  mediaType: z.enum(["AUDIO", "VIDEO"]),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const CompleteBody = z.object({
  action: z.literal("complete"),
  title: z.string().min(1).max(120),
  mediaType: z.enum(["AUDIO", "VIDEO"]),
  mediaKey: z.string().min(1),
});

const Body = z.union([InitBody, CompleteBody]);

export async function POST(req: Request) {
  try {
    const user = await requireRole("PATIENT");
    const profile = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new HttpError(400, "Paciente sin psicólogo asignado");

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "Datos inválidos");

    if (parsed.data.action === "init") {
      const { title, mediaType, contentType, sizeBytes } = parsed.data;
      const allowed = mediaType === "AUDIO" ? ALLOWED_AUDIO : ALLOWED_VIDEO;
      if (!allowed.includes(contentType)) throw new HttpError(400, "Tipo de archivo no permitido");
      if (sizeBytes > MAX_MB * 1024 * 1024) {
        throw new HttpError(400, `Archivo excede ${MAX_MB} MB`);
      }
      if (!isS3Configured()) {
        throw new HttpError(503, "Almacenamiento no configurado. Definí variables S3_* en .env");
      }
      const ext = contentType.split("/")[1]?.split(";")[0] || "bin";
      const key = `patients/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const uploadUrl = await presignUpload(key, contentType);
      return NextResponse.json({ uploadUrl, key, title });
    }

    const { title, mediaType, mediaKey } = parsed.data;
    if (!mediaKey.startsWith(`patients/${user.id}/`)) {
      throw new HttpError(403, "Key inválida");
    }
    const entry = await prisma.timelineEntry.create({
      data: {
        patientId: user.id,
        psychologistId: profile.psychologistId,
        title: title.trim(),
        mediaType,
        mediaKey,
      },
    });
    return NextResponse.json({ id: entry.id });
  } catch (err) {
    return handle(err);
  }
}
