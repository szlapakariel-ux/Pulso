import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("pulso_session")?.value);

  const isProtected =
    pathname.startsWith("/patient") || pathname.startsWith("/psychologist");

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/psychologist/:path*"],
};
