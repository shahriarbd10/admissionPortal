import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";
import { parseXlsx, padToFifty } from "@/lib/parsers/xlsxQuestions";

export const runtime = "nodejs";

function parseList(value: FormDataEntryValue | null) {
  if (!value) return [] as string[];
  const raw = value.toString().trim();
  if (!raw) return [];
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) return j.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  } catch {}
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    const title = (form.get("title") || "Untitled Set").toString().trim();

    // NEW: name & initial
    const metaName = (form.get("metaName") || "").toString().trim();
    const metaInitial = (form.get("metaInitial") || "").toString().trim();

    // NEW: subjects list
    const subjects = parseList(form.get("subjects"));

    // NEW: department marks mapping { slug: number }
    let departmentMarks: Record<string, number> = {};
    const dmRaw = form.get("departmentMarks");
    if (dmRaw) {
      try {
        const parsed = JSON.parse(dmRaw.toString());
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            const slug = String(k).trim().toLowerCase();
            const val = Number(v);
            if (slug && Number.isFinite(val) && val > 0) {
              departmentMarks[slug] = val;
            }
          }
        }
      } catch {
        /* ignore; will validate below */
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const applicableDepartments = Object.keys(departmentMarks);
    if (applicableDepartments.length === 0) {
      return NextResponse.json({ error: "Provide marks for at least one department" }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const parsed = parseXlsx(buf);
    if (parsed.length === 0) {
      return NextResponse.json({ error: "No questions found in sheet" }, { status: 400 });
    }

    const normalized = parsed.length < 50 ? padToFifty(parsed) : parsed.slice(0, 50);

    const items = normalized.map((x, i) =>
      x.type === "FIB"
        ? { i, id: x.id, type: "FIB", q: x.q, answerKey: x.answerKey, hint: null, points: x.points ?? 1, category: x.category ?? "" }
        : { i, id: x.id, type: x.type, q: x.q, options: x.options, answerKey: x.answerKey, hint: null, points: x.points ?? 1, category: x.category ?? "" }
    );

    const Paper = await QuestionPaper();
    const doc = await Paper.create({
      title,
      subjects, // NEW
      applicableDepartments,
      departmentMarks, // NEW
      items,
      status: "REVIEW",
      metaName,
      metaInitial,
      createdBy: who.uid,
    });

    return NextResponse.json({ ok: true, count: items.length, paperId: String(doc._id) });
  } catch (e: any) {
    console.error("[upload-xlsx] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
