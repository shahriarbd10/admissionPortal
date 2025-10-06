"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, Layers } from "lucide-react";

type Paper = {
  _id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  itemCount: number;
  createdAt: string;
  // flexible fields (we'll support both old/new docs)
  subjectSlugs?: string[];
  subjectNames?: string[];
  subjects?: string[]; // ObjectIds (legacy) – we’ll just display the count
  departments?: { slug: string }[];
};

type ApiResponse = {
  items: Paper[];
  counters?: { total: number; draft: number; published: number };
};

export default function ModeratorQueue() {
  const [list, setList] = useState<Paper[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/staff/papers/mine", { cache: "no-store" });
        const j: ApiResponse = await r.json();
        if (!r.ok) throw new Error((j as any)?.error || "Failed to load queue.");
        setList(j.items || []);
      } catch (e: any) {
        setErr(e?.message || "Server error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nothing = !loading && list.length === 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(80%_50%_at_10%_0%,#dbeafe_0%,transparent_60%),radial-gradient(70%_45%_at_120%_10%,#f5d0fe_0%,transparent_55%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-md shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_10%_-10%,rgba(59,130,246,.12),transparent_60%),radial-gradient(600px_240px_at_110%_-10%,rgba(236,72,153,.12),transparent_55%)]" />
          <div className="relative flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                My Review Queue
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Your uploaded question sets with status and quick details.
              </p>
            </div>
            <Link
              href="/staff/moderator"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Moderator
            </Link>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {err}
          </div>
        )}

        {/* List */}
        <div className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
          {loading && <div className="p-4 text-sm text-neutral-600">Loading…</div>}

          {nothing && (
            <div className="p-4 text-sm text-neutral-600">
              You haven’t uploaded any sets yet.
            </div>
          )}

          {!loading && list.length > 0 && (
            <ul className="divide-y">
              {list.map((p) => (
                <li key={p._id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-medium">{p.title}</div>
                      <StatusBadge status={p.status} />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                      {/* Subjects */}
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {formatSubjects(p)}
                      </span>

                      {/* Departments */}
                      {p.departments && p.departments.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          • {p.departments.map((d) => d.slug.toUpperCase()).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1 text-sm md:items-end">
                    <div className="text-neutral-800">
                      {p.itemCount} question{p.itemCount === 1 ? "" : "s"}
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-neutral-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatWhen(p.createdAt)}
                    </div>
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

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  if (status === "PUBLISHED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" /> Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
      <Clock className="h-3.5 w-3.5" /> Draft
    </span>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.max(1, Math.floor((now - d.getTime()) / 1000));
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString();
}

function formatSubjects(p: Paper) {
  if (Array.isArray(p.subjectNames) && p.subjectNames.length) {
    return p.subjectNames.join(", ");
  }
  if (Array.isArray(p.subjectSlugs) && p.subjectSlugs.length) {
    return p.subjectSlugs.map((s) => s.toUpperCase()).join(", ");
  }
  if (Array.isArray(p.subjects) && p.subjects.length) {
    return `${p.subjects.length} subject(s)`;
  }
  return "No subjects";
}
