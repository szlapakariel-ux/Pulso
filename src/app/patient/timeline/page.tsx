import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { presignDownload } from "@/lib/s3";
import { groupByDay, formatDateTime } from "@/lib/dates";
import VideoCard from "@/components/video-card";

export const dynamic = "force-dynamic";

export default async function PatientTimelinePage() {
  const user = await requireRole("PATIENT");
  const entries = await prisma.timelineEntry.findMany({
    where: { patientId: user.id },
    orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
  });
  const withUrls = await Promise.all(
    entries.map(async (e) => ({
      ...e,
      when: e.recordedAt ?? e.createdAt,
      mediaUrl: await presignDownload(e.mediaKey),
    })),
  );
  const groups = groupByDay(withUrls.map((e) => ({ ...e, createdAt: e.when })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tu semana</h2>
          <p className="text-pulso-soft text-sm">Cada registro queda en tu línea de tiempo.</p>
        </div>
        <Link href="/patient/new-entry" className="btn-primary">+ Nuevo registro</Link>
      </div>

      {groups.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-pulso-soft">Todavía no tenés registros.</p>
          <Link href="/patient/new-entry" className="btn-primary mt-4 inline-flex">
            Crear el primero
          </Link>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.dayKey} className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-pulso-soft">{g.label}</h3>
          <div className="space-y-3">
            {g.items.map((e) => (
              <article key={e.id} className="card space-y-3">
                <div>
                  <p className="text-sm text-pulso-soft">
                    {e.mediaType === "AUDIO" ? "Audio" : "Video"} ·{" "}
                    {formatDateTime(e.when)}
                  </p>
                  {e.contextLabel && (
                    <p className="text-sm mt-0.5">
                      Contexto:{" "}
                      <span className="font-medium">{e.contextLabel}</span>
                    </p>
                  )}
                  {e.contextNote && (
                    <p className="text-sm text-pulso-soft italic mt-0.5">
                      “{e.contextNote}”
                    </p>
                  )}
                </div>
                <div>
                  {!e.mediaUrl ? (
                    <p className="text-sm text-pulso-soft italic">
                      Almacenamiento no configurado todavía.
                    </p>
                  ) : e.mediaType === "AUDIO" ? (
                    <audio controls preload="none" src={e.mediaUrl} className="w-full" />
                  ) : (
                    <VideoCard src={e.mediaUrl} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
