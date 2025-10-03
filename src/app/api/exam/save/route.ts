import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}=([^;]+)`));
  return m?.[1];
}
async function getDecodedFromCookie(req: Request) {
  const token = getCookie(req, SESSION_COOKIE_NAME);
  if (!token) return null;
  try { return await adminAuth().verifySessionCookie(token, true); } catch { return null; }
}

export async function PUT(req: Request) {
  try {
    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const attemptId = body?.attemptId as string;
    const answers = body?.answers as Record<string, number | string | null>;
    if (!attemptId || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    await dbConnect();

    const doc = await ExamAttempt.findOne({ _id: attemptId, firebaseUid: decoded.uid, status: "active" }).exec();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Date.now() > doc.endAt.getTime()) {
      return NextResponse.json({ error: "Time over" }, { status: 400 });
    }

    // build $set paths responses.0 responses.1 ...
    const setOps: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      const idx = String(k);
      setOps[`responses.${idx}`] = v;
    }

    await ExamAttempt.updateOne({ _id: attemptId }, { $set: setOps }).exec();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/exam/save] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
