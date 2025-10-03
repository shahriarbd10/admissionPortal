// src/app/staff/admin/results/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

export default function AttemptDetailPage() {
  const { id } = useParams<{ id: string }>(); // ✅ no params warning
  const [data, setData] = useState<Attempt | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/results/${id}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Load failed");
      setData(j.attempt);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
        {msg && (
          <div className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-900">
            {msg}
          </div>
        )}
        <div className="text-sm text-neutral-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attempt Detail</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Dept <b className="uppercase">{data.department}</b> • Submitted{" "}
              {new Date(data.submittedAt).toLocaleString()}
            </p>
          </div>
          <Link
            href="/staff/admin/results"
            className="text-sm text-indigo-700 hover:underline"
            prefetch={false}
          >
            Back
          </Link>
        </header>

        {/* Snapshot + scores */}
        <section className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-neutral-500">Name</div>
              <div className="font-medium">{data.applicantName || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">AFID</div>
              <div className="font-medium">{data.applicantAfid || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Phone</div>
              <div className="font-medium">{data.applicantPhone || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Scores</div>
              <div className="font-medium">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-200">
                  Exam {data.examScore}/50
                </span>
                <span className="ml-2 rounded-full bg-fuchsia-50 px-2 py-0.5 text-fuchsia-700 ring-1 ring-fuchsia-200">
                  GPA {data.gpaWeighted}/50
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Per-question */}
        <section className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Responses</div>
            <div className="text-xs text-neutral-500">
              <span className="mr-2 rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">
                ✓ Correct
              </span>
              <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-700">
                ✗ Incorrect
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {merged.map(({ p, r }) => (
              <div
                key={p.i}
                className={`rounded-xl border p-3 ${
                  r?.correct
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-rose-200 bg-rose-50/40"
                }`}
              >
                <div className="mb-1 text-xs text-neutral-500">
                  Q{p.i + 1} • {p.type}
                </div>
                <div className="mb-2 font-medium leading-6">{p.q}</div>

                {p.type !== "FIB" && p.options && (
                  <ul className="mb-2 grid gap-2 sm:grid-cols-2">
                    {p.options.map((o, idx) => {
                      const isCorrect =
                        typeof r?.correctAnswer === "number" &&
                        r.correctAnswer === idx;
                      const isChosen =
                        typeof r?.answer === "number" && r.answer === idx;
                      return (
                        <li
                          key={idx}
                          className={`rounded-lg border px-3 py-2 ${
                            isCorrect ? "border-emerald-400 bg-emerald-50" : ""
                          } ${
                            isChosen && !isCorrect
                              ? "border-rose-400 bg-rose-50"
                              : ""
                          }`}
                        >
                          <span className="mr-2 font-mono text-xs">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {o}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Answers row */}
                <div className="text-sm">
                  <span className="mr-3">
                    Answer:{" "}
                    <b>
                      {p.type !== "FIB"
                        ? typeof r?.answer === "number"
                          ? String.fromCharCode(65 + (r!.answer as number))
                          : "-"
                        : typeof r?.answer === "string"
                        ? (r.answer as string)
                        : "-"}
                    </b>
                  </span>

                  <span
                    className={r?.correct ? "text-emerald-700" : "text-rose-700"}
                  >
                    {r?.correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>

                {!r?.correct && (
                  <div className="mt-1 text-xs text-neutral-700">
                    Correct:&nbsp;
                    <b>
                      {p.type !== "FIB"
                        ? typeof r?.correctAnswer === "number"
                          ? String.fromCharCode(
                              65 + (r!.correctAnswer as number)
                            )
                          : "-"
                        : typeof r?.correctAnswer === "string"
                        ? (r.correctAnswer as string)
                        : "-"}
                    </b>
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
