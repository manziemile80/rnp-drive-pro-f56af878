import questionsData from "@/data/questions.json";
import type { Lang } from "./i18n";

export interface RawQuestion {
  number: number;
  stem_rw: string;
  options_rw: string[];
  correct: "a" | "b" | "c" | "d";
  has_image: boolean;
  translations?: Partial<Record<Exclude<Lang, "rw">, { stem: string; options: string[] }>>;
  explanation?: string;
}

export interface ExamQuestion {
  id: number;
  stem: string;
  options: { letter: "a" | "b" | "c" | "d"; text: string; originalLetter: "a" | "b" | "c" | "d" }[];
  correctLetter: "a" | "b" | "c" | "d"; // in shuffled space
  originalCorrect: "a" | "b" | "c" | "d";
  hasImage: boolean;
  explanation?: string;
  fellBack: boolean;
}

export interface ExamState {
  id: string;
  lang: Lang;
  startedAt: number;
  durationMs: number;
  questions: ExamQuestion[];
  answers: Record<number, "a" | "b" | "c" | "d" | null>;
  currentIndex: number;
  submitted: boolean;
  submittedAt?: number;
}

export interface ExamResult {
  id: string;
  finishedAt: number;
  lang: Lang;
  score: number;
  total: number;
  timeUsedMs: number;
  passed: boolean;
  answers: Record<number, "a" | "b" | "c" | "d" | null>;
  questions: ExamQuestion[];
}

const LS_BANK = "rwexam.bank.v1";
const LS_CURRENT = "rwexam.current.v1";
const LS_HISTORY = "rwexam.history.v1";
const LS_LANG = "rwexam.lang.v1";
const LS_THEME = "rwexam.theme.v1";
const LS_ADMIN = "rwexam.admin.v1";

export const EXAM_LENGTH = 20;
export const EXAM_MINUTES = 20;
export const PASS_MARK = 12;
export const ADMIN_PASSWORD = "Manzi*182#";

export function loadBank(): RawQuestion[] {
  if (typeof window === "undefined") return questionsData as RawQuestion[];
  const raw = localStorage.getItem(LS_BANK);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through */
    }
  }
  return questionsData as RawQuestion[];
}

export function saveBank(bank: RawQuestion[]) {
  localStorage.setItem(LS_BANK, JSON.stringify(bank));
}

export function resetBank() {
  localStorage.removeItem(LS_BANK);
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "rw";
  return (localStorage.getItem(LS_LANG) as Lang) || "rw";
}
export function setLang(l: Lang) {
  localStorage.setItem(LS_LANG, l);
}

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(LS_THEME) as "light" | "dark") || "light";
}
export function setTheme(t: "light" | "dark") {
  localStorage.setItem(LS_THEME, t);
  if (t === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LS_ADMIN) === "1";
}
export function setAdmin(v: boolean) {
  if (v) sessionStorage.setItem(LS_ADMIN, "1");
  else sessionStorage.removeItem(LS_ADMIN);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function localizeQuestion(q: RawQuestion, lang: Lang): { stem: string; options: string[]; fellBack: boolean } {
  if (lang === "rw") return { stem: q.stem_rw, options: q.options_rw, fellBack: false };
  const tr = q.translations?.[lang];
  if (tr) return { stem: tr.stem, options: tr.options, fellBack: false };
  return { stem: q.stem_rw, options: q.options_rw, fellBack: true };
}

export function buildExam(lang: Lang): ExamState {
  const bank = loadBank();
  const picked = shuffle(bank).slice(0, Math.min(EXAM_LENGTH, bank.length));
  const questions: ExamQuestion[] = picked.map((q) => {
    const loc = localizeQuestion(q, lang);
    const letters: ("a" | "b" | "c" | "d")[] = ["a", "b", "c", "d"];
    const pairs = letters.map((l, i) => ({ originalLetter: l, text: loc.options[i] }));
    const shuffled = shuffle(pairs);
    const opts = shuffled.map((p, i) => ({
      letter: letters[i],
      text: p.text,
      originalLetter: p.originalLetter,
    }));
    const correctShuffled = opts.find((o) => o.originalLetter === q.correct)!.letter;
    return {
      id: q.number,
      stem: loc.stem,
      options: opts,
      correctLetter: correctShuffled,
      originalCorrect: q.correct,
      hasImage: q.has_image,
      explanation: q.explanation,
      fellBack: loc.fellBack,
    };
  });
  const state: ExamState = {
    id: `exam-${Date.now()}`,
    lang,
    startedAt: Date.now(),
    durationMs: EXAM_MINUTES * 60 * 1000,
    questions,
    answers: {},
    currentIndex: 0,
    submitted: false,
  };
  saveCurrent(state);
  return state;
}

export function getCurrent(): ExamState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_CURRENT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function saveCurrent(s: ExamState) {
  localStorage.setItem(LS_CURRENT, JSON.stringify(s));
}
export function clearCurrent() {
  localStorage.removeItem(LS_CURRENT);
}

export function submitExam(state: ExamState): ExamResult {
  const total = state.questions.length;
  let score = 0;
  for (const q of state.questions) {
    if (state.answers[q.id] === q.correctLetter) score++;
  }
  const finishedAt = Date.now();
  const result: ExamResult = {
    id: state.id,
    finishedAt,
    lang: state.lang,
    score,
    total,
    timeUsedMs: Math.min(finishedAt - state.startedAt, state.durationMs),
    passed: score >= PASS_MARK,
    answers: state.answers,
    questions: state.questions,
  };
  const history = getHistory();
  history.unshift(result);
  localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 100)));
  clearCurrent();
  return result;
}

export function getHistory(): ExamResult[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getLastResult(): ExamResult | null {
  return getHistory()[0] || null;
}

export function clearHistory() {
  localStorage.removeItem(LS_HISTORY);
}

export function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function questionStats() {
  const history = getHistory();
  const counts: Record<number, { seen: number; wrong: number; correct: number }> = {};
  for (const r of history) {
    for (const q of r.questions) {
      if (!counts[q.id]) counts[q.id] = { seen: 0, wrong: 0, correct: 0 };
      counts[q.id].seen++;
      const ans = r.answers[q.id];
      if (ans === q.correctLetter) counts[q.id].correct++;
      else if (ans) counts[q.id].wrong++;
    }
  }
  return counts;
}