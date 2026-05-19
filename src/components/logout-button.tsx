"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button onClick={onClick} className="text-sm underline text-pulso-soft hover:text-pulso-ink">
      Salir
    </button>
  );
}
