import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, Clock, Info } from "lucide-react";
import {
  ExamState,
  buildExam,
  formatTime,
  getCurrent,
  getLang,
  saveCurrent,
  submitExam,
} from "@/lib/exam/store";
import { t } from "@/lib/exam/i18n";
import { getQuestionImage } from "@/lib/exam/question-images";

export const Route = createFileRoute("/_authenticated/exam")({
  head: () => ({ meta: [{ title: "Exam in progress · Rwanda Provisional Licence" }, { name: "robots", content: "noindex" }] }),
  component: ExamPage,
});

function ExamPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ExamState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [warned5, setW5] = useState(false);
  const [warned1, setW1] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let s = getCurrent();
    if (!s || s.submitted) {
      s = buildExam(getLang());
    }
    setState(s);
  }, []);

  const finish = useCallback(
    (auto: boolean) => {
      const s = getCurrent();
      if (!s) return;
      const result = submitExam(s);
      navigate({ to: "/result", search: { auto: auto ? 1 : 0 } as never });
      return result;
    },
    [navigate],
  );

  useEffect(() => {
    if (!state) return;
    const tick = () => {
      const elapsed = Date.now() - state.startedAt;
      const rem = state.durationMs - elapsed;
      setRemaining(rem);
      if (rem <= 0) {
        finish(true);
      } else if (rem <= 60_000 && !warned1) {
        setW1(true);
        setBanner(t("warn_1min", state.lang));
        setTimeout(() => setBanner(null), 5000);
      } else if (rem <= 5 * 60_000 && !warned5) {
        setW5(true);
        setBanner(t("warn_5min", state.lang));
        setTimeout(() => setBanner(null), 5000);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state, warned5, warned1, finish]);

  const setAnswer = (qid: number, letter: "a" | "b" | "c" | "d") => {
    if (!state) return;
    const next = { ...state, answers: { ...state.answers, [qid]: letter } };
    setState(next);
    saveCurrent(next);
  };

  const goto = (idx: number) => {
    if (!state) return;
    const clamped = Math.max(0, Math.min(state.questions.length - 1, idx));
    const next = { ...state, currentIndex: clamped };
    setState(next);
    saveCurrent(next);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const q = state.questions[state.currentIndex];
      if (!q) return;
      if (["1", "a", "A"].includes(e.key)) setAnswer(q.id, "a");
      else if (["2", "b", "B"].includes(e.key)) setAnswer(q.id, "b");
      else if (["3", "c", "C"].includes(e.key)) setAnswer(q.id, "c");
      else if (["4", "d", "D"].includes(e.key)) setAnswer(q.id, "d");
      else if (e.key === "ArrowLeft") goto(state.currentIndex - 1);
      else if (e.key === "ArrowRight") goto(state.currentIndex + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  if (!state) return <div className="p-10 text-center text-muted-foreground">Loading exam…</div>;

  const q = state.questions[state.currentIndex];
  const answered = state.answers[q.id];
  const answeredCount = state.questions.filter((qq) => state.answers[qq.id]).length;
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;
  const lowTime = remaining <= 5 * 60_000;
  const critTime = remaining <= 60_000;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Sticky header row */}
      <div className="sticky top-[72px] z-30 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4 sm:shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("question", state.lang)} {state.currentIndex + 1} {t("of", state.lang)} {state.questions.length}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--gradient-gold)" }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {answeredCount}/{state.questions.length} answered
            </div>
          </div>
          <div
            className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 font-mono text-lg font-bold ${
              critTime
                ? "animate-pulse bg-destructive text-destructive-foreground"
                : lowTime
                  ? "bg-[oklch(0.82_0.15_84)]/20 text-[oklch(0.4_0.14_78)]"
                  : "bg-primary text-primary-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
        </div>
      </div>

      {banner && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[oklch(0.82_0.15_84)]/40 bg-[oklch(0.82_0.15_84)]/10 px-4 py-2 text-sm font-medium text-[oklch(0.4_0.14_78)]">
          <AlertTriangle className="h-4 w-4" />
          {banner}
        </div>
      )}

      {/* Question */}
      <div className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
        {q.fellBack && (
          <div className="mb-3 flex items-start gap-2 rounded-md bg-secondary p-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t("no_translation", state.lang)} <em>({state.lang === "rw" ? "" : "Kinyarwanda"})</em></span>
          </div>
        )}
        {q.hasImage && (() => {
          const src = getQuestionImage(q.id);
          return src ? (
            <div className="mb-4 overflow-hidden rounded-md border bg-white">
              <img src={src} alt={`Road sign for question ${q.id}`} className="mx-auto max-h-[420px] w-full object-contain" />
              <div className="border-t bg-muted/60 px-3 py-1.5 text-[10px] text-muted-foreground">
                📷 Reference image from the official Rwanda Provisional Licence PDF (page context shown).
              </div>
            </div>
          ) : (
            <div className="mb-3 rounded-md border border-dashed bg-muted/60 p-3 text-xs text-muted-foreground">
              📷 This question references a road sign image (not available).
            </div>
          );
        })()}
        <h2 className="text-base font-semibold leading-relaxed sm:text-lg">
          <span className="mr-2 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">Q{q.id}</span>
          {q.stem}
        </h2>

        <div className="mt-6 space-y-2">
          {q.options.map((o, i) => {
            const selected = answered === o.letter;
            return (
              <button
                key={o.letter}
                onClick={() => setAnswer(q.id, o.letter)}
                className={`group flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {o.letter.toUpperCase()}
                </span>
                <span className="pt-0.5 text-sm sm:text-[15px]">{o.text}</span>
                <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                  Press {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <button
          onClick={() => goto(state.currentIndex - 1)}
          disabled={state.currentIndex === 0}
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> {t("previous", state.lang)}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
          >
            <Flag className="h-4 w-4" /> {t("finish", state.lang)}
          </button>
          <button
            onClick={() => goto(state.currentIndex + 1)}
            disabled={state.currentIndex === state.questions.length - 1}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-40"
          >
            {t("next", state.lang)} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question grid */}
      <div className="mt-8 rounded-lg border bg-card p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigate</div>
        <div className="grid grid-cols-10 gap-1.5">
          {state.questions.map((qq, i) => {
            const isCur = i === state.currentIndex;
            const isAns = !!state.answers[qq.id];
            return (
              <button
                key={qq.id}
                onClick={() => goto(i)}
                className={`aspect-square rounded text-xs font-semibold transition ${
                  isCur
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                    : isAns
                      ? "bg-[oklch(0.82_0.15_84)]/25 text-[oklch(0.35_0.13_78)] hover:bg-[oklch(0.82_0.15_84)]/40"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold">{t("finish", state.lang)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("confirm_finish", state.lang)}</p>
            <p className="mt-2 text-sm">
              Answered: <b>{answeredCount}</b> · Unanswered: <b>{state.questions.length - answeredCount}</b>
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">
                Cancel
              </button>
              <button onClick={() => finish(false)} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}