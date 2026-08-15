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
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, answers: { ...prev.answers, [qid]: letter } };
      saveCurrent(next);
      return next;
    });
  };

  const goto = (idx: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const clamped = Math.max(0, Math.min(prev.questions.length - 1, idx));
      const next = { ...prev, currentIndex: clamped };
      saveCurrent(next);
      return next;
    });
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
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Sticky header row */}
      <div className="static -mx-3 mb-4 border-b bg-background/95 px-3 py-3 backdrop-blur sm:sticky sm:top-[76px] sm:z-30 sm:mx-0 sm:rounded-lg sm:border sm:px-4 sm:shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("question", state.lang)} {state.currentIndex + 1} {t("of", state.lang)} {state.questions.length}
              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-primary">
                Q{q.id}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--gradient-gold)" }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {answeredCount}/{state.questions.length} answered
            </div>
          </div>
          <div
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 font-mono text-base font-bold sm:gap-2 sm:px-3 sm:text-lg ${
              critTime
                ? "animate-pulse bg-destructive text-destructive-foreground"
                : lowTime
                  ? "bg-gold/20 text-gold-strong"
                  : "bg-primary text-primary-foreground"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
        </div>
      </div>

      {banner && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-strong">
          <AlertTriangle className="h-4 w-4" />
          {banner}
        </div>
      )}

      {/* Question */}
      <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:p-7">
        {q.fellBack && (
          <div className="mb-3 flex items-start gap-2 rounded-md bg-secondary p-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t("no_translation", state.lang)} <em>({state.lang === "rw" ? "" : "Kinyarwanda"})</em></span>
          </div>
        )}
        {(() => {
          const src = getQuestionImage(q.id);
          if (src) {
            return (
              <div className="mx-auto mb-4 w-fit max-w-full overflow-hidden rounded-md border bg-white">
              <img
                src={src}
                alt={`Road sign for question ${q.id}`}
                className="mx-auto max-h-[180px] w-auto max-w-[220px] object-contain p-2 sm:max-h-[220px] sm:max-w-[280px]"
              />
              <div className="border-t bg-muted/60 px-3 py-1 text-[10px] text-muted-foreground">
                📷 Reference image from the official Rwanda Provisional Licence PDF.
              </div>
            </div>
            );
          }
          if (q.hasImage) {
            return (
              <div className="mb-3 rounded-md border border-dashed bg-muted/60 p-3 text-xs text-muted-foreground">
                📷 This question references a road sign image (not available).
              </div>
            );
          }
          return null;
        })()}
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-md bg-primary px-3 py-2 font-mono text-sm font-bold text-primary-foreground shadow-sm sm:text-base">
            Q{q.id}
          </span>
          <h2 className="text-base font-semibold leading-relaxed sm:text-lg">{q.stem}</h2>
        </div>

        <div className="mt-6 space-y-2" role="radiogroup" aria-label="Answer options">
          {q.options.map((o, i) => {
            const selected = answered === o.letter;
            return (
              <button
                key={o.letter}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswer(q.id, o.letter)}
                onPointerUp={() => setAnswer(q.id, o.letter)}
                style={{ touchAction: "manipulation" }}
                className={`group flex w-full select-none items-start gap-3 rounded-md border p-3 text-left transition active:scale-[0.99] ${
                  selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
                    selected ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className={`min-w-0 flex-1 break-words pt-0.5 text-sm sm:text-[15px] ${selected ? "font-semibold text-primary" : ""}`}>
                  {o.text}
                </span>
                <span className="ml-auto hidden text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 lg:inline">
                  Press {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-between">
        <button
          onClick={() => goto(state.currentIndex - 1)}
          disabled={state.currentIndex === 0}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> {t("previous", state.lang)}
        </button>
        <button
          onClick={() => goto(state.currentIndex + 1)}
          disabled={state.currentIndex === state.questions.length - 1}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-40 sm:order-3"
        >
          {t("next", state.lang)} <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 sm:order-2 sm:col-span-1"
        >
          <Flag className="h-4 w-4" /> {t("finish", state.lang)}
        </button>
      </div>

      {/* Question grid */}
      <div className="mt-8 rounded-lg border bg-card p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigate</div>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
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
                      ? "bg-gold/25 text-gold-strong hover:bg-gold/40"
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-5 shadow-2xl sm:p-6">
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