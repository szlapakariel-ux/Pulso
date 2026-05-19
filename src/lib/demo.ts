// Email visible único para todos los perfiles demo.
// Internamente cada usuario tiene un email distinto (constraint @unique),
// pero la UI siempre muestra este valor.
export const DEMO_DISPLAY_EMAIL = "diego.vivero@trenesargentinos.gob.ar";

export type DemoProfile = "psychologist" | "patient1" | "patient2";

export const DEMO_PROFILES: Record<
  DemoProfile,
  { name: string; internalEmail: string; role: "PSYCHOLOGIST" | "PATIENT"; label: string }
> = {
  psychologist: {
    name: "Diego Vivero",
    internalEmail: "demo-psicologo@pulso.local",
    role: "PSYCHOLOGIST",
    label: "Entrar como psicólogo",
  },
  patient1: {
    name: "Paciente Demo 1",
    internalEmail: "demo-paciente1@pulso.local",
    role: "PATIENT",
    label: "Entrar como paciente demo 1",
  },
  patient2: {
    name: "Paciente Demo 2",
    internalEmail: "demo-paciente2@pulso.local",
    role: "PATIENT",
    label: "Entrar como paciente demo 2",
  },
};
