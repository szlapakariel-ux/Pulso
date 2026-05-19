import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await readSession();
  if (session) redirect("/");
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Pulso</h1>
          <p className="mt-2 text-pulso-soft">Acompañamiento entre sesiones</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
