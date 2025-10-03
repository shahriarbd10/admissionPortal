"use client";

import { useEffect, useMemo, useState } from "react";

type Dept = {
  slug: string;
  name: string;
  windowStart: string | Date;
  windowEnd: string | Date;
  isActive: boolean;
  capacity?: number | null;
};

function isOpen(d: Dept) {
  const now = Date.now();
  return (
    d.isActive &&
    now >= new Date(d.windowStart).getTime() &&
    now <= new Date(d.windowEnd).getTime()
  );
}

export default function ProfileDepartmentSelect() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selected, setSelected] = useState<string>(""); // current selection (from server)
  const [pick, setPick] = useState<string>("");        // local pick to submit

  useEffect(() => {
    (async () => {
      try {
        // 1) load active departments
        const d = await fetch("/api/departments?activeOnly=true", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ departments: [] }));
        setDepartments(d.departments || []);

        // 2) load my current selection (via /api/me/profile for phone + selection)
        const me = await fetch("/api/me/profile", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ profile: {} }));
        const current = me?.profile?.selectedDepartmentSlug || "";
        setSelected(current);
        setPick(current);
      } catch {
        setMsg("Failed to load departments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openList = useMemo(
    () => departments.filter((d) => isOpen(d)),
    [departments]
  );

  const submit = async () => {
    if (!pick) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const r = await fetch("/api/me/departments/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: pick }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to select");
      setSelected(pick);
      setMsg("Department saved ✅");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-neutral-200/70" />
          <div className="h-10 rounded bg-neutral-200/70" />
        </div>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-neutral-600">
        No departments are open for selection right now.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      {msg && (
        <div className="mb-3 rounded bg-amber-50 text-amber-900 text-sm p-2">{msg}</div>
      )}

      <div className="mb-2 text-sm text-neutral-600">
        {selected ? (
          <>
            Current selection:{" "}
            <b className="text-neutral-800">{selected.toUpperCase()}</b>
          </>
        ) : (
          <>You haven’t selected a department yet.</>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Pick a department</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="" disabled>
              {openList.length ? "Select one…" : "No open departments"}
            </option>
            {openList.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name} ({d.slug.toUpperCase()})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Window respected • Only active & open departments appear.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={!pick || submitting}
          className="mt-2 md:mt-0 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save selection"}
        </button>
      </div>
    </div>
  );
}
