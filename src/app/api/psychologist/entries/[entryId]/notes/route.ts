import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole } from "@/lib/auth";
import { handle } from "@/lib/http";

const Body = z.object({ content: z.string().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: { entryId: string } }) {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const entry = await prisma.timelineEntry.findUnique({ where: { id: params.entryId } });
    if (!entry || entry.psychologistId !== user.id) {
      throw new HttpError(403, "Registro no accesible");
    }
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "Datos inválidos");

    const note = await prisma.privateNote.create({
      data: {
        entryId: entry.id,
        psychologistId: user.id,
        content: parsed.data.content.trim(),
      },
    });
    return NextResponse.json({
      note: { id: note.id, content: note.content, createdAt: note.createdAt },
    });
  } catch (err) {
    return handle(err);
  }
}
