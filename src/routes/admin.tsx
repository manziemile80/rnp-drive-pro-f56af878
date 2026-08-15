import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, Search, Plus, Trash2, Edit2, Save, Upload, Download, RefreshCw, Info, KeyRound, Users, ClipboardCheck, Copy, Ban, CheckCircle2 } from "lucide-react";
import {
  RawQuestion,
  clearHistory,
  getHistory,
  loadBank,
  resetBank,
  saveBank,
} from "@/lib/exam/store";
import { supabase } from "@/integrations/supabase/client";
import {
  createTokens,
  listTokens,
  setTokenRevoked,
  deleteToken,
  listAllAttempts,
  grantAdmin,
} from "@/lib/exam/exam.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Rwanda Provisional Licence" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [state, setState] = useState<"loading" | "unauth" | "notadmin" | "ok">("loading");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setState("unauth");
      try {
        const { data: rows, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .limit(1);
        if (error) throw error;
        setState(rows && rows.length > 0 ? "ok" : "notadmin");
      } catch {
        setState("notadmin");
      }
    })();
  }, []);

  if (state === "loading") return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (state === "unauth") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold">Sign in required</h1>
        <p className="mt-1 text-sm text-muted-foreground">Please sign in to access the admin panel.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    );
  }
  if (state === "notadmin") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <Lock className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-3 text-xl font-bold">Access denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">This account does not have admin privileges.</p>
      </div>
    );
  }
  return <AdminPanel />;
}

type Tab = "bank" | "tokens" | "attempts" | "admins";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("tokens");
  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage access tokens, review candidate performance, and edit the question bank.</p>
        </div>
      </div>
      <div className="-mx-3 mt-6 flex gap-1 overflow-x-auto border-b px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {([
          ["tokens", "Access Tokens", KeyRound],
          ["attempts", "Attempts", ClipboardCheck],
          ["admins", "Administrators", Users],
          ["bank", "Question Bank", Edit2],
        ] as [Tab, string, typeof KeyRound][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "tokens" && <TokensTab />}
        {tab === "attempts" && <AttemptsTab />}
        {tab === "admins" && <AdminsTab />}
        {tab === "bank" && <BankTab />}
      </div>
    </div>
  );
}

