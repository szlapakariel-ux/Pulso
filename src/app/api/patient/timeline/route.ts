import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { presignDownload } from "@/lib/s3";
import { handle } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireRole("PATIENT");
    const entries = await prisma.timelineEntry.findMany({
      where: { patientId: user.id },
      orderBy: { createdAt: "desc" },
    });
    // El paciente NUNCA recibe notas privadas ni transcripciones.
    const out = await Promise.all(
      entries.map(async (e) => ({
        id: e.id,
        title: e.title,
        mediaType: e.mediaType,
        createdAt: e.createdAt,
        mediaUrl: await presignDownload(e.mediaKey),
      })),
    );
    return NextResponse.json({ entries: out });
  } catch (err) {
    return handle(err);
  }
}
