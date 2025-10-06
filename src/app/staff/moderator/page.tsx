// src/app/staff/moderator/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CloudUpload,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Layers,
  CheckCircle2,
  Clock,
  Home,
} from "lucide-react";

type MineCounters = { total: number; draft: number; published: number };

export default function ModeratorDashboard() {
  const [counters, setCounters] = useState<MineCounters>({
    total: 0,
    draft: 0,
    published: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/staff/papers/mine?only=counters", {
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = await r.json();
        setCounters(j.counters || { total: 0, draft: 0, published: 0 });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const statCards = useMemo(
    () => [
      {
        title: "Your Sets",
        value: counters.total,
        hint: "All uploads",
        icon: <Layers className="h-5 w-5" />,
      },
      {
        title: "Awaiting Publish",
        value: counters.draft,
        hint: "Draft status",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        title: "Published",
        value: counters.published,
        hint: "Live sets",
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
    ],
    [counters]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(80%_50%_at_10%_0%,#dbeafe_0%,transparent_60%),radial-gradient(70%_45%_at_120%_10%,#f5d0fe_0%,transparent_55%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-md shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_10%_-10%,rgba(59,130,246,.12),transparent_60%),radial-gradient(600px_240px_at_110%_-10%,rgba(236,72,153,.12),transparent_55%)]" />
          <div className="relative flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Moderator Dashboard</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Upload question sheets, attach subjects/departments, and track their
                review/publish status.
              </p>
            </div>

            {/* Back to Home */}
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-white"
              aria-label="Back to Home"
              title="Back to Home"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {statCards.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">{s.title}</div>
                {s.icon}
              </div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/staff/moderator/upload"
            prefetch={false}
            className="group rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:shadow backdrop-blur"
          >
            <div className="text-xs font-medium text-neutral-500">QUESTION BANK</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <CloudUpload className="h-5 w-5" />
              Upload Question Sheet
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Import CSV/XLSX and attach subjects & departments.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600">
              Start upload <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/staff/moderator/queue"
            prefetch={false}
            className="group rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:shadow backdrop-blur"
          >
            <div className="text-xs font-medium text-neutral-500">REVIEW</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <ListChecks className="h-5 w-5" />
              My Review Queue
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Track each set’s status, subjects, departments, and counts.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600">
              Open queue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>

          <div
            className="rounded-2xl border bg-white/60 p-5 opacity-60 shadow-sm"
            title="Insights coming soon"
          >
            <div className="text-xs font-medium text-neutral-500">ANALYTICS</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5" />
              Quality & Coverage
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Subject coverage, duplicates, difficulty and more.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
