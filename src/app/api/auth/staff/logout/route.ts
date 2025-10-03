import { NextResponse } from "next/server";
import { clearStaffSession, getStaffIdentity } from "@/lib/staffSession";

export async function POST() {
  const who = await getStaffIdentity();
  await clearStaffSession(who?.uid);
  return NextResponse.json({ ok: true });
}
