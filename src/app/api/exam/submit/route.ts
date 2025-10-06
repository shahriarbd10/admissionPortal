import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { dbConnect } from "@/lib/db";
import { ExamAttempt } from "@/lib/models/ExamAttempt";
import { User } from "@/lib/models/User";

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

type UserLean = {
  name?: string;
  admissionFormId?: string;
  phone?: string;
  sscGPA?: number;
  hscGPA?: number;
};

export async function POST(req: Request) {
  try {
    const decoded = await getDecodedFromCookie(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const attemptId = body?.attemptId as string;
    if (!attemptId) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

    await dbConnect();

    const doc = await ExamAttempt.findOne({
      _id: attemptId,
      firebaseUid: decoded.uid,
    }).exec();

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (doc.status !== "active") {
      return NextResponse.json({ ok: true, already: true });
    }

    const results: {
      i: number; id: string; type: "MCQ" | "TF" | "FIB";
      answer: number | string | null;
      correctAnswer: number | string;
      correct: boolean;
    }[] = [];

    let correctCount = 0;
    for (const p of doc.paper) {
      const saved =
        doc.responses instanceof Map
          ? (doc.responses.get(String(p.i)) as any)
          : (doc.responses as any)?.[String(p.i)];

      if (p.type === "MCQ" || p.type === "TF") {
        const ans = typeof saved === "number" ? saved : null;
        const correct = typeof p.correctIndex === "number" && ans === p.correctIndex;
        if (correct) correctCount++;
        results.push({
          i: p.i, id: p.id, type: p.type as any,
          answer: ans, correctAnswer: p.correctIndex ?? -1, correct,
        });
      } else {
        const ans = typeof saved === "string" ? saved : "";
        const correct =
          typeof p.correctText === "string" &&
          ans.trim().toLowerCase() === p.correctText.trim().toLowerCase();
        if (correct) correctCount++;
        results.push({
          i: p.i, id: p.id, type: "FIB",
          answer: ans, correctAnswer: p.correctText || "", correct,
        });
      }
    }

    const user = await User.findOne({ firebaseUid: decoded.uid })
      .lean<UserLean | null>()
      .exec();

    const ssc = typeof user?.sscGPA === "number" ? user!.sscGPA : 0;
    const hsc = typeof user?.hscGPA === "number" ? user!.hscGPA : 0;
    const gpaWeighted = Math.max(0, Math.min(50, ssc * 4 + hsc * 6));

    doc.status = "submitted";
    doc.submittedAt = new Date();
    doc.results = results;

    const per = typeof doc.pointsPerCorrect === "number" ? doc.pointsPerCorrect : 1;
    doc.examScore = correctCount * per;
    doc.gpaWeighted = gpaWeighted;

    doc.applicantName = user?.name || "";
    doc.applicantAfid = user?.admissionFormId || "";
    doc.applicantPhone = user?.phone || "";

    await doc.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/exam/submit] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
