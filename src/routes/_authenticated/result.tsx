import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Target, Award, Printer, Download, RotateCw, ListChecks } from "lucide-react";
import { EXAM_LENGTH, ExamResult, PASS_MARK, buildExam, formatTime, getLang, getLastResult } from "@/lib/exam/store";
import { t } from "@/lib/exam/i18n";
import { submitAttempt } from "@/lib/exam/exam.functions";

export const Route = createFileRoute("/_authenticated/result")({
  head: () => ({ meta: [{ title: "Exam Result · Rwanda Provisional Licence" }, { name: "robots", content: "noindex" }] }),
  component: ResultPage,
});

function ResultPage() {
  const [r, setR] = useState<ExamResult | null>(null);
  const [synced, setSynced] = useState<"idle" | "ok" | "err">("idle");
  const navigate = useNavigate();
  useEffect(() => {
    const res = getLastResult();
    setR(res);
    if (res && !sessionStorage.getItem(`rwexam.synced.${res.id}`)) {
      const answeredCount = Object.values(res.answers).filter(Boolean).length;
      const wrong = res.total - res.score - (res.total - answeredCount);
      const unanswered = res.total - answeredCount;
      submitAttempt({
        data: {
          score: res.score,
          total: res.total,
          percentage: Math.round((res.score / res.total) * 100),
          passed: res.passed,
          correct: res.score,
          wrong,
          unanswered,
          timeUsedMs: res.timeUsedMs,
          lang: res.lang,
          answers: Object.fromEntries(Object.entries(res.answers).map(([k, v]) => [String(k), v ?? null])),
          questions: res.questions.map((q) => ({ id: q.id, correctLetter: q.correctLetter, stem: q.stem })),
        },
      })
        .then(() => {
          sessionStorage.setItem(`rwexam.synced.${res.id}`, "1");
          setSynced("ok");
        })
        .catch(() => setSynced("err"));
    }
  }, []);
  if (!r)
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="text-muted-foreground">No result found.</p>
        <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Home
        </Link>
      </div>
    );

  const lang = r.lang;
  const pct = Math.round((r.score / r.total) * 100);
  const answeredCount = Object.values(r.answers).filter(Boolean).length;
  const wrong = r.total - r.score - (r.total - answeredCount);
  const unanswered = r.total - answeredCount;

  const retake = () => {
    buildExam(getLang());
    navigate({ to: "/exam" });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-elegant)]">
        <div className="p-8 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.82_0.15_84)]">
            Rwanda Provisional Licence — Result
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-lg font-black uppercase tracking-widest ${
                r.passed ? "bg-[oklch(0.65_0.16_150)] text-white" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {r.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              {r.passed ? t("pass", lang) : t("fail", lang)}
            </div>
            <div className="text-5xl font-black">
              {r.score}
              <span className="text-2xl text-primary-foreground/60">/{r.total}</span>
            </div>
            <div className="text-3xl font-bold text-[oklch(0.82_0.15_84)]">{pct}%</div>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">
            {t("pass_mark", lang)}: {PASS_MARK}/{EXAM_LENGTH} (60%)
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y border-t md:grid-cols-4 md:divide-y-0">
          <Metric icon={<CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.16_150)]" />} label={t("correct_answers", lang)} value={r.score} />
          <Metric icon={<XCircle className="h-4 w-4 text-destructive" />} label={t("wrong_answers", lang)} value={wrong} />
          <Metric icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} label={t("unanswered", lang)} value={unanswered} />
          <Metric icon={<Clock className="h-4 w-4 text-primary" />} label={t("time_used", lang)} value={formatTime(r.timeUsedMs)} />
        </div>

        <div className="border-t p-6">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("accuracy", lang)}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.passed ? "oklch(0.55 0.16 150)" : "var(--destructive)" }} />
                </div>
                <span className="text-sm font-semibold">{pct}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={retake} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
              <RotateCw className="h-4 w-4" /> {t("new_exam", lang)}
            </button>
            <Link to="/review" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Target className="h-4 w-4" /> {t("review_answers", lang)}
            </Link>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Printer className="h-4 w-4" /> {t("print", lang)}
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Download className="h-4 w-4" /> {t("download_pdf", lang)}
            </button>
            <Link to="/" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
              {t("home", lang)}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4 text-xs text-muted-foreground">
        <Award className="mr-1 inline h-3.5 w-3.5" />
        Attempt ID: <code>{r.id}</code> · Finished {new Date(r.finishedAt).toLocaleString()}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}