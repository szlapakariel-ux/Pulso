import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo";

const Body = z.object({
  profile: z.enum(["psychologist", "patient1", "patient2"]),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Perfil demo inválido" }, { status: 400 });
  }
  const profile: DemoProfile = parsed.data.profile;
  const def = DEMO_PROFILES[profile];

  const user = await prisma.user.findUnique({ where: { email: def.internalEmail } });
  if (!user || user.role !== def.role) {
    return NextResponse.json(
      { error: "Perfil demo no inicializado. Corré el seed." },
      { status: 500 },
    );
  }

  // La sesión se firma con user.id real. Los permisos se siguen evaluando
  // contra DB por id y rol — el email visible es solo cosmético.
  await createSession({ sub: user.id, role: user.role, name: user.name });
  return NextResponse.json({ ok: true, role: user.role });
}
