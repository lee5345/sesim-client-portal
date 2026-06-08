import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PREFIXES = [
  "/login",
  "/signup-request",
  "/setup-password",
  "/unauthorized",
  "/post-login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/change-password")) {
    return NextResponse.next();
  }

  const isPublic =
    pathname.startsWith("/api/auth") ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) {
    return NextResponse.next();
  }

  const session = await getToken({ req, secret: process.env.AUTH_SECRET });

  if ((pathname.startsWith("/client/") || pathname === "/client") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if ((pathname.startsWith("/firm/") || pathname === "/firm") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  if (pathname.startsWith("/firm/") || pathname === "/firm") {
    const role = session?.role;
    if (role !== "FIRM_STAFF" && role !== "FIRM_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

