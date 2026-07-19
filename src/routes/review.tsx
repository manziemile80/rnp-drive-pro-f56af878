import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, ArrowLeft, Filter } from "lucide-react";
import { ExamResult, getLastResult } from "@/lib/exam/store";
import { t } from "@/lib/exam/i18n";
import { getQuestionImage } from "@/lib/exam/question-images";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review Answers · Rwanda Provisional Licence" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const [r, setR] = useState<ExamResult | null>(null);
  const [filter, setFilter] = useState<"all" | "wrong" | "correct" | "unanswered">("all");
  useEffect(() => setR(getLastResult()), []);

  if (!r)
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="text-muted-foreground">No exam to review.</p>
        <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Home
        </Link>
      </div>
    );

  const filtered = r.questions.filter((q) => {
    const ans = r.answers[q.id];
    if (filter === "correct") return ans === q.correctLetter;
    if (filter === "wrong") return ans && ans !== q.correctLetter;
    if (filter === "unanswered") return !ans;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/result" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to result
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{t("review_answers", r.lang)}</h1>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-card p-1 text-xs">
          <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {(["all", "correct", "wrong", "unanswered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((q, idx) => {
          const ans = r.answers[q.id];
          const isCorrect = ans === q.correctLetter;
          return (
            <div key={q.id} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span className="rounded bg-secondary px-2 py-0.5 font-mono">#{idx + 1} · Q{q.id}</span>
                {!ans ? (
                  <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">Unanswered</span>
                ) : isCorrect ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[oklch(0.55_0.16_150)]/15 px-2 py-0.5 text-[oklch(0.4_0.16_150)]">
                    <Check className="h-3 w-3" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 text-destructive">
                    <X className="h-3 w-3" /> Wrong
                  </span>
                )}
              </div>
              <p className="font-semibold leading-relaxed">{q.stem}</p>
              {q.hasImage && (() => {
                const src = getQuestionImage(q.id);
                return src ? (
                  <div className="mt-3 overflow-hidden rounded-md border bg-white">
                    <img src={src} alt={`Road sign for question ${q.id}`} className="mx-auto max-h-[360px] w-full object-contain" />
                  </div>
                ) : null;
              })()}
              <div className="mt-4 space-y-1.5">
                {q.options.map((o) => {
                  const isAns = ans === o.letter;
                  const isRight = o.letter === q.correctLetter;
                  return (
                    <div
                      key={o.letter}
                      className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
                        isRight
                          ? "border-[oklch(0.55_0.16_150)]/40 bg-[oklch(0.55_0.16_150)]/10"
                          : isAns
                            ? "border-destructive/40 bg-destructive/10"
                            : "border-transparent"
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isRight
                            ? "bg-[oklch(0.55_0.16_150)] text-white"
                            : isAns
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {o.letter.toUpperCase()}
                      </span>
                      <span className="pt-0.5">{o.text}</span>
                      {isRight && <Check className="ml-auto h-4 w-4 shrink-0 text-[oklch(0.5_0.16_150)]" />}
                      {isAns && !isRight && <X className="ml-auto h-4 w-4 shrink-0 text-destructive" />}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-3 rounded-md bg-secondary/60 p-3 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("explanation", r.lang)}</div>
                  <p className="mt-1">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
            No questions match this filter.
          </div>
        )}
      </div>
    </div>
  );
}