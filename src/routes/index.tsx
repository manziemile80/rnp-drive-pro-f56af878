import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, ListChecks, Target, Trophy, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { LANGS, t, type Lang } from "@/lib/exam/i18n";
import { supabase } from "@/integrations/supabase/client";
import { checkAccess, redeemToken } from "@/lib/exam/exam.functions";
import {
  EXAM_LENGTH,
  EXAM_MINUTES,
  PASS_MARK,
  buildExam,
  clearCurrent,
  getCurrent,
  getHistory,
  getLang,
  loadBank,
  setLang,
} from "@/lib/exam/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [lang, setL] = useState<Lang>("rw");
  const [bankSize, setBank] = useState(0);
  const [hasResume, setResume] = useState(false);
  const [historyCount, setHC] = useState(0);
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [tokenErr, setTokenErr] = useState<string | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);

  useEffect(() => {
    setL(getLang());
    setBank(loadBank().length);
    setResume(!!getCurrent() && !getCurrent()?.submitted);
    setHC(getHistory().length);
  }, []);

  const start = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      navigate({ to: "/auth", search: { redirect: "/" } as never });
      return;
    }
    try {
      const access = await checkAccess();
      if (!access.hasAccess) {
        setTokenModal(true);
        return;
      }
    } catch {
      setTokenModal(true);
      return;
    }
    clearCurrent();
    buildExam(getLang());
    navigate({ to: "/exam" });
  };

  const submitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenErr(null);
    setTokenBusy(true);
    try {
      await redeemToken({ data: { code: tokenCode.trim() } });
      setTokenModal(false);
      setTokenCode("");
      clearCurrent();
      buildExam(getLang());
      navigate({ to: "/exam" });
    } catch (e) {
      setTokenErr(e instanceof Error ? e.message : "Invalid token");
    } finally {
      setTokenBusy(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.82 0.15 84) 0%, transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.55 0.15 260) 0%, transparent 45%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.82_0.15_84)]/40 bg-[oklch(0.82_0.15_84)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[oklch(0.82_0.15_84)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("inspired_by", lang)}
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                {t("app_title", lang)}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
                {t("app_subtitle", lang)}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={start}
                  className="group inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold uppercase tracking-wider text-[oklch(0.2_0.05_260)] shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[oklch(0.82_0.15_84)] focus:ring-offset-2 focus:ring-offset-[oklch(0.22_0.08_260)]"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Play className="h-4 w-4" />
                  {t("start_exam", lang)}
                </button>
                {hasResume && (
                  <Link
                    to="/exam"
                    className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 bg-primary-foreground/5 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("resume_exam", lang)}
                  </Link>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-primary-foreground/70">
                <span>{t("choose_language", lang)}:</span>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setL(l.code);
                    }}
                    className={`rounded-full border px-3 py-1 transition ${
                      lang === l.code
                        ? "border-[oklch(0.82_0.15_84)] bg-[oklch(0.82_0.15_84)] text-[oklch(0.2_0.05_260)]"
                        : "border-primary-foreground/20 hover:border-primary-foreground/40"
                    }`}
                  >
                    {l.flag} {l.native}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat card */}
            <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.82_0.15_84)]">Exam Overview</div>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <Stat icon={<ListChecks className="h-4 w-4" />} label={t("question_bank", lang)} value={String(bankSize)} />
                <Stat icon={<Target className="h-4 w-4" />} label={t("per_exam", lang)} value={String(EXAM_LENGTH)} />
                <Stat icon={<Clock className="h-4 w-4" />} label={t("duration", lang)} value={`${EXAM_MINUTES} ${t("minutes", lang)}`} />
                <Stat icon={<Trophy className="h-4 w-4" />} label={t("pass_mark", lang)} value={`${PASS_MARK}/${EXAM_LENGTH}`} />
              </dl>
              {historyCount > 0 && (
                <div className="mt-4 rounded-md border border-primary-foreground/10 bg-primary-foreground/5 p-3 text-xs text-primary-foreground/80">
                  {historyCount} previous {historyCount === 1 ? "attempt" : "attempts"} saved on this device.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">{t("instructions", lang)}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ListChecks, text: t("instr_1", lang) },
            { icon: Clock, text: t("instr_2", lang) },
            { icon: Trophy, text: t("instr_3", lang) },
            { icon: Target, text: t("instr_4", lang) },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[oklch(0.82_0.15_84)]/15 text-[oklch(0.5_0.14_78)]">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-foreground/80">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-95"
          >
            <Play className="h-4 w-4" /> {t("start_exam", lang)}
          </button>
          <Link to="/stats" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
            {t("stats", lang)}
          </Link>
        </div>
      </section>

      {tokenModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={submitToken} className="w-full max-w-md rounded-lg border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Enter access token</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enter the token you received from the administrator to start your exam.</p>
            <input
              autoFocus
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
              className="mt-4 w-full rounded-md border bg-background px-3 py-2 font-mono text-lg tracking-widest"
              placeholder="XXXXXXXXXX"
              maxLength={16}
            />
            {tokenErr && <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{tokenErr}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setTokenModal(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={tokenBusy || tokenCode.length < 4} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {tokenBusy ? "Verifying…" : "Redeem"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold text-primary-foreground">{value}</div>
    </div>
  );
}
