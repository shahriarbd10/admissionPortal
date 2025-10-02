"use client";

import { useEffect, useState } from "react";
import type { ProfileUpdateInput } from "@/lib/schemas";

type ServerProfile = {
  admissionFormId: string;
  name: string;
  fatherName: string;
  motherName: string;
  sscGPA: number | "" ;
  hscGPA: number | "" ;
  phone: string;
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<ServerProfile>({
    admissionFormId: "",
    name: "",
    fatherName: "",
    motherName: "",
    sscGPA: "",
    hscGPA: "",
    phone: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me/profile", { cache: "no-store" });
        const data = await r.json();
        if (r.ok) setForm(data.profile);
        else setMsg(data.error || "Failed to load profile");
      } catch {
        setMsg("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (patch: Partial<ServerProfile>) => setForm(prev => ({ ...prev, ...patch }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: ProfileUpdateInput = {
        admissionFormId: form.admissionFormId?.trim() || undefined,
        name: form.name,
        fatherName: form.fatherName,
        motherName: form.motherName,
        sscGPA: Number(form.sscGPA),
        hscGPA: Number(form.hscGPA),
      };

      const r = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(typeof data?.error === "string" ? data.error : "Save failed");
      setMsg("Saved!");
      // refresh with what server stored
      if (data.profile) setForm((prev) => ({ ...prev, ...data.profile }));
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border bg-white p-4">Loading profile…</div>;
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 space-y-4">
      {msg && <div className="rounded bg-amber-50 text-amber-900 text-sm p-2">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Admission Form ID</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="AFID-2025-00123"
            value={form.admissionFormId ?? ""}
            onChange={(e) => update({ admissionFormId: e.target.value })}
          />
          <p className="text-xs text-neutral-500 mt-1">Must be unique.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Phone (from sign-in)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2 bg-gray-50"
            value={form.phone}
            disabled
            readOnly
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Full Name</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Father's Name</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.fatherName}
            onChange={(e) => update({ fatherName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mother's Name</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.motherName}
            onChange={(e) => update({ motherName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">SSC GPA</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.sscGPA}
            onChange={(e) => update({ sscGPA: e.target.value.replace(/[^0-9.]/g, "") as unknown as number })}
            inputMode="decimal"
            placeholder="e.g., 4.83"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">HSC GPA</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.hscGPA}
            onChange={(e) => update({ hscGPA: e.target.value.replace(/[^0-9.]/g, "") as unknown as number })}
            inputMode="decimal"
            placeholder="e.g., 5.00"
            required
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
