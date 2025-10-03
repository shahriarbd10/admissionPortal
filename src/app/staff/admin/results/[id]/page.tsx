"use client";

import { useEffect, useMemo, useState } from "react";

type PaperItem = {
  i: number;
  id: string;
  type: "MCQ" | "TF" | "FIB";
  q: string;
  options?: string[];
  correctIndex?: number;
  correctText?: string;
  hint?: string | null;
};
type ResultItem = {
  i: number;
  id: string;
  type: "MCQ" | "TF" | "FIB";
  answer: number | string | null;
  correctAnswer: number | string;
  correct: boolean;
};
type Attempt = {
  _id: string;
  department: string;
  startAt: string;
  endAt: string;
  submittedAt: string;
  examScore: number;
  gpaWeighted: number;
  applicantName?: string;
  applicantAfid?: string;
  applicantPhone?: string;
  paper: PaperItem[];
  results: ResultItem[];
};

export default function AttemptDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Attempt | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/results/${params.id}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");
      setData(j.attempt);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    }
  }

  useEffect(() => { void load(); }, [params.id]);

  const merged = useMemo(() => {
    if (!data) return [];
    const byIndex = new Map<number, { p: PaperItem; r?: ResultItem }>();
    data.paper.forEach((p) => byIndex.set(p.i, { p }));
    data.results.forEach((r) => {
      const m = byIndex.get(r.i);
      if (m) m.r = r;
    });
    return Array.from(byIndex.values()).sort((a, b) => a.p.i - b.p.i);
  }, [data]);

  if (!data) {
    return (
      <main className="min-h-screen p-6">
        {msg && <div className="mb-3 rounded bg-amber-50 text-amber-900 p-2 text-sm">{msg}</div>}
        <div className="text-sm text-neutral-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Attempt Detail</h1>
            <p className="text-sm text-neutral-600">
              Dept <b className="uppercase">{data.department}</b> •
              Submitted {new Date(data.submittedAt).toLocaleString()}
            </p>
          </div>
          <a href="/staff/admin/results" className="text-sm text-indigo-700 hover:underline">Back</a>
        </header>

        {/* Snapshot + scores */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div><div className="text-xs text-neutral-500">Name</div><div className="font-medium">{data.applicantName || "-"}</div></div>
            <div><div className="text-xs text-neutral-500">AFID</div><div className="font-medium">{data.applicantAfid || "-"}</div></div>
            <div><div className="text-xs text-neutral-500">Phone</div><div className="font-medium">{data.applicantPhone || "-"}</div></div>
            <div><div className="text-xs text-neutral-500">Scores</div><div className="font-medium">Exam {data.examScore}/50 • GPA {data.gpaWeighted}/50</div></div>
          </div>
        </section>

        {/* Per-question */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 font-semibold">Responses</div>
          <div className="space-y-3">
            {merged.map(({ p, r }) => (
              <div key={p.i} className="rounded-lg border p-3">
                <div className="mb-1 text-xs text-neutral-500">Q{p.i + 1} • {p.type}</div>
                <div className="mb-2 font-medium">{p.q}</div>

                {p.type !== "FIB" && p.options && (
                  <ul className="mb-2 list-disc pl-6 text-sm">
                    {p.options.map((o, idx) => (
                      <li key={idx}>
                        <span className={r?.correctAnswer === idx ? "font-semibold" : ""}>
                          {String.fromCharCode(65 + idx)}. {o}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="text-sm">
                  <span className="mr-2">Answer: <b>{
                    p.type !== "FIB"
                      ? (typeof r?.answer === "number" ? String.fromCharCode(65 + (r!.answer as number)) : "-")
                      : (typeof r?.answer === "string" ? r?.answer : "-")
                  }</b></span>
                  <span className={r?.correct ? "text-emerald-700" : "text-rose-700"}>
                    {r?.correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>

                {!r?.correct && (
                  <div className="mt-1 text-xs text-neutral-600">
                    Correct:{' '}
                    <b>{
                      p.type !== "FIB"
                        ? (typeof r?.correctAnswer === "number" ? String.fromCharCode(65 + (r!.correctAnswer as number)) : "-")
                        : (typeof r?.correctAnswer === "string" ? r?.correctAnswer : "-")
                    }</b>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
