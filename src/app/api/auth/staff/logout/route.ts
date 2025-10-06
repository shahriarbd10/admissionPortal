// src/app/api/auth/staff/logout/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { clearStaffSession, getStaffIdentity } from "@/lib/staffSession";

export async function POST() {
  // (Optional) return who was logged in for client-side UX
  const who = await getStaffIdentity();
  await clearStaffSession();
  return NextResponse.json({ ok: true, who });
}
