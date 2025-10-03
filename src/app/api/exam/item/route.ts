import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { generateCSE, generateSimple, type Question } from "@/data/sampleQuestions";

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

type AttemptLean = {
  _id: unknown;
  firebaseUid: string;
  department: string;
  endAt: Date;
  responses?: Map<string, any> | Record<string, any>;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idx = Number(url.searchParams.get("i") || "0");
    const attemptId = url.searchParams.get("a") || "";

    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const att = await ExamAttempt.findOne({ _id: attemptId, firebaseUid: decoded.uid })
      .lean<AttemptLean | null>().exec();

    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const remainingMs = Math.max(0, new Date(att.endAt).getTime() - Date.now());

    const questions: Question[] = att.department === "cse"
      ? generateCSE()
      : generateSimple(att.department);

    const q = questions[idx];
    if (!q) return NextResponse.json({ error: "Out of range" }, { status: 400 });

    // read saved
    let saved: any = null;
    if (att.responses instanceof Map) {
      saved = att.responses.get(String(idx)) ?? null;
    } else if (att.responses && typeof att.responses === "object") {
      saved = (att.responses as Record<string, any>)[String(idx)] ?? null;
    }

    // shape per type
    if (q.type === "MCQ" || q.type === "TF") {
      return NextResponse.json({
        ok: true,
        item: { i: idx, id: q.id, type: q.type, q: q.q, options: q.options },
        saved: typeof saved === "number" ? saved : null,
        remainingMs,
        total: questions.length,
      });
    } else {
      return NextResponse.json({
        ok: true,
        item: { i: idx, id: q.id, type: q.type, q: q.q, hint: q.hint || null },
        saved: typeof saved === "string" ? saved : "",
        remainingMs,
        total: questions.length,
      });
    }
  } catch (e: any) {
    console.error("[/api/exam/item] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
