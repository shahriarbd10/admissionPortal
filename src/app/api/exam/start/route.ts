// src/app/api/exam/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/User";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { QuestionPaper } from "@/lib/models/QuestionPaper";
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

// Minimal lean shape of QuestionPaper we read here
type QuestionPaperLean = {
  _id: unknown;
  status: "DRAFT" | "PUBLISHED";
  departments: { slug: string }[];
  items: Array<{
    id: string;
    type: QuestionType;
    q: string;
    options?: string[];
    correctIndex?: number;
    correctText?: string;
    hint?: string | null;
    sl?: number;
  }>;
  publishedAt?: Date;
  createdAt?: Date;
};

// ---------------- helpers ----------------
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPaperFromQuestions(src: Question[], targetCount = 50): PaperItemDb[] {
  // Convert to DB items and then fill/trim to targetCount
  const base: PaperItemDb[] = src.map((q, i) => ({
    i, // temporary; will reindex after trim/fill
    id: q.id,
    type: q.type,
    q: q.q,
    options: q.type !== "FIB" ? q.options : undefined,
    correctIndex: q.type !== "FIB" ? q.correctIndex : undefined,
    correctText: q.type === "FIB" ? q.correctText : undefined,
    hint: ("hint" in q ? (q as { hint?: string | null }).hint ?? null : null),
  }));

  if (base.length === 0) return [];

  let out: PaperItemDb[] = [];

  if (base.length >= targetCount) {
    out = shuffle(base).slice(0, targetCount);
  } else {
    const pool = [...base];
    while (out.length < targetCount) {
      const next = pool[Math.floor(Math.random() * pool.length)];
      out.push({ ...next });
    }
  }

  // reindex 0..targetCount-1
  out = out.map((p, i) => ({ ...p, i }));
  return out;
}

// ---------------- route ----------------
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
      const clientPaper: ClientPaperItem[] = (existing.paper as any[]).map((p: any) => ({
        i: p.i,
        id: p.id,
        type: p.type,
        q: p.q,
        options: p.options,
        hint: p.hint ?? null,
      }));

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

    // --------------- Build a new paper ----------------
    // 1) Try latest PUBLISHED QuestionPaper covering this department
    let questions: Question[] = [];
    const paperDoc = await QuestionPaper.findOne({
      status: "PUBLISHED",
      "departments.slug": department,
    })
      .select({ items: 1, publishedAt: 1, createdAt: 1 })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean<QuestionPaperLean | null>()
      .exec();

    if (paperDoc?.items?.length) {
      const stored: Question[] = paperDoc.items.map((it) => {
        if (it.type === "FIB") {
          return {
            id: String(it.id),
            type: "FIB",
            q: String(it.q),
            correctText: String(it.correctText ?? ""),
            hint: it.hint ?? null,
          } as Question;
        }
        // MCQ / TF
        return {
          id: String(it.id),
          type: it.type,
          q: String(it.q),
          options: (it.options ?? []).map(String),
          correctIndex: Number(it.correctIndex ?? 0),
        } as Question;
      });
      questions = stored;
    }

    // 2) If none found, fall back to sample bank (as before)
    if (!questions.length) {
      questions = department === "cse" ? generateCSE() : generateSimple(department);
    }

    // Ensure exactly 50 questions (repeat or trim)
    const paper: PaperItemDb[] = buildPaperFromQuestions(questions, 50);

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
