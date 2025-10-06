"use client";

import { useEffect, useMemo, useState } from "react";
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

type Dept = { slug: string; name: string; isActive: boolean; windowStart?: string; windowEnd?: string };

export default function AdminPublishedPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>("__all__");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      // departments for filter
      const dRes = await fetch("/api/departments?activeOnly=false", { cache: "no-store" });
      const dJson = await dRes.json().catch(() => ({ departments: [] }));
      setDepartments(dJson.departments || []);

      // papers
      const qs = new URLSearchParams({ status: "PUBLISHED" });
      if (deptFilter !== "__all__") qs.set("department", deptFilter);

      const pRes = await fetch(`/api/staff/papers/review?${qs.toString()}`, { cache: "no-store" });
      const pJson = await pRes.json();
      if (!pRes.ok) throw new Error(pJson?.error || "Failed to load");
      setPapers(pJson.papers || []);
    } catch (e: any) {
      setMsg(e?.message || "Server error");
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter]);

  // Group papers by department slug so each paper appears under each applicable dept
  const grouped = useMemo(() => {
    const g = new Map<string, Paper[]>();
    const add = (slug: string, p: Paper) => {
      if (!g.has(slug)) g.set(slug, []);
      g.get(slug)!.push(p);
    };

    if (deptFilter !== "__all__") {
      // already filtered from API; just group under that one
      papers.forEach((p) => add(deptFilter, p));
    } else {
      papers.forEach((p) => {
        const depts = p.departments?.length ? p.departments : ["__none__"];
        depts.forEach((slug) => add(slug, p));
      });
    }
    return g;
  }, [papers, deptFilter]);

  function nameOfDept(slug: string) {
    if (slug === "__none__") return "Unassigned";
    const d = departments.find((x) => x.slug === slug);
    return d ? d.name : slug.toUpperCase();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Published Question Sets</h1>
            <p className="text-sm text-neutral-600">Grouped by department</p>
          </div>
          <Link href="/staff/admin" className="text-indigo-700 hover:underline">
            Back
          </Link>
        </header>

        {/* Filters */}
        <div className="rounded-2xl border bg-white p-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral-600">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="__all__">All departments</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({d.slug.toUpperCase()})
                </option>
              ))}
            </select>
            <button
              onClick={() => void load()}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {msg && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
            {msg}
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl border bg-white">
          {loading ? (
            <div className="p-6 text-sm text-neutral-600">Loading…</div>
          ) : grouped.size === 0 ? (
            <div className="p-6 text-sm text-neutral-600">No published papers found.</div>
          ) : (
            Array.from(grouped.entries()).map(([slug, list]) => (
              <section key={slug} className="border-t first:border-t-0">
                <div className="bg-neutral-50 px-4 py-2 text-sm font-medium">
                  {nameOfDept(slug)}
                </div>
                <ul className="divide-y">
                  {list.map((p) => (
                    <li key={`${slug}-${p.id}`} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {p.title}{" "}
                          <span className="text-neutral-400">•</span>{" "}
                          <span className="text-sm text-neutral-600">
                            {p.ownerName} ({p.ownerInitial})
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          subjects: {p.subjects.join(", ") || "—"} • items: {p.itemCount} •{" "}
                          published: {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : "—"}
                        </div>
                      </div>
                      {/* room for actions later (view, export, unpublish, etc.) */}
                      <div className="flex items-center gap-2">
                        {/* Placeholder */}
                        <span className="text-xs text-neutral-400">PUBLISHED</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
