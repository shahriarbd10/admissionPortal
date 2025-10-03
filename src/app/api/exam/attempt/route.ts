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

export async function GET(req: Request) {
  try {
    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const attemptId = url.searchParams.get("a") || undefined;

    await dbConnect();

    const q: any = { firebaseUid: decoded.uid, status: "active" };
    if (attemptId) q._id = attemptId;

    const att = await ExamAttempt.findOne(q).exec();
    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (att.endAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Time over" }, { status: 400 });
    }

    const paper = att.paper.map((p) => ({
      i: p.i, id: p.id, type: p.type as "MCQ" | "TF" | "FIB", q: p.q, options: p.options, hint: p.hint
    }));
    const saved: Record<number, number | string | null> = {};
    if (att.responses instanceof Map) {
      for (const [k, v] of att.responses.entries()) saved[Number(k)] = v as any;
    } else if (att.responses && typeof att.responses === "object") {
      Object.entries(att.responses as any).forEach(([k, v]) => (saved[Number(k)] = v as any));
    }

    return NextResponse.json({
      ok: true,
      attemptId: String(att._id),
      endAt: att.endAt,
      paper,
      saved,
    });
  } catch (e: any) {
    console.error("[/api/exam/attempt] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
