import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./server/jwt";
import { cookies } from "next/headers";

const AUTH_ROUTES = ["/login", "/signup", "/reset-password"];
function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

// Routes that authenticated users are allowed to stay on instead of being
// bounced to "/". The invite page doubles as an "accept invite" screen for
// already-logged-in users so they can join additional teams.
const AUTHENTICATED_ALLOWED_AUTH_ROUTES = ["/signup/join"];
function isAuthenticatedAllowed(pathname: string) {
  return AUTHENTICATED_ALLOWED_AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/.well-known")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("jwt");
  const payload = token
    ? await verifyJWT(token.value).catch(async () => {
        (await cookies()).delete("jwt");
        return null;
      })
    : null;

  const isAuth = isAuthRoute(request.nextUrl.pathname);

  if (!isAuth) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isAuth && payload && !isAuthenticatedAllowed(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (e.g. /images, /fonts)
     * - .well-known folder files (e.g. /jwks.json)
     */
    "/((?!_next/static|_next/image|favicon.ico|\\.well-known/.*).*)",
  ],
};
