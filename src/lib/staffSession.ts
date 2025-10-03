// src/lib/staffSession.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { redis } from "./redis";
import type { Role } from "./rbac";

const COOKIE = process.env.STAFF_COOKIE_NAME || "__Host_staff";
const TTL_DAYS = Number(process.env.STAFF_SESSION_TTL_DAYS ?? "7");
const secret = process.env.STAFF_JWT_SECRET!;

export type StaffClaims = { uid: string; role: Role };

/**
 * Issue a signed staff session (JWT), persist for revocation in Redis,
 * and set a secure HTTP-only cookie.
 *
 * Usage in API route (recommended):
 *   const res = NextResponse.json({ ok: true });
 *   await issueStaffSession(uid, role, res);
 *   return res;
 *
 * Usage outside (fallback):
 *   await issueStaffSession(uid, role);
 */
export async function issueStaffSession(
  uid: string,
  role: Role,
  res?: NextResponse
) {
  const token = jwt.sign({ uid, role } as StaffClaims, secret, {
    expiresIn: `${TTL_DAYS}d`,
  });

  // store token for revocation
  await redis().set(`staff:sess:${uid}`, token, {
    EX: TTL_DAYS * 24 * 3600,
  });

  if (res) {
    // Set cookie on the provided response (preferred in route handlers)
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: TTL_DAYS * 24 * 3600,
    });
  } else {
    // Fallback: mutate the request cookie jar
    const jar = await cookies(); // NOTE: await because your types indicate Promise<...>
    jar.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: TTL_DAYS * 24 * 3600,
    });
  }
}

/**
 * Clear the staff session cookie and optionally revoke in Redis.
 *
 * Usage in API route:
 *   const res = NextResponse.redirect("/staff/login");
 *   await clearStaffSession(uid, res);
 *   return res;
 */
export async function clearStaffSession(uid?: string, res?: NextResponse) {
  if (res) {
    res.cookies.set(COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  } else {
    const jar = await cookies(); // NOTE: await
    jar.set(COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }

  if (uid) {
    await redis().del(`staff:sess:${uid}`);
  }
}

/** Read current staff identity (JWT + Redis revocation check). */
export async function getStaffIdentity(): Promise<StaffClaims | null> {
  const jar = await cookies(); // NOTE: await
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret) as StaffClaims;
    const redisToken = await redis().get(`staff:sess:${decoded.uid}`);
    if (redisToken !== token) return null; // revoked / rotated
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Guard helper for admin APIs/pages.
 * Usage in API route:
 *   const staff = await requireStaff(["ADMIN", "MODERATOR"]);
 *   if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function requireStaff(
  allowed: Role[] = ["ADMIN", "MODERATOR"]
): Promise<StaffClaims | null> {
  const staff = await getStaffIdentity();
  if (!staff) return null;
  return allowed.includes(staff.role) ? staff : null;
}
