import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { generateCSE, generateSimple, type Question } from "@/data/sampleQuestions";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";

type QuestionType = "MCQ" | "TF" | "FIB";

type PaperItemDb = {
  i: number;
  id: string;
  type: QuestionType;
  q: string;
  options?: string[];
  correctIndex?: number;
  correctText?: string;
  hint?: string | null;
};

type ClientPaperItem = {
  i: number;
  id: string;
  type: QuestionType;
  q: string;
  options?: string[];
  hint?: string | null;
};

type UserLean = { firebaseUid: string; selectedDepartmentSlug?: string | null };

function getCookie(req: NextRequest, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(
    new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}=([^;]+)`)
  );
  return m?.[1];
}

async function getDecodedFromCookie(req: NextRequest) {
  const token = getCookie(req, SESSION_COOKIE_NAME);
  if (!token) return null;
  try {
    return await adminAuth().verifySessionCookie(token, true);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
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

    // Reuse active attempt if exists (until endAt)
    const now = Date.now();
    const existing = await ExamAttempt.findOne({
      firebaseUid: decoded.uid,
      department,
      status: "active",
    }).exec();

    if (existing && existing.endAt.getTime() > now) {
      // Send sanitized paper (without correct answers)
      const clientPaper: ClientPaperItem[] = (existing.paper as PaperItemDb[]).map(
        (p: PaperItemDb) => ({
          i: p.i,
          id: p.id,
          type: p.type,
          q: p.q,
          options: p.options,
          hint: p.hint ?? null,
        })
      );

      const saved: Record<number, number | string | null> = {};
      const responsesUnknown: unknown = (existing as any).responses;

      if (responsesUnknown instanceof Map) {
        for (const [k, v] of responsesUnknown.entries()) {
          saved[Number(k)] = v as number | string | null;
        }
      } else if (responsesUnknown && typeof responsesUnknown === "object") {
        Object.entries(responsesUnknown as Record<string, unknown>).forEach(([k, v]) => {
          saved[Number(k)] = v as number | string | null;
        });
      }

      return NextResponse.json({
        ok: true,
        attemptId: String(existing._id),
        endAt: existing.endAt,
        paper: clientPaper,
        saved,
      });
    }

    // Else create a new attempt
    const questions: Question[] =
      department === "cse" ? generateCSE() : generateSimple(department);

    const paper: PaperItemDb[] = questions.map((q, i) => ({
      i,
      id: q.id,
      type: q.type,
      q: q.q,
      options: q.type !== "FIB" ? q.options : undefined,
      correctIndex: q.type !== "FIB" ? q.correctIndex : undefined,
      correctText: q.type === "FIB" ? q.correctText : undefined,
      // Safely read optional `hint` if it exists on this union member
      hint: ("hint" in q ? (q as { hint?: string | null }).hint ?? null : null),
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

    // Sanitize for client (no correct answers)
    const clientPaper: ClientPaperItem[] = paper.map((p: PaperItemDb) => ({
      i: p.i,
      id: p.id,
      type: p.type,
      q: p.q,
      options: p.options,
      hint: p.hint ?? null,
    }));

    return NextResponse.json({
      ok: true,
      attemptId: String(doc._id),
      endAt,
      paper: clientPaper,
      saved: {},
    });
  } catch (e) {
    const err = e as Error;
    // eslint-disable-next-line no-console
    console.error("[/api/exam/start] error:", err?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