function TokensTab() {
  type Tok = { id: string; code: string; assigned_to: string | null; redeemed_at: string | null; revoked: boolean; note: string | null; created_at: string };
  const [tokens, setTokens] = useState<Tok[]>([]);
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try { setTokens((await listTokens()) as Tok[]); } catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true); setErr(null);
    try {
      await createTokens({ data: { count, note: note || undefined } });
      setNote("");
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">Generate tokens</div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-muted-foreground">Count</label>
            <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value))))} className="mt-1 w-24 rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-semibold uppercase text-muted-foreground">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Group A - July batch" className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
          <button disabled={busy} onClick={create} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" /> Generate
          </button>
        </div>
        {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-secondary/70 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Code</th><th className="p-3">Status</th><th className="p-3">Redeemed</th><th className="p-3">Note</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-mono">{t.code}</td>
                <td className="p-3">
                  {t.revoked ? <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Revoked</span>
                    : t.assigned_to ? <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success-strong">Used</span>
                    : <span className="rounded bg-secondary px-2 py-0.5 text-xs">Available</span>}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{t.redeemed_at ? new Date(t.redeemed_at).toLocaleString() : "—"}</td>
                <td className="p-3 text-xs">{t.note ?? "—"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button title="Copy" onClick={() => navigator.clipboard.writeText(t.code)} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary"><Copy className="h-3.5 w-3.5" /></button>
                    <button title={t.revoked ? "Restore" : "Revoke"} onClick={async () => { await setTokenRevoked({ data: { id: t.id, revoked: !t.revoked } }); load(); }} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary">
                      {t.revoked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                    </button>
                    <button title="Delete" onClick={async () => { if (confirm(`Delete token ${t.code}?`)) { await deleteToken({ data: { id: t.id } }); load(); } }} className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No tokens yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttemptsTab() {
  type Att = { id: string; user_email: string | null; score: number; total: number; percentage: number; passed: boolean; correct: number; wrong: number; unanswered: number; time_used_ms: number; lang: string; created_at: string };
  const [rows, setRows] = useState<Att[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    listAllAttempts().then((r) => setRows(r as Att[])).catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);
  const passRate = rows.length ? Math.round((rows.filter((r) => r.passed).length / rows.length) * 100) : 0;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Total attempts" value={String(rows.length)} />
        <Card label="Pass rate" value={`${passRate}%`} />
        <Card label="Passed" value={String(rows.filter((r) => r.passed).length)} />
      </div>
      {err && <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/70 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">User</th><th className="p-3">Score</th><th className="p-3">%</th><th className="p-3">Status</th><th className="p-3">Lang</th><th className="p-3">When</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.user_email ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="p-3 font-mono">{r.score}/{r.total}</td>
                <td className="p-3 font-semibold">{Math.round(r.percentage)}%</td>
                <td className="p-3">
                  {r.passed ? <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success-strong">Pass</span>
                    : <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Fail</span>}
                </td>
                <td className="p-3 text-xs uppercase">{r.lang}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No attempts recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminsTab() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      await grantAdmin({ data: { email: email.trim() } });
      setMsg({ type: "ok", text: `Granted admin to ${email}` });
      setEmail("");
    } catch (e) { setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="max-w-lg rounded-lg border bg-card p-6">
      <h3 className="text-sm font-semibold">Grant admin role</h3>
      <p className="mt-1 text-xs text-muted-foreground">The user must have signed up at least once with this email.</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      {msg && <div className={`mt-2 rounded-md px-3 py-2 text-xs ${msg.type === "ok" ? "border border-success/40 bg-success/10 text-success-strong" : "border border-destructive/40 bg-destructive/10 text-destructive"}`}>{msg.text}</div>}
      <button type="submit" disabled={busy} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Grant admin</button>
    </form>
  );
}

function BankTab() {
  const [bank, setBank] = useState<RawQuestion[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RawQuestion | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => setBank(loadBank()), []);

  const filtered = useMemo(() => {
    if (!q.trim()) return bank;
    const s = q.toLowerCase();
    const asNum = Number(s);
    return bank.filter((x) => {
      if (!isNaN(asNum) && x.number === asNum) return true;
      if (x.stem_rw.toLowerCase().includes(s)) return true;
      return x.options_rw.some((o) => o.toLowerCase().includes(s));
    });
  }, [bank, q]);

  const persist = (next: RawQuestion[]) => {
    setBank(next);
    saveBank(next);
  };

  const del = (n: number) => {
    if (!confirm(`Delete question #${n}?`)) return;
    persist(bank.filter((b) => b.number !== n));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rwanda-licence-questions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) throw new Error("Not an array");
        persist(data);
        alert(`Imported ${data.length} questions.`);
      } catch (e) {
        alert("Invalid JSON: " + (e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const totalAttempts = getHistory().length;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Bank size" value={String(bank.length)} />
        <Card label="Local attempts" value={String(totalAttempts)} />
        <Card label="With images" value={String(bank.filter((b) => b.has_image).length)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by number or keyword…"
            className="w-full rounded-md border bg-background py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
          <Plus className="h-4 w-4" /> New
        </button>
        <button onClick={exportJson} className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm hover:bg-secondary">
          <Download className="h-4 w-4" /> Export JSON
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-4 py-2 text-sm hover:bg-secondary">
          <Upload className="h-4 w-4" /> Import
          <input
            type="file"
            accept="application/json,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.name.endsWith(".pdf")) {
                alert("PDF import: upload the PDF via chat so the assistant can extract questions and regenerate the bank.");
                return;
              }
              importJson(f);
            }}
          />
        </label>
        <button
          onClick={() => {
            if (!confirm("Reset question bank to the original PDF-extracted set?")) return;
            resetBank();
            setBank(loadBank());
          }}
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
        >
          <RefreshCw className="h-4 w-4" /> Reset
        </button>
        <button
          onClick={() => {
            if (!confirm("Delete all saved exam history?")) return;
            clearHistory();
            alert("History cleared.");
          }}
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Clear history
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-md border bg-secondary/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The bank is stored in this browser's localStorage. To install a new PDF-derived bank globally, upload the PDF in chat and ask the assistant to regenerate <code>questions.json</code>.
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 bg-secondary/70 backdrop-blur">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="w-16 p-3">#</th>
                <th className="p-3">Question</th>
                <th className="w-16 p-3 text-center">Correct</th>
                <th className="w-24 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((qq) => (
                <tr key={qq.number} className="border-t hover:bg-secondary/30">
                  <td className="p-3 font-mono text-xs">{qq.number}</td>
                  <td className="p-3">
                    <div className="line-clamp-2 max-w-2xl">{qq.stem_rw}</div>
                    {qq.has_image && <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">image ref</span>}
                  </td>
                  <td className="p-3 text-center font-bold uppercase">{qq.correct}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(qq)} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary" aria-label="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => del(qq.number)} className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-muted-foreground">No matches.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || showNew) && (
        <QuestionEditor
          initial={editing}
          onClose={() => {
            setEditing(null);
            setShowNew(false);
          }}
          onSave={(nq) => {
            const exists = bank.some((b) => b.number === nq.number);
            const next = exists ? bank.map((b) => (b.number === nq.number ? nq : b)) : [...bank, nq].sort((a, b) => a.number - b.number);
            persist(next);
            setEditing(null);
            setShowNew(false);
          }}
          suggestNumber={Math.max(0, ...bank.map((b) => b.number)) + 1}
        />
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuestionEditor({
  initial,
  onClose,
  onSave,
  suggestNumber,
}: {
  initial: RawQuestion | null;
  onClose: () => void;
  onSave: (q: RawQuestion) => void;
  suggestNumber: number;
}) {
  const [q, setQ] = useState<RawQuestion>(
    initial || { number: suggestNumber, stem_rw: "", options_rw: ["", "", "", ""], correct: "a", has_image: false, explanation: "" },
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-3 sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-4 shadow-2xl sm:p-6">
        <h3 className="text-lg font-bold">{initial ? `Edit question #${initial.number}` : "New question"}</h3>
        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Number</label>
            <input
              type="number"
              value={q.number}
              disabled={!!initial}
              onChange={(e) => setQ({ ...q, number: Number(e.target.value) })}
              className="rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Question (Kinyarwanda)</label>
            <textarea
              value={q.stem_rw}
              onChange={(e) => setQ({ ...q, stem_rw: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          {(["a", "b", "c", "d"] as const).map((l, i) => (
            <div key={l} className="flex items-start gap-2">
              <input
                type="radio"
                name="correct"
                checked={q.correct === l}
                onChange={() => setQ({ ...q, correct: l })}
                className="mt-3"
              />
              <div className="flex-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Option {l.toUpperCase()}</label>
                <input
                  value={q.options_rw[i] || ""}
                  onChange={(e) => {
                    const opts = [...q.options_rw];
                    opts[i] = e.target.value;
                    setQ({ ...q, options_rw: opts });
                  }}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Explanation (optional)</label>
            <textarea
              value={q.explanation || ""}
              onChange={(e) => setQ({ ...q, explanation: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
          <button
            onClick={() => {
              if (!q.stem_rw.trim() || q.options_rw.some((o) => !o.trim())) {
                alert("Fill in question and all four options.");
                return;
              }
              onSave(q);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}