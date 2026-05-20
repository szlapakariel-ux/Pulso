import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { presignDownload } from "@/lib/s3";
import { groupByDay, formatTime } from "@/lib/dates";
import { displayEmailFor } from "@/lib/demo";
import EntryControls from "./entry-controls";

export const dynamic = "force-dynamic";

export default async function PatientTimelinePage({
  params,
}: {
  params: { patientId: string };
}) {
  const user = await requireRole("PSYCHOLOGIST");
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: params.patientId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile || profile.psychologistId !== user.id) notFound();

  const entries = await prisma.timelineEntry.findMany({
    where: { patientId: params.patientId, psychologistId: user.id },
    orderBy: { createdAt: "desc" },
    include: { notes: true, transcription: true },
  });

  const withUrls = await Promise.all(
    entries.map(async (e) => ({ ...e, mediaUrl: await presignDownload(e.mediaKey) })),
  );
  const groups = groupByDay(withUrls);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/psychologist/patients" className="text-sm text-pulso-soft underline">
          ← Pacientes
        </Link>
        <h2 className="text-2xl font-semibold mt-2">{profile.user.name}</h2>
        <p className="text-pulso-soft text-sm">{displayEmailFor(profile.user.email)}</p>
      </div>

      {groups.length === 0 && (
        <div className="card text-pulso-soft">Este paciente aún no tiene registros.</div>
      )}

      {groups.map((g) => (
        <section key={g.dayKey} className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-pulso-soft">{g.label}</h3>
          <div className="space-y-4">
            {g.items.map((e) => (
              <article key={e.id} className="card space-y-3">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium">{e.title}</h4>
                    <p className="text-sm text-pulso-soft mt-0.5">
                      {e.mediaType === "AUDIO" ? "Audio" : "Video"} · {formatTime(e.createdAt)}
                    </p>
                  </div>
                </header>
                {!e.mediaUrl ? (
                  <p className="text-sm text-pulso-soft italic">
                    Almacenamiento no configurado todavía.
                  </p>
                ) : e.mediaType === "AUDIO" ? (
                  <audio controls preload="none" src={e.mediaUrl} className="w-full" />
                ) : (
                  <video controls preload="none" src={e.mediaUrl} className="w-full rounded-lg" />
                )}
                <EntryControls
                  entryId={e.id}
                  initialNotes={e.notes.map((n) => ({
                    id: n.id,
                    content: n.content,
                    createdAt: n.createdAt.toISOString(),
                  }))}
                  initialTranscription={
                    e.transcription
                      ? { status: e.transcription.status, text: e.transcription.text }
                      : null
                  }
                />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
