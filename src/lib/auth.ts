import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "pulso_session";
const ALG = "HS256";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, name: (payload.name as string) ?? "" };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await readSession();
  if (!session) throw new HttpError(401, "No autenticado");
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) throw new HttpError(401, "Sesión inválida");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) throw new HttpError(403, "Acceso denegado");
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
