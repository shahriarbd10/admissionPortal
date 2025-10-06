// src/lib/staffSession.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/db";
import { Staff } from "@/lib/models/Staff";

export type StaffRole = "ADMIN" | "MODERATOR";

export type StaffSession = {
  id: string;
  role: StaffRole;
  username?: string | null;
  email?: string | null;
};

const STAFF_COOKIE = process.env.STAFF_SESSION_COOKIE_NAME || "__Host_staff";
const STAFF_JWT_SECRET = process.env.STAFF_JWT_SECRET || "dev-staff-secret";
const STAFF_TTL_DAYS = Number(process.env.STAFF_SESSION_TTL_DAYS ?? 7);

/** Create a JWT string for a staff user */
export function signStaffJWT(payload: { sid: string; role: StaffRole }) {
  const expSec = STAFF_TTL_DAYS * 24 * 60 * 60;
  return jwt.sign(payload, STAFF_JWT_SECRET, { expiresIn: expSec });
}

/** Set staff JWT cookie (used by the login route) */
export async function setStaffCookie(token: string) {
  const jar = await cookies(); // Next 15 API is async
  jar.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: STAFF_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Return a staff session if logged in and (optionally) in allowed roles */
export async function requireStaff(allowed?: StaffRole[]) {
  try {
    const jar = await cookies(); // Next 15 API is async
    const token = jar.get(STAFF_COOKIE)?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, STAFF_JWT_SECRET) as {
      sid?: string;
      role?: StaffRole;
    };
    if (!decoded?.sid || !decoded?.role) return null;

    await dbConnect();
    const staff = await Staff.findById(decoded.sid)
      .select({ _id: 1, role: 1, username: 1, email: 1 })
      .lean<{ _id: unknown; role: StaffRole; username?: string; email?: string }>()
      .exec();
    if (!staff) return null;

    if (allowed?.length && !allowed.includes(staff.role)) return null;

    return {
      id: String(staff._id),
      role: staff.role,
      username: staff.username ?? null,
      email: staff.email ?? null,
    } as StaffSession;
  } catch {
    return null;
  }
}
