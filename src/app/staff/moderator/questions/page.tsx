// src/app/staff/moderator/upload/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

type Subject = { slug: string; name: string };
type Department = { slug: string; name: string; isActive: boolean };
type Banner = { tone: "success" | "error" | "warn"; text: string } | null;

export default function ModeratorQuestionsUpload() {
  // ---- form state
  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerInitial, setOwnerInitial] = useState("");

  // ---- subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectBusy, setSubjectBusy] = useState(false);

  // ---- departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [checkedDepts, setCheckedDepts] = useState<Record<string, boolean>>({});

  // ---- file
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- ui
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [subR, deptR] = await Promise.all([
          fetch("/api/subjects", { cache: "no-store" }),
          fetch("/api/staff/departments", { cache: "no-store" }),
        ]);
        const subJ = await subR.json();
        const deptJ = await deptR.json();
        if (subR.ok) setSubjects(subJ.subjects || []);
        if (deptR.ok) setDepartments(deptJ.departments || []);
      } catch {
        setBanner({ tone: "error", text: "Failed to load subjects/departments." });
      }
    })();
  }, []);

  const selectedDeptSlugs = useMemo(
    () => Object.entries(checkedDepts).filter(([, v]) => !!v).map(([slug]) => slug),
    [checkedDepts]
  );

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [subjects, subjectQuery]);

  const canSubmit =
    !!file &&
    !!ownerName.trim() &&
    !!ownerInitial.trim() &&
    selectedDeptSlugs.length > 0;

  function toggleSubject(slug: string) {
    setSelectedSubjects((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function addNewSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    setSubjectBusy(true);
    setBanner(null);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const r = await fetch("/api/staff/subjects/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: [{ slug, name }] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to add subject.");
      const res = await fetch("/api/subjects", { cache: "no-store" });
      const js = await res.json();
      setSubjects(js.subjects || []);
      setSelectedSubjects((prev) => Array.from(new Set([...prev, slug])));
      setNewSubjectName("");
      setBanner({ tone: "success", text: "Subject added." });
    } catch (e: any) {
      setBanner({ tone: "error", text: e?.message || "Failed to add subject." });
    } finally {
      setSubjectBusy(false);
    }
  }

  // -------- Dropzone helpers
  function isAllowedFile(name = "") {
    const lower = name.toLowerCase();
    return [".xlsx", ".xls", ".csv"].some((ext) => lower.endsWith(ext));
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && isAllowedFile(f.name)) setFile(f);
  }
  function onPaste(e: React.ClipboardEvent) {
    const f = e.clipboardData.files?.[0];
    if (f && isAllowedFile(f.name)) setFile(f);
  }
  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!canSubmit) {
      setBanner({ tone: "warn", text: "Fill all required fields to continue." });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const fd = new FormData();
      fd.set("file", file as File);
      fd.set("title", title || "Untitled");
      fd.set("ownerName", ownerName);
      fd.set("ownerInitial", ownerInitial);
      fd.set("subjects", JSON.stringify(selectedSubjects));
      fd.set("departments", JSON.stringify(selectedDeptSlugs));

      const r = await fetch("/api/moderator/questions/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Upload failed.");

      setBanner({ tone: "success", text: `Uploaded for review • ${j.count} questions.` });
      setFile(null);
    } catch (e: any) {
      setBanner({ tone: "error", text: e?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(80%_50%_at_10%_0%,#dbeafe_0%,transparent_60%),radial-gradient(70%_45%_at_120%_10%,#f5d0fe_0%,transparent_55%)] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-md shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_10%_-10%,rgba(59,130,246,.12),transparent_60%),radial-gradient(600px_240px_at_110%_-10%,rgba(236,72,153,.12),transparent_55%)]" />
          <div className="relative p-5 md:p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Upload Question Sheet <span className="ml-2 text-sm font-normal text-neutral-500">(.xlsx / .csv)</span>
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Attach subjects, choose applicable departments, and drop your file.
              </p>
            </div>
            <Link
              href="/staff/moderator"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div
            className={`rounded-xl border px-4 py-2 text-sm ${
              banner.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : banner.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {banner.tone === "success" ? (
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> {banner.text}
              </span>
            ) : banner.tone === "error" ? (
              <span className="inline-flex items-center gap-2">
                <XCircle className="h-4 w-4" /> {banner.text}
              </span>
            ) : (
              banner.text
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Stat title="Subjects" value={selectedSubjects.length} hint="Selected" />
          <Stat title="Departments" value={selectedDeptSlugs.length} hint="Marked" />
          <Stat title="Upload" value={file ? 1 : 0} hint={file ? file.name : "No file"} icon={<FileSpreadsheet className="h-5 w-5" />} />
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur space-y-6">
          {/* Meta */}
          <section className="grid gap-4 md:grid-cols-3">
            <Field label="Title">
              <input
                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unit Test – 01"
              />
            </Field>
            <Field label="Name (Owner)">
              <input
                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Rahim Uddin"
                required
              />
            </Field>
            <Field label="Initial">
              <input
                className="w-full rounded-xl border px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={ownerInitial}
                onChange={(e) => setOwnerInitial(e.target.value)}
                placeholder="e.g., RU"
                required
              />
            </Field>
          </section>

          {/* Subjects */}
          <section className="space-y-3">
            <Header label="Subjects" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  className="w-56 rounded-xl border pl-8 pr-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Search subjects…"
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <input
                  className="w-64 rounded-xl border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Add new subject (name)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addNewSubject}
                  disabled={subjectBusy || !newSubjectName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {subjectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredSubjects.map((s) => {
                const active = selectedSubjects.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggleSubject(s.slug)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active ? "bg-black text-white shadow-sm" : "bg-white hover:bg-neutral-50"
                    }`}
                    title={s.slug}
                  >
                    {s.name}
                  </button>
                );
              })}
              {filteredSubjects.length === 0 && (
                <div className="text-sm text-neutral-500">No subjects match your search.</div>
              )}
            </div>
          </section>

          {/* Departments */}
          <section className="space-y-3">
            <Header label="Applicable Departments" />
            <ul className="grid gap-2">
              {departments.map((d) => {
                const checked = !!checkedDepts[d.slug];
                return (
                  <li key={d.slug} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {d.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-neutral-200">
                          Inactive
                        </span>
                      )}
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-neutral-500">{d.slug.toUpperCase()}</div>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => setCheckedDepts((p) => ({ ...p, [d.slug]: e.target.checked }))}
                      />
                      {checked ? "Marked" : "Unmarked"}
                    </label>
                  </li>
                );
              })}
              {departments.length === 0 && (
                <li className="rounded-xl border bg-white px-3 py-2.5 text-sm text-neutral-500">No departments found.</li>
              )}
            </ul>
          </section>

          {/* Dropzone (now shows current file chip) */}
          <section className="space-y-2">
            <Header label="Upload file" />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onPaste={onPaste}
              className={`rounded-2xl border-2 border-dashed p-5 transition ${
                dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-neutral-200"
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <CloudUpload className="mb-2 h-7 w-7 text-neutral-500" />
                <p className="text-sm text-neutral-700">
                  {file ? (
                    <>
                      Drop here to <b>replace</b>, or{" "}
                      <button
                        type="button"
                        className="text-indigo-600 underline-offset-2 hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                      .
                    </>
                  ) : (
                    <>
                      Drag & drop your <b>.xlsx</b>, <b>.xls</b>, or <b>.csv</b> here, or{" "}
                      <button
                        type="button"
                        className="text-indigo-600 underline-offset-2 hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                      .
                    </>
                  )}
                </p>

                {/* current file pill */}
                {file && (
                  <div className="mt-3 inline-flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm">
                    <span className="truncate max-w-[52ch]">{file.name}</span>
                    <span className="text-xs text-neutral-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border hover:bg-neutral-50"
                      title="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Columns (header row required): <b>SL, Question Type, Question, A, B, C, D, Answer</b>.
              <br />
              <i>SL</i> is only for upload ordering — questions may be randomized later.
            </p>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-neutral-500">Ensure subjects, departments and file are selected.</div>
            <button
              onClick={submit}
              disabled={!canSubmit || busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:brightness-110 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
              {busy ? "Uploading…" : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- UI subcomponents ---------------- */

function Stat({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">{title}</div>
        {icon ?? <></>}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-neutral-500 truncate">{hint}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-neutral-700">{label}</div>
      {children}
    </label>
  );
}

function Header({ label }: { label: string }) {
  return <h3 className="text-sm font-semibold text-neutral-800">{label}</h3>;
}
