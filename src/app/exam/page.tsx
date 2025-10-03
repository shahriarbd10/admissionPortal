"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ClientItem =
  | { i: number; id: string; type: "MCQ" | "TF"; q: string; options: string[]; hint?: never }
  | { i: number; id: string; type: "FIB"; q: string; hint?: string | null };

type StartPayload = {
  ok: boolean;
  attemptId: string;
  endAt: string;
  paper: ClientItem[];
  saved: Record<number, number | string | null>;
};

export default function ExamPage() {
  const [attemptId, setAttemptId] = useState("");
  const [paper, setPaper] = useState<ClientItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number | string | null>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const [endAt, setEndAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);

  const [showCaution, setShowCaution] = useState(true);
  const [starting, setStarting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<Record<number, number | string | null>>({});
  const unloadHandlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  // Back button behavior: reload instead of navigating back
  useEffect(() => {
    if (!attemptId) return;
    const onPop = () => location.reload();
    window.history.pushState(null, "", location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [attemptId]);

  // Warn on page unload while in exam
  useEffect(() => {
    if (!attemptId) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    unloadHandlerRef.current = onBefore;
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [attemptId]);

  // Tick timer
  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => setRemaining(Math.max(0, endAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [endAt]);

  // Auto-submit on time over (no confirm)
  useEffect(() => {
    if (attemptId && endAt && Date.now() >= endAt) {
      void doSubmit(); // bypass confirm when time is over
    }
  }, [attemptId, endAt, remaining]);

  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void autosave();
    }, 1200);
  }

  async function autosave() {
    if (!attemptId) return;
    const diff: Record<number, number | string | null> = {};
    for (const [k, v] of Object.entries(answers)) {
      const n = Number(k);
      if (lastSaved.current[n] !== v) diff[n] = v;
    }
    if (Object.keys(diff).length === 0) return;
    await fetch("/api/exam/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers: diff }),
    });
    lastSaved.current = { ...lastSaved.current, ...diff };
  }

  async function startExamNow() {
    try {
      setStarting(true);
      const r = await fetch("/api/exam/start", { method: "POST" });
      const data: StartPayload = await r.json();
      if (!r.ok) throw new Error((data as any)?.error || "Failed to start");

      setAttemptId(data.attemptId);
      setPaper(data.paper);
      setAnswers(data.saved || {});
      lastSaved.current = data.saved || {};

      const ea = new Date(data.endAt).getTime();
      setEndAt(ea);
      setRemaining(Math.max(0, ea - Date.now()));
      setShowCaution(false);
    } catch (e: any) {
      setMsg(e?.message || "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  function openConfirm() {
    if (!attemptId) return;
    setShowConfirm(true);
  }

  async function doSubmit() {
    try {
      setSubmitting(true);
      await autosave();
      const r = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Submit failed");

      // Clean unload guard
      if (unloadHandlerRef.current) {
        window.removeEventListener("beforeunload", unloadHandlerRef.current);
      }

      setShowConfirm(false);
      setShowSuccess(true);
      setMsg(null);

      setTimeout(() => {
        window.location.href = "/profile";
      }, 1400);
    } catch (e: any) {
      setMsg(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient premium background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_10%_10%,rgba(99,102,241,0.15),transparent_60%),radial-gradient(45%_35%_at_90%_8%,rgba(244,114,182,0.14),transparent_60%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_60%)] bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
              Department Exam
            </h1>
            <p className="text-sm text-neutral-600">50 questions • 60 minutes</p>
          </div>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-700 px-4 py-2 text-white shadow-lg"
          >
            <span className="text-xs opacity-80">Time left</span>
            <span className="font-mono text-sm md:text-base">
              {attemptId
                ? `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
                : "— — : — —"}
            </span>
          </motion.div>
        </div>

        {/* Paper */}
        <form
          className="space-y-4"
          onChange={scheduleAutosave}
          onSubmit={(e) => {
            e.preventDefault();
            openConfirm();
          }}
        >
          {paper.map((it) => (
            <motion.div
              key={it.i}
              className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] ring-1 ring-black/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-2 text-xs text-neutral-500">Question {it.i + 1}</div>
              <div className="mb-3 font-medium leading-6 text-neutral-900">{it.q}</div>

              {it.type !== "FIB" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {it.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                        answers[it.i] === idx
                          ? "border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-100"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${it.i}`}
                        checked={answers[it.i] === idx}
                        onChange={() => setAnswers((p) => ({ ...p, [it.i]: idx }))}
                      />
                      <span className="text-neutral-800">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none transition focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Type your answer"
                    value={typeof answers[it.i] === "string" ? (answers[it.i] as string) : ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [it.i]: e.target.value }))}
                  />
                  {it.hint && (
                    <div className="text-xs text-neutral-500">Hint: {it.hint}</div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {attemptId && paper.length > 0 && (
            <div className="sticky bottom-3 flex justify-end">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-6 py-2.5 text-white shadow-lg shadow-fuchsia-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                type="submit"
              >
                Submit
              </motion.button>
            </div>
          )}
        </form>

        {msg && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {msg}
          </div>
        )}
      </div>

      {/* Entry caution modal */}
      <AnimatePresence>
        {showCaution && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Before you begin</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                <li>Do not refresh or close the tab during the exam.</li>
                <li>Back button will reload this page (no going back).</li>
                <li>Each answer is autosaved. You have 60 minutes.</li>
                <li>No marks will be shown after submission.</li>
              </ul>
              <div className="mt-5 flex justify-end gap-2">
                <a href="/profile" className="rounded-xl border px-4 py-2 text-sm">
                  Cancel
                </a>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startExamNow}
                  disabled={starting}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {starting ? "Starting…" : "I understand, start now"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm submission modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold">Confirm Submission</h3>
              <p className="mt-2 text-sm text-neutral-700">
                Are you sure you want to submit your answers? You won’t be able to change them
                after submitting.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border px-4 py-2 text-sm"
                  disabled={submitting}
                >
                  Review Again
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={doSubmit}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Yes, Submit"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success modal with tick animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl text-center"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <motion.svg viewBox="0 0 52 52" className="mx-auto h-16 w-16 text-emerald-500">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <motion.path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  d="M16 27 L23 34 L36 20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeInOut" }}
                />
              </motion.svg>

              <h4 className="mt-4 text-lg font-semibold">Successfully Submitted</h4>
              <p className="mt-1 text-sm text-neutral-600">Your submission has been recorded.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
