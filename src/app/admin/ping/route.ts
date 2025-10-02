import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const auth = adminAuth();
    await auth.listUsers(1); // proves admin initialized
    return NextResponse.json({ ok: true, projectId: process.env.FIREBASE_PROJECT_ID });
  } catch (e: any) {
    console.error("[/api/admin/ping]", e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
