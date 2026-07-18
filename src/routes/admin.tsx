import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, LogOut, Search, Plus, Trash2, Edit2, Save, Upload, Download, RefreshCw, Info } from "lucide-react";
import {
  ADMIN_PASSWORD,
  RawQuestion,
  clearHistory,
  getHistory,
  isAdmin,
  loadBank,
  resetBank,
  saveBank,
  setAdmin,
} from "@/lib/exam/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Rwanda Provisional Licence" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setAuthed(isAdmin()), []);

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === ADMIN_PASSWORD) {
              setAdmin(true);
              setAuthed(true);
              setErr(null);
            } else {
              setErr("Incorrect password");
            }
          }}
          className="w-full rounded-xl border bg-card p-8 shadow-[var(--shadow-elegant)]"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center text-xl font-bold">Admin Access</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Restricted area — password protected.</p>
          <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {err && <div className="mt-2 text-sm text-destructive">{err}</div>}
          <button className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return <AdminPanel onLogout={() => { setAdmin(false); setAuthed(false); }} />;
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:flex md:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage the question bank, imports and exports.</p>
        </div>
        <button onClick={onLogout} className="inline-flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-secondary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card label="Bank size" value={String(bank.length)} />
        <Card label="Exams taken" value={String(totalAttempts)} />
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
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm">
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl">
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