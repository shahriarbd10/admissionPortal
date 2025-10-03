"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  _id: string;
  department: string;
  examScore: number;
  gpaWeighted: number;
  submittedAt: string;
  applicantName?: string;
  applicantAfid?: string;
  applicantPhone?: string;
};

export default function AdminResultsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [dept, setDept] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const qs = new URLSearchParams();
      if (dept) qs.set("department", dept);
      const r = await fetch(`/api/admin/results?${qs.toString()}`, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Load failed");
      setRows(data.results || []);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [dept]);

  const total = rows.length;
  const avgExam = useMemo(
    () => (rows.reduce((s, r) => s + (r.examScore ?? 0), 0) / Math.max(1, total)).toFixed(2),
    [rows, total]
  );
  const avgGpa = useMemo(
    () => (rows.reduce((s, r) => s + (r.gpaWeighted ?? 0), 0) / Math.max(1, total)).toFixed(2),
    [rows, total]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Submissions with applicant snapshot and objective/GPA scores
            </p>
          </div>
          <Link href="/staff/admin" className="text-sm text-indigo-700 hover:underline" prefetch={false}>
            Back to Dashboard
          </Link>
        </header>

        {/* Filters + KPIs */}
        <section className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium">Department</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
                <option value="">All</option>
                <option value="cse">CSE</option>
                <option value="eee">EEE</option>
                <option value="bba">BBA</option>
                <option value="eng">ENG</option>
              </select>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-500">Submissions</div>
              <div className="text-xl font-semibold">{total}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-500">Avg Exam (50)</div>
              <div className="text-xl font-semibold">{avgExam}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-500">Avg GPA-Weighted (50)</div>
              <div className="text-xl font-semibold">{avgGpa}</div>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
          {msg && (
            <div className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-900">{msg}</div>
          )}

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-left">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">AFID</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Exam</th>
                  <th className="px-3 py-2">GPA</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-neutral-500">
                      No results yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => (
                    <tr key={r._id} className="border-t hover:bg-indigo-50/40">
                      <td className="px-3 py-2">{new Date(r.submittedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 uppercase">{r.department}</td>
                      <td className="px-3 py-2">{r.applicantName || "-"}</td>
                      <td className="px-3 py-2">{r.applicantAfid || "-"}</td>
                      <td className="px-3 py-2">{r.applicantPhone || "-"}</td>
                      <td className="px-3 py-2">{r.examScore}/50</td>
                      <td className="px-3 py-2">{r.gpaWeighted}/50</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/staff/admin/results/${r._id}`}
                          className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-white shadow hover:brightness-110"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
