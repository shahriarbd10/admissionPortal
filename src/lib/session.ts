import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebaseAdmin";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";
const maxDays = Number(process.env.SESSION_COOKIE_MAX_DAYS || 5);
export const SESSION_EXPIRES_MS = maxDays * 24 * 60 * 60 * 1000;

export async function getCurrentUser() {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    return await adminAuth().verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

export async function requireUser(nextPath = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
