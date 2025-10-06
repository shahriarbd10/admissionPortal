"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Paper = {
  id: string;
  title: string;
  ownerName: string;
  ownerInitial: string;
  subjects: string[];
  departments: string[];
  itemCount: number;
  createdAt: string;
  publishedAt: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export default function AdminPapersReviewPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const r = await fetch("/api/staff/papers/review?status=DRAFT", {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Server error");
      setPapers(j.papers || []);
    } catch (e: any) {
      setMsg(e?.message || "Server error");
      setPapers([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function publish(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/papers/${id}/publish`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Publish failed");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Question Sets — Review</h1>
          <Link href="/staff/admin" className="text-indigo-700 hover:underline">
            Back
          </Link>
        </header>

        {msg && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
            {msg}
          </div>
        )}

        <div className="rounded-2xl border bg-white p-3">
          {papers.length === 0 ? (
            <div className="rounded-xl border p-4 text-sm text-neutral-600">
              No items awaiting review.
            </div>
          ) : (
            <ul className="divide-y">
              {papers.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">
                      {p.title} <span className="text-neutral-400">•</span>{" "}
                      <span className="text-sm text-neutral-600">
                        {p.ownerName} ({p.ownerInitial})
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      subjects: {p.subjects.join(", ") || "—"} • depts:{" "}
                      {p.departments.join(", ") || "—"} • {p.itemCount} items
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busy === p.id}
                      onClick={() => publish(p.id)}
                      className="rounded bg-indigo-600 px-3 py-1.5 text-white disabled:opacity-60"
                    >
                      {busy === p.id ? "Publishing…" : "Publish"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
