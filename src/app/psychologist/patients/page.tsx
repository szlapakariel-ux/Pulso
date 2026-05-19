import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DEMO_DISPLAY_EMAIL } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function PatientsListPage() {
  const user = await requireRole("PSYCHOLOGIST");
  const patients = await prisma.patientProfile.findMany({
    where: { psychologistId: user.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Conteo de entradas por paciente
  const counts = await prisma.timelineEntry.groupBy({
    by: ["patientId"],
    where: { psychologistId: user.id },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.patientId, c._count._all]));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tus pacientes</h2>
      {patients.length === 0 && (
        <div className="card text-pulso-soft">No tenés pacientes asignados todavía.</div>
      )}
      <div className="grid gap-3">
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/psychologist/patients/${p.user.id}/timeline`}
            className="card hover:border-pulso-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{p.user.name}</h3>
                <p className="text-sm text-pulso-soft">{DEMO_DISPLAY_EMAIL}</p>
              </div>
              <span className="text-sm text-pulso-soft">
                {countMap.get(p.user.id) ?? 0} registros
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
