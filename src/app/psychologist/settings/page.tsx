import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function PsychologistSettingsPage() {
  const user = await requireRole("PSYCHOLOGIST");
  const settings = await prisma.dailySummarySettings.findUnique({
    where: { psychologistId: user.id },
  });
  const initial = settings ?? {
    enabled: false,
    sendTime: "08:00",
    channel: "MANUAL" as const,
    timezone: "America/Argentina/Buenos_Aires",
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Configuración</h2>
        <p className="text-pulso-soft text-sm">
          Resumen diario de registros (por ahora solo se guarda; no se envía).
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
