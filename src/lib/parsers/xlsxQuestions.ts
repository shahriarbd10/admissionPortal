import * as XLSX from "xlsx";

/** Internal normalized item used at upload time */
export type UploadItem =
  | { id: string; type: "MCQ" | "TF"; q: string; options: string[]; answerKey: number; points?: number; category?: string }
  | { id: string; type: "FIB"; q: string; answerKey: string; points?: number; category?: string };

function norm(s: unknown) {
  return String(s ?? "").trim();
}
function qtype(s: string): "MCQ" | "TF" | "FIB" | "" {
  const x = s.toLowerCase();
  if (["mcq", "multiple", "multiple choice"].some(k => x.includes(k))) return "MCQ";
  if (["tf", "true/false", "true false"].some(k => x.includes(k))) return "TF";
  if (["fib", "fill", "blank"].some(k => x.includes(k))) return "FIB";
  return "";
}
function ansToIndex(a: string) {
  const t = a.trim().toUpperCase();
  if (["A","B","C","D"].includes(t)) return "ABCD".indexOf(t);
  const n = Number(t);
  if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  if (t === "TRUE") return 0;
  if (t === "FALSE") return 1;
  return -1;
}

/** Parse first sheet of the workbook into normalized items */
export function parseXlsx(buf: ArrayBuffer): UploadItem[] {
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  // try to map by common headers
  const headerMap = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("question type")) return "type";
    if (k === "type") return "type";
    if (k === "question") return "q";
    if (k === "a") return "a";
    if (k === "b") return "b";
    if (k === "c") return "c";
    if (k === "d") return "d";
    if (k.startsWith("ans")) return "answer";
    if (k === "sl" || k === "serial" || k === "no") return "sl";
    return key;
  };

  const out: UploadItem[] = [];
  rows.forEach((r, idx) => {
    // remap keys
    const rr: Record<string, string> = {};
    Object.entries(r).forEach(([k, v]) => (rr[headerMap(k)] = norm(v)));

    const type = qtype(rr["type"]);
    const q = rr["q"];
    if (!type || !q) return;

    const id = rr["sl"] ? `row-${rr["sl"]}` : `row-${idx + 1}`;

    if (type === "FIB") {
      const a = rr["answer"];
      if (!a) return;
      out.push({ id, type: "FIB", q, answerKey: a, points: 1 });
      return;
    }

    // MCQ / TF
    let options = [rr["a"], rr["b"], rr["c"], rr["d"]].map(norm).filter(Boolean);
    if (type === "TF") options = ["True", "False"]; // prefer canonical

    if (options.length < 2) return;
    const ansIdx = ansToIndex(rr["answer"]);
    if (ansIdx < 0) return;

    out.push({ id, type: type as "MCQ" | "TF", q, options, answerKey: ansIdx, points: 1 });
  });

  return out;
}

/** If less than 50, repeat random questions (with stable ids suffixed) to reach 50 */
export function padToFifty(items: UploadItem[]): UploadItem[] {
  if (items.length >= 50) return items.slice(0, 50);
  const out = [...items];
  let i = 0;
  while (out.length < 50 && items.length > 0) {
    const pick = items[Math.floor(Math.random() * items.length)];
    const clone = { ...pick, id: `${pick.id}#${i + 1}` } as UploadItem;
    out.push(clone);
    i++;
  }
  return out;
}
