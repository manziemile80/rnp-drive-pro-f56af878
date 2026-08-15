import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus, ShieldCheck, Mail } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

// Where the email verification link should land the user: back on this site.
function verifyRedirectUrl(next?: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://rnp-drive-pro.vercel.app";
  const target = next && next.startsWith("/") ? next : "/";
  return `${origin}/verified?next=${encodeURIComponent(target)}`;
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · Rwanda Provisional Licence Exam" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: verifyRedirectUrl(redirect) },
        });
        if (error) throw error;
        if (!data.session) {
          // Fallback: confirmation still required on this backend.
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
          if (signInErr) {
            setSentTo(email);
            return;
          }
        }
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

  if (sentTo) {
    return (
      <div className="mx-auto grid min-h-[75vh] max-w-md items-center px-4">
        <div className="w-full rounded-xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <Mail className="mx-auto h-12 w-12 text-gold-strong" />
          <h1 className="mt-5 text-2xl font-bold">Confirm your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a verification link to <span className="font-semibold text-foreground">{sentTo}</span>.
            Open it on any device and click the link — you'll see a confirmation message once your email is verified.
          </p>
          <button
            onClick={() => { setSentTo(null); setMode("signin"); }}
            className="mt-6 text-xs text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[75vh] max-w-md items-center px-4">
      <div className="w-full rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-strong">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure access
        </div>
        <h1 className="text-2xl font-bold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to access your exam and results."
            : "Register with your email and password — your account is ready right away."}
        </p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          {info && !err && <div className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold-strong">{info}</div>}
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
            {mode === "signin" ? <><LogIn className="h-4 w-4" /> Sign in</> : <><UserPlus className="h-4 w-4" /> Create account</>}
          </button>
        </form>
        <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
          {mode !== "signin" && (
            <button onClick={() => { setMode("signin"); setErr(null); setInfo(null); }} className="block w-full hover:text-foreground">
              Already have an account? Sign in
            </button>
          )}
          {mode !== "signup" && (
            <button onClick={() => { setMode("signup"); setErr(null); setInfo(null); }} className="block w-full hover:text-foreground">
              Create an account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}