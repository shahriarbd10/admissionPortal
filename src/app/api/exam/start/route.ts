import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User";
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

type UserLean = { firebaseUid: string; selectedDepartmentSlug?: string | null };

export async function POST(req: Request) {
  try {
    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findOne({ firebaseUid: decoded.uid })
      .select({ firebaseUid: 1, selectedDepartmentSlug: 1 })
      .lean<UserLean | null>()
      .exec();

    const department = (user?.selectedDepartmentSlug || "").toLowerCase();
    if (!department) {
      return NextResponse.json({ error: "Please select a department first." }, { status: 400 });
    }

    // reuse active attempt if exists (until endAt)
    const now = Date.now();
    const existing = await ExamAttempt.findOne({
      firebaseUid: decoded.uid,
      department,
      status: "active",
    }).exec();

    if (existing && existing.endAt.getTime() > now) {
      // Send sanitized paper (without correct answers)
      const paper = existing.paper.map((p) => ({
        i: p.i,
        id: p.id,
        type: p.type as "MCQ" | "TF" | "FIB",
        q: p.q,
        options: p.options,
        hint: p.hint,
      }));
      const saved: Record<number, number | string | null> = {};
      if (existing.responses instanceof Map) {
        for (const [k, v] of existing.responses.entries()) saved[Number(k)] = v as any;
      } else if (existing.responses && typeof existing.responses === "object") {
        Object.entries(existing.responses as any).forEach(([k, v]) => (saved[Number(k)] = v as any));
      }
      return NextResponse.json({
        ok: true,
        attemptId: String(existing._id),
        endAt: existing.endAt,
        paper,
        saved,
      });
    }

    // else create a new attempt
    const questions: Question[] = department === "cse" ? generateCSE() : generateSimple(department);
    const paper = questions.map((q, i) => ({
      i,
      id: q.id,
      type: q.type,
      q: q.q,
      options: q.type !== "FIB" ? q.options : undefined,
      correctIndex: q.type !== "FIB" ? q.correctIndex : undefined,
      correctText: q.type === "FIB" ? q.correctText : undefined,
      hint: (q as any).hint ?? undefined,
    }));

    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 60 min

    const doc = await ExamAttempt.create({
      firebaseUid: decoded.uid,
      department,
      startAt,
      endAt,
      status: "active",
      paper,
      responses: {},
    });

    // sanitized to client
    const clientPaper = paper.map((p) => ({
      i: p.i,
      id: p.id,
      type: p.type,
      q: p.q,
      options: p.options,
      hint: p.hint,
    }));

    return NextResponse.json({
      ok: true,
      attemptId: String(doc._id),
      endAt,
      paper: clientPaper,
      saved: {},
    });
  } catch (e: any) {
    console.error("[/api/exam/start] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
