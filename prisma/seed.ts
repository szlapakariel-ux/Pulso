import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const psicologo = await prisma.user.upsert({
    where: { email: "psicologo@pulso.app" },
    update: {},
    create: {
      name: "Dra. Ana Reyes",
      email: "psicologo@pulso.app",
      passwordHash,
      role: "PSYCHOLOGIST",
    },
  });

  const paciente1 = await prisma.user.upsert({
    where: { email: "paciente@pulso.app" },
    update: {},
    create: {
      name: "Juan Pérez",
      email: "paciente@pulso.app",
      passwordHash,
      role: "PATIENT",
    },
  });

  const paciente2 = await prisma.user.upsert({
    where: { email: "paciente2@pulso.app" },
    update: {},
    create: {
      name: "María Gómez",
      email: "paciente2@pulso.app",
      passwordHash,
      role: "PATIENT",
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

  // Registros ficticios (mediaKey ficticias; los archivos reales se suben desde la app)
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
          content: "Nota privada de ejemplo — solo visible para la psicóloga.",
        },
      });
    }
  }

  console.log("Seed listo:");
  console.log("  Psicóloga: psicologo@pulso.app / 123456");
  console.log("  Paciente:  paciente@pulso.app  / 123456");
  console.log("  Paciente:  paciente2@pulso.app / 123456");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
