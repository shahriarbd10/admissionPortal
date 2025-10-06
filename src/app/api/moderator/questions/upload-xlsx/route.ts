// src/app/api/moderator/questions/upload-xlsx/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { QuestionPaper } from "@/lib/models/QuestionPaper";
import { parseSheetBuffer } from "@/lib/parsers/sheetQuestions";

/** helper: parse comma or JSON array into string[] */
function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) {
      return j.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    }
  } catch {
    // fallback: comma-separated
  }
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Ensure exactly 50 items by trimming or repeating */
function toFifty<T>(arr: T[]): T[] {
  if (arr.length === 50) return arr.map((x) => x);
  if (arr.length > 50) return arr.slice(0, 50);
  const out: T[] = [];
  const pool = arr.length ? arr : [];
  while (out.length < 50) {
    out.push(pool[out.length % pool.length]);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const who = await requireStaff(["ADMIN", "MODERATOR"]);
    if (!who) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "Untitled Set").trim();

    // Optional meta
    const metaName = String(form.get("metaName") || form.get("ownerName") || "").trim();
    const metaInitial = String(
      form.get("metaInitial") || form.get("ownerInitial") || ""
    ).trim();

    // Subjects (slugs)
    const subjects = parseList(form.get("subjects"));

    // Departments: support either { slug:number } (departmentMarks) OR ["cse","eee"] (departments)
    let applicableDepartments: string[] = [];
    let departmentMarks: Record<string, number> = {};

    // If departmentMarks provided, use keys > 0
    const dmRaw = form.get("departmentMarks");
    if (dmRaw) {
      try {
        const parsed = JSON.parse(String(dmRaw));
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
        // ignore; we’ll fall back to departments[]
      }
    }

    if (Object.keys(departmentMarks).length > 0) {
      applicableDepartments = Object.keys(departmentMarks);
    } else {
      // else accept simple departments array
      applicableDepartments = parseList(form.get("departments"));
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const filename = (file.name || "").toLowerCase();
    if (![".xlsx", ".xls", ".csv"].some((ext) => filename.endsWith(ext))) {
      return NextResponse.json(
        { error: "Only .xlsx/.xls/.csv are supported" },
        { status: 400 }
      );
    }

    if (applicableDepartments.length === 0) {
      return NextResponse.json(
        { error: "Select at least one department" },
        { status: 400 }
      );
    }

    // Parse file buffer
    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = parseSheetBuffer(buf, file.name); // yields {id,type,q,options?,correctIndex?|correctText?,hint?,sl?}

    if (!parsed.length) {
      return NextResponse.json({ error: "No valid questions found" }, { status: 400 });
    }

    // Normalize to 50 and map to DB schema items (with correct answers kept server-side)
    const fifty = toFifty(parsed);
    const items = fifty.map((q, i) => {
      if (q.type === "FIB") {
        return {
          i,
          id: q.id,
          type: "FIB" as const,
          q: q.q,
          correctText: q.correctText,
          hint: q.hint ?? null,
        };
      }
      // MCQ / TF
      return {
        i,
        id: q.id,
        type: q.type,
        q: q.q,
        options: q.options ?? [],
        correctIndex:
          typeof (q as any).correctIndex === "number"
            ? (q as any).correctIndex
            : 0,
        hint: q.hint ?? null,
      };
    });

    await dbConnect();

    // Create the paper using the model directly
    const doc = await QuestionPaper.create({
      title,
      subjects, // store subject slugs (names can be resolved from ExamSubject if needed)
      departments: applicableDepartments.map((slug) => ({ slug })), // current structure used elsewhere
      ...(Object.keys(departmentMarks).length > 0 ? { departmentMarks } : {}),
      items,
      itemCount: items.length,
      status: "REVIEW",
      metaName,
      metaInitial,
      createdBy: who.id,
    });

    return NextResponse.json({
      ok: true,
      count: items.length,
      paperId: String(doc._id),
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/moderator/questions/upload-xlsx] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
