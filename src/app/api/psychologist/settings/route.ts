import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/http";

const Body = z.object({
  enabled: z.boolean(),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  channel: z.enum(["MANUAL", "WHATSAPP", "EMAIL"]),
  timezone: z.string().min(1).max(64),
});

export async function GET() {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const settings = await prisma.dailySummarySettings.findUnique({
      where: { psychologistId: user.id },
    });
    return NextResponse.json(
      settings ?? {
        enabled: false,
        sendTime: "08:00",
        channel: "MANUAL",
        timezone: "America/Argentina/Buenos_Aires",
      },
    );
  } catch (err) {
    return handle(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const saved = await prisma.dailySummarySettings.upsert({
      where: { psychologistId: user.id },
      create: { psychologistId: user.id, ...parsed.data },
      update: parsed.data,
    });
    return NextResponse.json(saved);
  } catch (err) {
    return handle(err);
  }
}
