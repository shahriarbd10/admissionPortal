import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host_session";

// Types used in responses (sanitize paper to client)
type QuestionType = "MCQ" | "TF" | "FIB";

type PaperItemDb = {
  i: number;
  id: string;
  type: QuestionType | string; // DB might have string; we narrow when building client shape
  q: string;
  options?: string[];
  hint?: string | null;
  // DB may have more fields (correct answers etc.) that we ignore here
};

type ClientPaperItem = {
  i: number;
  id: string;
  type: QuestionType;
  q: string;
  options?: string[];
  hint?: string | null;
};

type SavedMap = Record<number, number | string | null>;

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

export async function GET(req: NextRequest) {
  try {
    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const attemptId = url.searchParams.get("a") || undefined;

    await dbConnect();

    // Narrow as needed for query; keep minimal typing here
    const q: { firebaseUid: string; status: "active"; _id?: string } = {
      firebaseUid: decoded.uid,
      status: "active",
    };
    if (attemptId) q._id = attemptId;

    const att = await ExamAttempt.findOne(q).exec();
    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (att.endAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Time over" }, { status: 400 });
    }

    // Sanitize paper for client (no correct answers)
    const paper: ClientPaperItem[] = (att.paper as PaperItemDb[]).map((p: PaperItemDb) => ({
      i: p.i,
      id: p.id,
      type: (p.type === "MCQ" || p.type === "TF" || p.type === "FIB" ? p.type : "MCQ") as QuestionType,
      q: p.q,
      options: p.options,
      hint: p.hint ?? null,
    }));

    // Normalize saved responses from Map or plain object
    const saved: SavedMap = {};
    const responsesUnknown: unknown = (att as any).responses;

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
      attemptId: String(att._id),
      endAt: att.endAt,
      paper,
      saved,
    });
  } catch (e) {
    const err = e as Error;
    // eslint-disable-next-line no-console
    console.error("[/api/exam/attempt] error:", err?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
