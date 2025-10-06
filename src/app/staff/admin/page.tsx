"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileCheck2,
  BookOpenCheck,
  UploadCloud,
  CheckCircle2,
  Layers,
  Shield,
  ChevronRight,
} from "lucide-react";

type AdminStats = {
  publishedDeptCount: number;
  submissionsCount: number;
  activeDeptCount: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        const j = await r.json();
        if (r.ok && j?.stats) setStats(j.stats as AdminStats);
      } catch {
        // ignore; cards will show fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[conic-gradient(at_20%_-10%,#eef2ff,white_30%,#fff1f2_60%,white_75%,#eff6ff_100%)] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-100 blur-2xl" />
          <div className="absolute -bottom-12 -left-16 h-48 w-48 rounded-full bg-fuchsia-100 blur-2xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Manage question sets, publish per department, and review exam submissions.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow"
              prefetch={false}
            >
              <ChevronRight className="h-4 w-4 -scale-x-100 text-neutral-400" />
              Back to Home
            </Link>
          </div>
        </header>

        {/* Quick Insights */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardStat
            icon={<Layers className="h-5 w-5 text-indigo-600" />}
            label="Published Sets"
            value={
              loading
                ? "…"
                : stats
                ? String(stats.publishedDeptCount)
                : "—"
            }
            hint="Latest per department"
          />
          <CardStat
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label="Submissions"
            value={loading ? "…" : stats ? String(stats.submissionsCount) : "—"}
            hint="All-time count"
          />
          <CardStat
            icon={<Shield className="h-5 w-5 text-rose-600" />}
            label="Active Departments"
            value={loading ? "…" : stats ? String(stats.activeDeptCount) : "—"}
            hint="Open for exam"
          />
        </section>

        {/* Primary actions */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Results / Reports */}
          <NavCard
            href="/staff/admin/results"
            title="Exam Submissions"
            subtitle="Score breakdowns & GPA weighting"
            icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
            pill="Reports"
          />

          {/* Review & Publish */}
          <NavCard
            href="/staff/admin/questions/review"
            title="Review & Publish"
            subtitle="Approve moderator uploads & publish per dept"
            icon={<FileCheck2 className="h-5 w-5 text-fuchsia-600" />}
            pill="Question Bank"
          />

          {/* Published Sets (list) */}
          <NavCard
            href="/staff/admin/questions/published"
            title="Published Sets"
            subtitle="Browse all published sets by department"
            icon={<BookOpenCheck className="h-5 w-5 text-emerald-600" />}
            pill="Live"
          />

          {/* Shortcut to moderator upload */}
          <NavCard
            href="/staff/moderator/questions"
            title="Upload Questions"
            subtitle="Import CSV/XLSX & attach subjects"
            icon={<UploadCloud className="h-5 w-5 text-sky-600" />}
            pill="Moderator"
          />
        </section>

        {/* Secondary row */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl border bg-white/60 p-5 opacity-80 shadow-sm"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Scheduling</div>
            <div className="mt-1 text-lg font-semibold">Windows &amp; Duration</div>
            <p className="mt-2 text-sm text-neutral-600">
              Configure exam windows, duration, and capacity.
            </p>
          </div>

          <div
            className="rounded-2xl border bg-white/60 p-5 opacity-80 shadow-sm"
            title="Coming soon"
          >
            <div className="text-sm font-medium text-neutral-500">Analytics</div>
            <div className="mt-1 text-lg font-semibold">Performance &amp; Trends</div>
            <p className="mt-2 text-sm text-neutral-600">
              Department-wise outcomes, subject heatmaps, and more.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ------------------------- Small UI helpers ------------------------- */

function CardStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-fuchsia-50 opacity-70 blur-2xl transition group-hover:scale-110" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-neutral-500">{label}</span>
          <span className="mt-1 text-2xl font-semibold tabular-nums">{value}</span>
          {hint && <span className="mt-1 text-xs text-neutral-500">{hint}</span>}
        </div>
        <div className="rounded-xl bg-neutral-50 p-2 ring-1 ring-neutral-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
  icon,
  pill,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  pill?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-fuchsia-50 opacity-70 blur-2xl transition group-hover:scale-110" />
      <div className="relative z-10 flex items-start gap-3">
        <div className="rounded-xl bg-neutral-50 p-2 ring-1 ring-neutral-200">
          {icon}
        </div>
        <div className="min-w-0">
          {pill && (
            <div className="mb-1 inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600 ring-1 ring-neutral-200">
              {pill}
            </div>
          )}
          <div className="truncate text-lg font-semibold">{title}</div>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
