import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · Rwanda Provisional Licence Exam" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: (redirect as "/") ?? "/" });
    });
  }, [navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
      navigate({ to: (redirect as "/") ?? "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[75vh] max-w-md items-center px-4">
      <div className="w-full rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[oklch(0.82_0.15_84)]/40 bg-[oklch(0.82_0.15_84)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[oklch(0.5_0.14_78)]">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure access
        </div>
        <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to access your exam and results." : "Register to save your exam performance."}
        </p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
            {mode === "signin" ? <><LogIn className="h-4 w-4" /> Sign in</> : <><UserPlus className="h-4 w-4" /> Create account</>}
          </button>
        </form>
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <p className="mt-4 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          After signing up, you'll need a valid access token from an administrator to start an exam.
        </p>
      </div>
    </div>
  );
}