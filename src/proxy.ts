import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/review-studio" && process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }
  if (["/login", "/demo", "/review-studio", "/api/demo-analysis"].includes(pathname)) return NextResponse.next();

  const authenticated = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
  );
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
