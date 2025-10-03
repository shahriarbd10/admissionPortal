"use client";

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
      const r = await fetch(`/api/admin/results?${qs.toString()}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Load failed");
      setRows(data.results || []);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [dept]);

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exam Results</h1>
            <p className="text-sm text-neutral-600">Submissions with applicant snapshot</p>
          </div>
          <a href="/staff/admin" className="text-sm text-indigo-700 hover:underline">Back to Dashboard</a>
        </header>

        {/* Filters + KPIs */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
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
            <div className="rounded-lg border p-3">
              <div className="text-xs text-neutral-500">Submissions</div>
              <div className="text-xl font-semibold">{total}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-neutral-500">Avg Exam Score</div>
              <div className="text-xl font-semibold">{avgExam}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-neutral-500">Avg GPA-Weighted</div>
              <div className="text-xl font-semibold">{avgGpa}</div>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          {msg && <div className="mb-3 rounded bg-amber-50 text-amber-900 p-2 text-sm">{msg}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">AFID</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Exam</th>
                  <th className="px-3 py-2">GPA-Weighted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td className="border-t px-3 py-2">{new Date(r.submittedAt).toLocaleString()}</td>
                    <td className="border-t px-3 py-2 uppercase">{r.department}</td>
                    <td className="border-t px-3 py-2">{r.applicantName || "-"}</td>
                    <td className="border-t px-3 py-2">{r.applicantAfid || "-"}</td>
                    <td className="border-t px-3 py-2">{r.applicantPhone || "-"}</td>
                    <td className="border-t px-3 py-2">{r.examScore}/50</td>
                    <td className="border-t px-3 py-2">{r.gpaWeighted}/50</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-neutral-500">
                      No results yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
