"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const [showCaution, setShowCaution] = useState(true); // show modal on enter
  const [starting, setStarting] = useState(false);

  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<Record<number, number | string | null>>({});

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  // Back button behavior: reload instead of navigating back
  useEffect(() => {
    if (!attemptId) return;
    const onPop = () => {
      location.reload();
    };
    window.history.pushState(null, "", location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [attemptId]);

  // Warn on page unload while in exam
  useEffect(() => {
    if (!attemptId) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // show native prompt
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [attemptId]);

  // Tick timer
  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => {
      setRemaining(Math.max(0, endAt - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [endAt]);

  useEffect(() => {
    if (attemptId && endAt && Date.now() >= endAt) {
      void submit();
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

  async function submit() {
    try {
      await autosave();
      const r = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Submit failed");

      // Clean unload guard
      window.removeEventListener("beforeunload", () => {});
      setMsg("Your submission has been recorded. Results will be published by admin.");
      // redirect to profile or a confirmation screen
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1200);
    } catch (e: any) {
      setMsg(e?.message || "Submit failed");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Exam</h1>
            <p className="text-sm text-neutral-600">50 questions • 60 minutes</p>
          </div>

          <div className="rounded-2xl bg-black text-white px-4 py-2 font-mono">
            {attemptId ? (
              <>Time left: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</>
            ) : (
              "Ready"
            )}
          </div>
        </div>

        {/* Paper */}
        <form
          className="space-y-4"
          onChange={scheduleAutosave}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {paper.map((it) => (
            <motion.div
              key={it.i}
              className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-2 text-xs text-neutral-500">Question {it.i + 1}</div>
              <div className="mb-3 font-medium leading-6">{it.q}</div>

              {it.type !== "FIB" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {it.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                        answers[it.i] === idx ? "border-indigo-500 bg-indigo-50/60" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${it.i}`}
                        checked={answers[it.i] === idx}
                        onChange={() =>
                          setAnswers((p) => ({ ...p, [it.i]: idx }))
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="Type your answer"
                    value={typeof answers[it.i] === "string" ? (answers[it.i] as string) : ""}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [it.i]: e.target.value }))
                    }
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
              <button
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2 text-white shadow"
                type="submit"
              >
                Submit
              </button>
            </div>
          )}
        </form>

        {msg && (
          <div className="rounded bg-amber-50 p-2 text-sm text-amber-900">{msg}</div>
        )}
      </div>

      {/* Caution modal */}
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
                <a
                  href="/profile"
                  className="rounded border px-4 py-2 text-sm"
                >
                  Cancel
                </a>
                <button
                  onClick={startExamNow}
                  disabled={starting}
                  className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {starting ? "Starting…" : "I understand, start now"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
