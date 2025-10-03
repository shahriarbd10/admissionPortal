// src/data/sampleQuestions.ts

export type MCQ = {
  id: string;
  type: "MCQ";
  q: string;
  options: string[];
  correctIndex: number;
  hint?: never;
};

export type TF = {
  id: string;
  type: "TF";
  q: string;
  options: ["True", "False"];
  correctIndex: 0 | 1;
  hint?: never;
};

export type FIB = {
  id: string;
  type: "FIB";
  q: string;
  correctText: string;
  hint?: string | null;
};

export type Question = MCQ | TF | FIB;

function pick<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

// --- Demo banks ---
const CSE_MCQ: MCQ[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `cse-mcq-${i + 1}`,
  type: "MCQ",
  q: `Which data structure best fits use-case #${i + 1}?`,
  options: ["Stack", "Queue", "Tree", "Graph"],
  correctIndex: (i % 4) as 0 | 1 | 2 | 3,
}));

const CSE_TF: TF[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `cse-tf-${i + 1}`,
  type: "TF",
  q: `Sorting algorithm #${i + 1} is stable?`,
  options: ["True", "False"],
  correctIndex: (i % 2) as 0 | 1,
}));

const CSE_FIB: FIB[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `cse-fib-${i + 1}`,
  type: "FIB",
  q: `Fill in the blank: HTTP status for 'Not Found' is _____.`,
  correctText: "404",
  hint: "3 digits",
}));

const SIMPLE_MCQ: MCQ[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `gen-mcq-${i + 1}`,
  type: "MCQ",
  q: `General question #${i + 1}`,
  options: ["A", "B", "C", "D"],
  correctIndex: (i % 4) as 0 | 1 | 2 | 3,
}));

export function generateCSE(): Question[] {
  // 50 questions: 30 MCQ + 10 TF + 10 FIB
  return [
    ...pick(CSE_MCQ, 30),
    ...pick(CSE_TF, 10),
    ...pick(CSE_FIB, 10),
  ];
}

export function generateSimple(dept: string): Question[] {
  // Any non-CSE department gets plain 50 MCQ
  return pick(SIMPLE_MCQ, 50);
}
