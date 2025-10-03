// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

// --- Config ---
const STUDENT_SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "__Host_session";
const STAFF_SESSION_COOKIE   = "__Host_staff"; // fixed name from staffSession.ts

// applicant protected routes
const STUDENT_PROTECTED = ["/profile", "/departments", "/dashboard"];

// staff protected routes
const STAFF_PROTECTED_MATCHERS = [
  "/staff/admin",
  "/staff/moderator",
  "/api/admin"
];

/**
 * Middleware: runs on every matched request.
 * - If student area: require Firebase session cookie
 * - If staff area: require staff session cookie
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ---- student area guard ----
  const needsStudent = STUDENT_PROTECTED.some((p) => pathname.startsWith(p));
  if (needsStudent) {
    const hasCookie = req.cookies.get(STUDENT_SESSION_COOKIE)?.value;
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- staff area guard ----
  const needsStaff = STAFF_PROTECTED_MATCHERS.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (needsStaff) {
    const hasCookie = req.cookies.get(STAFF_SESSION_COOKIE)?.value;
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/staff-login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // default: pass through
  return NextResponse.next();
}

// Matcher config ensures middleware only runs for relevant paths
export const config = {
  matcher: [
    "/profile/:path*",
    "/departments/:path*",
    "/dashboard/:path*",
    "/staff/admin/:path*",
    "/staff/moderator/:path*",
    "/api/admin/:path*",
  ],
};
