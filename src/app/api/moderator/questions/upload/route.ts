// src/app/api/moderator/questions/upload/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import { dbConnect } from "@/lib/db";
import { requireStaff } from "@/lib/staffSession";
import { ExamSubject } from "@/lib/models/ExamSubject";
import { QuestionPaper } from "@/lib/models/QuestionPaper";
import { parseSheetBuffer } from "@/lib/parsers/sheetQuestions";

export async function POST(req: Request) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    const title = String(form.get("title") || "Untitled").trim();
    const ownerName = String(form.get("ownerName") || "").trim();
    const ownerInitial = String(form.get("ownerInitial") || "").trim();

    // subjects can be JSON array (preferred) or CSV string
    const subjectsRaw = String(form.get("subjects") || "").trim();

    // departments comes as JSON array of slugs: ["cse","eee"]
    const deptJson = String(form.get("departments") || "[]").trim();

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!ownerName || !ownerInitial) {
      return NextResponse.json({ error: "Provide owner name & initial" }, { status: 400 });
    }

    // Parse department slugs
    let deptSlugs: string[] = [];
    try {
      const parsed = JSON.parse(deptJson || "[]");
      if (!Array.isArray(parsed)) throw new Error("departments must be an array");
      deptSlugs = parsed.map((s: any) => String(s || "").toLowerCase()).filter(Boolean);
    } catch {
      return NextResponse.json({ error: "Bad departments payload" }, { status: 400 });
    }
    if (deptSlugs.length === 0) {
      return NextResponse.json({ error: "Tick at least one applicable department" }, { status: 400 });
    }

    const lower = (file.name || "").toLowerCase();
    if (![".xlsx", ".xls", ".csv"].some((ext) => lower.endsWith(ext))) {
      return NextResponse.json({ error: "Only .xlsx/.xls/.csv are supported" }, { status: 400 });
    }

    // Read buffer and parse items
    const buf = Buffer.from(await file.arrayBuffer());
    const items = parseSheetBuffer(buf, file.name);
    if (!items.length) {
      return NextResponse.json({ error: "No valid questions found" }, { status: 400 });
    }

    await dbConnect();

    // ---- map subject inputs to slugs & labels ----
    // Accept JSON array or CSV
    let subjectInputs: string[] = [];
    try {
      const parsed = JSON.parse(subjectsRaw);
      if (Array.isArray(parsed)) {
        subjectInputs = parsed.map((s: any) => String(s || "").toLowerCase());
      }
    } catch {
      // not JSON: treat as CSV
      subjectInputs = subjectsRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    const subjectDocs = await ExamSubject.find({ slug: { $in: subjectInputs } })
      .select({ slug: 1, name: 1 })
      .lean<{ slug: string; name: string }[]>()
      .exec();

    if (subjectDocs.length !== subjectInputs.length) {
      const missing = subjectInputs.filter((s) => !subjectDocs.some((d) => d.slug === s));
      return NextResponse.json({ error: `Unknown subjects: ${missing.join(", ")}` }, { status: 400 });
    }

    const subjectSlugs = subjectDocs.map((d) => d.slug);
    const subjectLabels = subjectDocs.map((d) => d.name);

    // Create DB document (gets id for folder name)
    const doc = await QuestionPaper.create({
      title,
      ownerName,
      ownerInitial,
      subjects: subjectSlugs,        // 🔁 store slugs
      subjectLabels,                 // nice to show in UI
      departments: deptSlugs.map((slug) => ({ slug })), // simple mark/unmark
      status: "DRAFT",
      items,
      itemCount: items.length,
      createdBy: staff.id,           // from requireStaff()
    });

    // Save local backups
    const baseDir = path.join(process.cwd(), "uploads", "papers", String(doc._id));
    await fs.mkdir(baseDir, { recursive: true });

    const ext = lower.endsWith(".csv") ? ".csv" : lower.endsWith(".xls") ? ".xls" : ".xlsx";
    const originalPath = path.join(baseDir, `original${ext}`);
    await fs.writeFile(originalPath, buf);

    const parsedPath = path.join(baseDir, "parsed.json");
    await fs.writeFile(parsedPath, JSON.stringify(items, null, 2), "utf8");

    // Update doc with file paths
    await QuestionPaper.updateOne(
      { _id: doc._id },
      {
        $set: {
          file: {
            originalName: file.name,
            mime: file.type,
            size: buf.byteLength,
            path: originalPath,
          },
          parsedFilePath: parsedPath,
        },
      }
    );

    return NextResponse.json({ ok: true, id: String(doc._id), count: items.length });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[/api/moderator/questions/upload] error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
