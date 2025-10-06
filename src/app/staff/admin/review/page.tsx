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
};

export default function AdminPapersReviewPage() {
  const [items, setItems] = useState<Paper[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const r = await fetch("/api/staff/papers/review", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Server error");
      setItems(j.papers || []);
    } catch (e: any) {
      setMsg(e?.message || "Server error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function publish(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/papers/${id}/publish`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Publish failed");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Publish failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8ff] p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Question Sets — Review</h1>
          <Link href="/staff/admin" className="text-sm text-indigo-700 hover:underline" prefetch={false}>
            Back
          </Link>
        </div>

        {msg && (
          <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {msg}
          </div>
        )}

        <div className="rounded-2xl border bg-white p-3">
          {items.length === 0 ? (
            <div className="rounded-xl border p-4 text-neutral-600">
              No items awaiting review.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-neutral-500">
                        By {p.ownerName} ({p.ownerInitial}) • {new Date(p.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Subjects: {p.subjects.join(", ") || "—"} • Depts: {p.departments.join(", ") || "—"} • {p.itemCount} items
                      </div>
                    </div>
                    <button
                      onClick={() => publish(p.id)}
                      disabled={busyId === p.id}
                      className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      {busyId === p.id ? "Publishing…" : "Publish"}
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
