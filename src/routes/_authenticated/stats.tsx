import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Trophy, Users, ArrowLeft } from "lucide-react";
import { ExamResult, getHistory, loadBank, questionStats } from "@/lib/exam/store";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "Statistics · Rwanda Provisional Licence Practice" }, { name: "description", content: "Personal exam statistics dashboard." }] }),
  component: StatsPage,
});

function StatsPage() {
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [bankSize, setBankSize] = useState(0);
  const [stats, setStats] = useState<ReturnType<typeof questionStats>>({});
  useEffect(() => {
    setHistory(getHistory());
    setBankSize(loadBank().length);
    setStats(questionStats());
  }, []);

  const total = history.length;
  const avg = total ? Math.round(history.reduce((a, r) => a + (r.score / r.total) * 100, 0) / total) : 0;
  const passRate = total ? Math.round((history.filter((r) => r.passed).length / total) * 100) : 0;
  const failRate = total ? 100 - passRate : 0;

  const missed = Object.entries(stats)
    .filter(([, s]) => s.seen >= 1)
    .map(([id, s]) => ({ id: Number(id), rate: s.wrong / s.seen, seen: s.seen, wrong: s.wrong }))
    .sort((a, b) => b.rate - a.rate);
  const mostMissed = missed.slice(0, 8);
  const leastMissed = [...missed].reverse().slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Statistics Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Personal performance across all practice attempts saved on this device.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={<Users className="h-4 w-4" />} label="Exams taken" value={String(total)} />
        <KPI icon={<BarChart3 className="h-4 w-4" />} label="Average score" value={`${avg}%`} />
        <KPI icon={<Trophy className="h-4 w-4" />} label="Pass rate" value={`${passRate}%`} accent />
        <KPI icon={<TrendingDown className="h-4 w-4" />} label="Fail rate" value={`${failRate}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Most missed questions" icon={<TrendingDown className="h-4 w-4 text-destructive" />}>
          {mostMissed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet. Take a few exams to see analytics.</p>
          ) : (
            <ul className="divide-y">
              {mostMissed.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs">Q{m.id}</span>
                  <span className="text-muted-foreground">
                    wrong <b>{m.wrong}</b> of <b>{m.seen}</b>
                  </span>
                  <span className="font-semibold text-destructive">{Math.round(m.rate * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Least missed questions" icon={<TrendingUp className="h-4 w-4 text-success" />}>
          {leastMissed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="divide-y">
              {leastMissed.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs">Q{m.id}</span>
                  <span className="text-muted-foreground">
                    wrong <b>{m.wrong}</b> of <b>{m.seen}</b>
                  </span>
                  <span className="font-semibold text-success-strong">{Math.round(m.rate * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent attempts ({history.length})</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Date</th>
                  <th className="p-2">Lang</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{new Date(r.finishedAt).toLocaleString()}</td>
                    <td className="p-2 uppercase">{r.lang}</td>
                    <td className="p-2 font-mono">{r.score}/{r.total}</td>
                    <td className="p-2">{Math.round((r.score / r.total) * 100)}%</td>
                    <td className="p-2">
                      {r.passed ? (
                        <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success-strong">PASS</span>
                      ) : (
                        <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">FAIL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">Question bank size: {bankSize}</p>
    </div>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "bg-gold/10" : "bg-card"} shadow-[var(--shadow-card)]`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}