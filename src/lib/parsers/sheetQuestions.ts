// src/lib/parsers/sheetQuestions.ts
import * as XLSX from "xlsx";
import { parse as parseCsv } from "csv-parse/sync";

/**
 * Normalized question types emitted by the parser.
 */
export type ParsedQuestion =
  | {
      id: string;
      type: "MCQ";
      q: string;
      options: string[];
      correctIndex: number;
      hint?: never;
      sl?: number;
    }
  | {
      id: string;
      type: "TF";
      q: string;
      options: ["True", "False"];
      correctIndex: 0 | 1;
      hint?: never;
      sl?: number;
    }
  | {
      id: string;
      type: "FIB";
      q: string;
      correctText: string;
      hint?: string | null;
      sl?: number;
    };

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const TF_OPTIONS = ["True", "False"] as const;

function normalizeType(v: unknown): "MCQ" | "TF" | "FIB" | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (["MCQ", "MULTIPLE CHOICE", "MULTIPLE-CHOICE"].includes(s)) return "MCQ";
  if (["TF", "TRUE FALSE", "TRUE/FALSE", "T/F"].includes(s)) return "TF";
  if (["FIB", "FILL", "FILL IN THE BLANKS", "FILL IN THE BLANK"].includes(s))
    return "FIB";
  return null;
}

function parseAnswerForMcq(ans: unknown, optionLen: number): number {
  const t = String(ans ?? "").trim();
  if (!t) return -1;
  const letter = t.toUpperCase();
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  if (letter in map) return map[letter];
  const n = Number(t);
  if (Number.isFinite(n) && n >= 0 && n < optionLen) return n;
  return -1;
}

function parseAnswerForTF(ans: unknown): 0 | 1 | -1 {
  const t = String(ans ?? "").trim().toLowerCase();
  if (["true", "t", "1", "yes"].includes(t)) return 0;
  if (["false", "f", "0", "no"].includes(t)) return 1;
  const n = Number(t);
  if (n === 0) return 0;
  if (n === 1) return 1;
  return -1;
}

/** Type guard so TS narrows 0|1|-1 → 0|1 */
function isTFIndex(x: number): x is 0 | 1 {
  return x === 0 || x === 1;
}

function letterToIndex(ans: string): number {
  const up = ans.toUpperCase();
  if (up === "A") return 0;
  if (up === "B") return 1;
  if (up === "C") return 2;
  if (up === "D") return 3;
  const n = Number(ans);
  return Number.isFinite(n) ? n : -1;
}

/* ------------------------------------------------------------------ */
/* Row → ParsedQuestion normalization                                  */
/* ------------------------------------------------------------------ */

function normalizeRows(rows: any[]): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  let idx = 0;

  for (const r of rows) {
    const sl = Number(r.SL ?? r.sl ?? r.Index ?? r.index ?? idx + 1);

    const type = normalizeType(r["Question Type"] ?? r["Type"] ?? r.type);
    const qtext = String(r["Question"] ?? r["Q"] ?? r.q ?? "").trim();
    const hint = String(r["Hint"] ?? r["hint"] ?? "").trim();

    if (!type || !qtext) {
      idx++;
      continue;
    }

    if (type === "FIB") {
      const correctText = String(r["Answer"] ?? r["ANS"] ?? r.answer ?? "").trim();
      if (!correctText) {
        idx++;
        continue;
      }
      out.push({
        id: makeId(idx),
        type: "FIB",
        q: qtext,
        correctText,
        hint: hint ? hint : undefined,
        sl,
      });
      idx++;
      continue;
    }

    // MCQ / TF
    const A = String(r["A"] ?? r["Option A"] ?? r.A ?? "").trim();
    const B = String(r["B"] ?? r["Option B"] ?? r.B ?? "").trim();
    const C = String(r["C"] ?? r["Option C"] ?? r.C ?? "").trim();
    const D = String(r["D"] ?? r["Option D"] ?? r.D ?? "").trim();

    let options = [A, B, C, D].filter((v) => v !== "");
    if (type === "TF") {
      options = [...TF_OPTIONS];
    }
    if (options.length < 2) {
      idx++;
      continue;
    }

    const ansRaw = String(r["Answer"] ?? r["ANS"] ?? r.answer ?? "").trim();

    if (type === "TF") {
      const tfIdx = parseAnswerForTF(ansRaw);
      if (!isTFIndex(tfIdx)) {
        idx++;
        continue;
      }
      out.push({
        id: makeId(idx),
        type: "TF",
        q: qtext,
        options: [...TF_OPTIONS],
        correctIndex: tfIdx, // now typed as 0 | 1
        sl,
      });
      idx++;
      continue;
    }

    // MCQ
    const parsed = parseAnswerForMcq(ansRaw, options.length);
    const mcqIdx = parsed >= 0 ? parsed : letterToIndex(ansRaw);

    if (mcqIdx < 0 || mcqIdx >= options.length) {
      idx++;
      continue;
    }

    out.push({
      id: makeId(idx),
      type: "MCQ",
      q: qtext,
      options,
      correctIndex: mcqIdx,
      sl,
    });

    idx++;
  }

  return out;
}

function makeId(i: number) {
  // simple, stable-ish id for a single import pass
  return `q-${Date.now()}-${i}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Parse the first sheet of an XLSX/XLS buffer. */
export function parseXlsxQuestions(buf: Buffer): ParsedQuestion[] {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  return normalizeRows(rows);
}

/** Parse a CSV buffer (header row required). */
export function parseCsvQuestions(buf: Buffer): ParsedQuestion[] {
  const text = buf.toString("utf8");
  const rows: any[] = parseCsv(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return normalizeRows(rows);
}

/** Convenience: choose CSV vs XLSX parser by filename. */
export function parseSheetBuffer(buf: Buffer, filename?: string): ParsedQuestion[] {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvQuestions(buf);
  return parseXlsxQuestions(buf);
}
