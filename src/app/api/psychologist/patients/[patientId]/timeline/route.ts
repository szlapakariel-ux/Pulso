import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole } from "@/lib/auth";
import { presignDownload } from "@/lib/s3";
import { handle } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: { patientId: string } }) {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: params.patientId },
    });
    if (!profile || profile.psychologistId !== user.id) {
      throw new HttpError(403, "Paciente no asignado");
    }
    const entries = await prisma.timelineEntry.findMany({
      where: { patientId: params.patientId, psychologistId: user.id },
      orderBy: { createdAt: "desc" },
      include: { notes: true, transcription: true },
    });
    const out = await Promise.all(
      entries.map(async (e) => ({
        id: e.id,
        title: e.title,
        mediaType: e.mediaType,
        createdAt: e.createdAt,
        mediaUrl: await presignDownload(e.mediaKey),
        notes: e.notes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
        })),
        transcription: e.transcription
          ? { status: e.transcription.status, text: e.transcription.text }
          : null,
      })),
    );
    return NextResponse.json({ entries: out });
  } catch (err) {
    return handle(err);
  }
}
