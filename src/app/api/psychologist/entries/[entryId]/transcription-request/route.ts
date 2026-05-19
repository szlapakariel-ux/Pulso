import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole } from "@/lib/auth";
import { handle } from "@/lib/http";
import { requestTranscription } from "@/lib/transcription";

export async function POST(_req: Request, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const entry = await prisma.timelineEntry.findUnique({ where: { id: params.entryId } });
    if (!entry || entry.psychologistId !== user.id) {
      throw new HttpError(403, "Registro no accesible");
    }

    const result = await requestTranscription(entry.id);

    const trans = await prisma.transcription.upsert({
      where: { entryId: entry.id },
      update: { status: result.status, text: result.text ?? null, requestedById: user.id },
      create: {
        entryId: entry.id,
        requestedById: user.id,
        status: result.status,
        text: result.text ?? null,
      },
    });

    return NextResponse.json({ status: trans.status, text: trans.text });
  } catch (err) {
    return handle(err);
  }
}
