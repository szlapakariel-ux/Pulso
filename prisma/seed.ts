import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PROFILES } from "../src/lib/demo";

const prisma = new PrismaClient();

async function main() {
  // Password de respaldo para que el login por email también funcione si se usa.
  // El flujo demo (selector de perfil) no usa password.
  const passwordHash = await bcrypt.hash("demo", 10);

  const psyDef = DEMO_PROFILES.psychologist;
  const p1Def = DEMO_PROFILES.patient1;
  const p2Def = DEMO_PROFILES.patient2;

  const psicologo = await prisma.user.upsert({
    where: { email: psyDef.internalEmail },
    update: { name: psyDef.name, role: psyDef.role },
    create: {
      name: psyDef.name,
      email: psyDef.internalEmail,
      passwordHash,
      role: psyDef.role,
    },
  });

  const paciente1 = await prisma.user.upsert({
    where: { email: p1Def.internalEmail },
    update: { name: p1Def.name, role: p1Def.role },
    create: {
      name: p1Def.name,
      email: p1Def.internalEmail,
      passwordHash,
      role: p1Def.role,
    },
  });

  const paciente2 = await prisma.user.upsert({
    where: { email: p2Def.internalEmail },
    update: { name: p2Def.name, role: p2Def.role },
    create: {
      name: p2Def.name,
      email: p2Def.internalEmail,
      passwordHash,
      role: p2Def.role,
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: paciente1.id },
    update: { psychologistId: psicologo.id },
    create: { userId: paciente1.id, psychologistId: psicologo.id },
  });
  await prisma.patientProfile.upsert({
    where: { userId: paciente2.id },
    update: { psychologistId: psicologo.id },
    create: { userId: paciente2.id, psychologistId: psicologo.id },
  });

  const existing = await prisma.timelineEntry.count();
  if (existing === 0) {
    const seedEntries = [
      {
        patientId: paciente1.id,
        title: "Ansiedad antes de la reunión",
        mediaType: "AUDIO" as const,
        mediaKey: `seed/${paciente1.id}/ansiedad.webm`,
      },
      {
        patientId: paciente1.id,
        title: "Logré dormir 7 horas",
        mediaType: "AUDIO" as const,
        mediaKey: `seed/${paciente1.id}/dormir.webm`,
      },
      {
        patientId: paciente2.id,
        title: "Discusión con mi hermana",
        mediaType: "VIDEO" as const,
        mediaKey: `seed/${paciente2.id}/discusion.webm`,
      },
      {
        patientId: paciente2.id,
        title: "Caminata en el parque",
        mediaType: "AUDIO" as const,
        mediaKey: `seed/${paciente2.id}/caminata.webm`,
      },
    ];
    for (const e of seedEntries) {
      const entry = await prisma.timelineEntry.create({
        data: { ...e, psychologistId: psicologo.id },
      });
      await prisma.privateNote.create({
        data: {
          entryId: entry.id,
          psychologistId: psicologo.id,
          content: "Nota privada de ejemplo — solo visible para el psicólogo.",
        },
      });
    }
  }

  console.log("Seed listo. Perfiles demo (login por selector):");
  console.log("  - Psicóloga Demo (PSYCHOLOGIST)");
  console.log("  - Paciente Demo 1 (PATIENT)");
  console.log("  - Paciente Demo 2 (PATIENT)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
