import { NextResponse } from "next/server";
import { HttpError } from "./auth";

export function handle(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
}
