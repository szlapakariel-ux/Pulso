import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handle } from "@/lib/http";
import { displayEmailFor } from "@/lib/demo";

export async function GET() {
  try {
    const user = await requireRole("PSYCHOLOGIST");
    const patients = await prisma.patientProfile.findMany({
      where: { psychologistId: user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({
      patients: patients.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        email: displayEmailFor(p.user.email),
      })),
    });
  } catch (err) {
    return handle(err);
  }
}
