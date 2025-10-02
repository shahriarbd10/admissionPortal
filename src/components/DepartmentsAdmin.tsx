"use client";

import { useMemo, useState } from "react";

type Dept = {
  slug: string;
  name: string;
  windowStart: string | Date;
  windowEnd: string | Date;
  isActive: boolean;
  capacity?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

function toLocalDT(dt: string | Date) {
  const d = new Date(dt);
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DepartmentsAdmin({ initialItems }: { initialItems: Dept[] }) {
  const [items, setItems] = useState<Dept[]>(initialItems);
  const [msg, setMsg] = useState<string | null>(null);

  // Form state for create / edit
  const emptyForm: Dept = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      slug: "",
      name: "",
      windowStart: now.toISOString(),
      windowEnd: end.toISOString(),
      isActive: true,
      capacity: 0,
    };
  }, []);

  const [form, setForm] = useState<Dept>(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      windowStart: new Date().toISOString(),
      windowEnd: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    setEditingSlug(null);
  };

  const submit = async () => {
    try {
      setMsg(null);
      const payload = {
        ...form,
        // ensure ISO strings
        windowStart: new Date(form.windowStart).toISOString(),
        windowEnd: new Date(form.windowEnd).toISOString(),
        capacity: form.capacity ?? 0,
        isActive: !!form.isActive,
      };

      let r: Response;
      if (editingSlug) {
        r = await fetch(`/api/admin/departments/${encodeURIComponent(editingSlug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        r = await fetch(`/api/admin/departments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Save failed");

      // reload list
      const listRes = await fetch(`/api/admin/departments`, { cache: "no-store" });
      const list = await listRes.json();
      setItems(list.departments || []);
      resetForm();
      setMsg("Saved ✅");
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    }
  };

  const editItem = (d: Dept) => {
    setEditingSlug(d.slug);
    setForm({
      slug: d.slug,
      name: d.name,
      windowStart: new Date(d.windowStart).toISOString(),
      windowEnd: new Date(d.windowEnd).toISOString(),
      isActive: d.isActive,
      capacity: d.capacity ?? 0,
    });
  };

  const remove = async (slug: string) => {
    if (!confirm(`Delete ${slug}?`)) return;
    const r = await fetch(`/api/admin/departments/${encodeURIComponent(slug)}`, { method: "DELETE" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(data?.error || "Delete failed");
      return;
    }
    setItems(items.filter((x) => x.slug !== slug));
    if (editingSlug === slug) resetForm();
  };

  return (
    <div className="space-y-6">
      {msg && <div className="rounded bg-amber-50 text-amber-900 text-sm p-2">{msg}</div>}

      {/* Form */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-lg font-semibold">{editingSlug ? "Edit Department" : "Add Department"}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="cse"
              disabled={!!editingSlug} // don't allow changing slug on edit
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Computer Science & Engineering"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Window Start</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded px-3 py-2"
              value={toLocalDT(form.windowStart)}
              onChange={(e) => setForm({ ...form, windowStart: new Date(e.target.value).toISOString() })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Window End</label>
            <input
              type="datetime-local"
              className="mt-1 w-full border rounded px-3 py-2"
              value={toLocalDT(form.windowEnd)}
              onChange={(e) => setForm({ ...form, windowEnd: new Date(e.target.value).toISOString() })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Capacity</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2"
              value={form.capacity ?? 0}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={submit} className="px-4 py-2 rounded bg-black text-white">
            {editingSlug ? "Update" : "Create"}
          </button>
          {editingSlug && (
            <button onClick={resetForm} className="px-4 py-2 rounded border">Cancel</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-white p-4">
        <div className="font-semibold mb-3">Existing</div>
        <ul className="grid gap-2">
          {items.map((d) => (
            <li key={d.slug} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{d.name} <span className="text-xs text-neutral-500">({d.slug})</span></div>
                <div className="text-xs text-neutral-600">
                  {new Date(d.windowStart).toLocaleString()} → {new Date(d.windowEnd).toLocaleString()} •{" "}
                  {d.isActive ? "Active" : "Inactive"}{typeof d.capacity === "number" ? ` • Cap ${d.capacity}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => editItem(d)}>Edit</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => remove(d.slug)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-neutral-500">No departments yet.</li>}
        </ul>
      </div>
    </div>
  );
}
