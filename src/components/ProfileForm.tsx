// src/components/ProfileForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ProfileUpdateInput } from "@/lib/schemas";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound,
  IdCard,
  Phone,
  BookOpenCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  NotebookPen,
  Rocket,
  Clock,
} from "lucide-react";

type ServerProfile = {
  admissionFormId: string;
  name: string;
  fatherName: string;
  motherName: string;
  sscGPA: number | "";
  hscGPA: number | "";
  phone: string;
  selectedDepartmentSlug?: string;
};

type Dept = {
  slug: string;
  name: string;
  windowStart: string | Date;
  windowEnd: string | Date;
  isActive: boolean;
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
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

  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [deptMsg, setDeptMsg] = useState<string | null>(null);
  const [deptBusy, setDeptBusy] = useState(false);

  // modal state
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me/profile", { cache: "no-store" });
        const data = await r.json();
        if (r.ok) {
          setForm(data.profile);
          if (data.profile?.selectedDepartmentSlug) {
            setSelectedDept(data.profile.selectedDepartmentSlug);
          }
        } else {
          setMsg(data.error || "Failed to load profile");
        }
      } catch {
        setMsg("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        const listRes = await fetch("/api/departments?activeOnly=true", {
          cache: "no-store",
        });
        const list = await listRes.json().catch(() => ({ departments: [] }));
        setDepartments(list.departments || []);
      } catch {
        /* noop */
      }
    })();
  }, []);

  const update = (patch: Partial<ServerProfile>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedTick(false);
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
      if (!r.ok)
        throw new Error(
          typeof data?.error === "string" ? data.error : "Save failed"
        );

      if (data.profile)
        setForm((prev: ServerProfile) => ({ ...prev, ...data.profile }));

      setMsg("Saved!");
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1600);
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  async function selectDept(slug: string) {
    if (!slug) return;
    const dept = departments.find((d) => d.slug === slug);
    if (!dept) return;

    const open =
      Date.now() >= new Date(dept.windowStart).getTime() &&
      Date.now() <= new Date(dept.windowEnd).getTime() &&
      dept.isActive;

    if (!open) {
      setDeptMsg("This department is currently closed.");
      return;
    }

    setDeptBusy(true);
    setDeptMsg(null);
    try {
      const r = await fetch("/api/me/departments/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Selection failed");
      setSelectedDept(slug);
      setDeptMsg(`Selected ${dept.name}`);
    } catch (e: any) {
      setDeptMsg(e?.message || "Selection failed");
    } finally {
      setDeptBusy(false);
    }
  }

  function openConfirm() {
    if (!selectedDept) {
      setDeptMsg("Please select a department first.");
      return;
    }
    setConfirmOpen(true);
  }

  function proceedToExam() {
    setConfirmOpen(false);
    window.location.href = "/exam";
  }

  /* -------------------------- PRESENTATION -------------------------- */

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border bg-white/60 p-6 backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_10%_0%,#dbeafe_0%,transparent_60%),radial-gradient(50%_35%_at_100%_10%,#fce7f3_0%,transparent_55%)]" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* glow background */}
      <div className="pointer-events-none absolute -inset-6 -z-10 opacity-70">
        <motion.div
          className="h-72 w-full rounded-[2rem] blur-3xl"
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(800px 300px at 20% 10%, rgba(99,102,241,.25), transparent 60%), radial-gradient(600px 260px at 90% 10%, rgba(236,72,153,.23), transparent 55%)",
          }}
        />
      </div>

      {/* Profile form */}
      <motion.form
        onSubmit={onSubmit}
        className="relative rounded-2xl border bg-white/70 p-6 shadow-xl backdrop-blur-md md:p-8"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <UserRound className="h-6 w-6 text-indigo-600" />
              Applicant Profile
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Keep your information accurate — it will be used for your
              admission review.
            </p>
          </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              key="msg"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                msg === "Saved!"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              }`}
            >
              {msg === "Saved!" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {msg}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FloatInput
            label="Admission Form ID"
            placeholder="AFID-2025-00123"
            value={form.admissionFormId ?? ""}
            onChange={(v) => update({ admissionFormId: v })}
            icon={<IdCard className="h-4 w-4 text-indigo-500" />}
            hint="Must be unique."
          />

          <FloatInput
            label="Phone (from sign-in)"
            value={form.phone}
            onChange={() => {}}
            disabled
            readOnly
            icon={<Phone className="h-4 w-4 text-sky-500" />}
          />

          <div className="md:col-span-2">
            <FloatInput
              label="Full Name"
              value={form.name}
              onChange={(v) => update({ name: v })}
              required
              icon={<UserRound className="h-4 w-4 text-fuchsia-500" />}
            />
          </div>

          <FloatInput
            label="Father's Name"
            value={form.fatherName}
            onChange={(v) => update({ fatherName: v })}
            required
            icon={<UserRound className="h-4 w-4 text-rose-500" />}
          />

          <FloatInput
            label="Mother's Name"
            value={form.motherName}
            onChange={(v) => update({ motherName: v })}
            required
            icon={<UserRound className="h-4 w-4 text-emerald-500" />}
          />

          <FloatInput
            label="SSC GPA"
            value={String(form.sscGPA)}
            onChange={(v) =>
              update({
                sscGPA: (v.replace(/[^0-9.]/g, "") as unknown) as number,
              })
            }
            placeholder="e.g., 4.83"
            inputMode="decimal"
            required
            icon={<BookOpenCheck className="h-4 w-4 text-indigo-500" />}
          />

          <FloatInput
            label="HSC GPA"
            value={String(form.hscGPA)}
            onChange={(v) =>
              update({
                hscGPA: (v.replace(/[^0-9.]/g, "") as unknown) as number,
              })
            }
            placeholder="e.g., 5.00"
            inputMode="decimal"
            required
            icon={<BookOpenCheck className="h-4 w-4 text-violet-500" />}
          />
        </div>

        {/* Save button */}
        <div className="mt-7 flex items-center gap-3">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-fuchsia-500/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60"
          >
            <span className="absolute inset-0 -z-10 rounded-xl bg-white/10 opacity-0 blur transition group-hover:opacity-30" />
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedTick ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : savedTick ? "Saved" : "Save changes"}
          </motion.button>

          <div className="text-xs text-neutral-500">
            Your changes are securely stored and auditable.
          </div>
        </div>
      </motion.form>

      {/* Department & Start Exam (dropdown + centered button) */}
      <section className="rounded-2xl border bg-white/80 backdrop-blur p-6 shadow space-y-4">
        <div className="mb-1 flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Department & Exam</h3>
        </div>

        {deptMsg && (
          <div className="rounded bg-amber-50 text-amber-900 p-2 text-sm">
            {deptMsg}
          </div>
        )}

        {/* Dropdown */}
        <div className="grid gap-2">
          <label className="text-sm text-neutral-600">Select Department</label>
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => {
                const slug = e.target.value;
                setSelectedDept(slug);
                void selectDept(slug);
              }}
              disabled={deptBusy || departments.length === 0}
              className="w-full appearance-none rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            >
              <option value="" disabled>
                {departments.length ? "Choose a department…" : "Loading…"}
              </option>
              {departments.map((d) => {
                const open =
                  Date.now() >= new Date(d.windowStart).getTime() &&
                  Date.now() <= new Date(d.windowEnd).getTime() &&
                  d.isActive;
                return (
                  <option key={d.slug} value={d.slug} disabled={!open}>
                    {d.name} ({d.slug.toUpperCase()}) {open ? "" : "— Closed"}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
              ▾
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Pick your department. Only open departments are selectable.
          </p>
        </div>

        {/* Start Exam — centered */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={openConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-white shadow hover:brightness-110"
          >
            <Rocket className="h-4 w-4" />
            Start Exam
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={proceedToExam}
      />
    </div>
  );
}

/* ------------------------------ UI SUBCOMPONENTS ------------------------------ */

function FloatInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  disabled,
  readOnly,
  inputMode,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
}) {
  return (
    <label className="group relative block">
      <div className="absolute inset-0 -z-10 rounded-2xl border border-transparent bg-gradient-to-br from-white/60 to-white/30 p-[1px] transition group-hover:shadow-md group-focus-within:shadow-md">
        <div className="h-full w-full rounded-2xl bg-white/80 backdrop-blur-sm" />
      </div>

      <div className="relative flex items-center">
        {icon && <span className="pointer-events-none mr-2">{icon}</span>}
        <input
          className={`peer h-12 w-full rounded-xl border border-neutral-200 bg-transparent px-3 pt-4 text-[15px] outline-none transition placeholder:text-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || " "}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          inputMode={inputMode}
        />
        <span className="pointer-events-none absolute left-[calc(0.75rem+1.25rem)] top-1.5 origin-left select-none text-[11px] font-medium uppercase tracking-wide text-neutral-500 transition peer-placeholder-shown:translate-y-[10px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:tracking-wide">
          {label}
        </span>
      </div>

      {hint && (
        <div className="mt-1 pl-6 text-xs text-neutral-500">{hint}</div>
      )}
    </label>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-56 rounded bg-neutral-200/70" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 rounded bg-neutral-200/70" />
            <div className="h-11 rounded-xl bg-neutral-200/70" />
          </div>
        ))}
      </div>
      <div className="h-10 w-36 rounded-xl bg-neutral-200/70" />
    </div>
  );
}

/* ------------------------------ MODAL ------------------------------ */

function ConfirmModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // simple focus set
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative z-10 w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h4 className="text-lg font-semibold">Start Exam</h4>
            </div>
            <p className="text-sm text-neutral-700">
              You are about to start your exam. The timer will begin immediately and
              you will have <span className="font-medium">60 minutes</span>. Continue?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
              >
                <Rocket className="h-4 w-4" />
                Start Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
