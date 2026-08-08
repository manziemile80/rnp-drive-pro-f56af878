import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus, ShieldCheck, Mail, KeyRound } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

// Where the email verification link should land the user.
const VERIFY_REDIRECT_URL = "https://rnp-drive-pro.vercel.app/verified";

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · Rwanda Provisional Licence Exam" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "otp";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>("otp");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
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
      if (mode === "otp") {
        if (!codeSent) {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true, emailRedirectTo: VERIFY_REDIRECT_URL },
          });
          if (error) throw error;
          setCodeSent(true);
          setInfo(`We sent a login token to ${email}. Enter it below.`);
          return;
        }
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "email",
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: VERIFY_REDIRECT_URL },
        });
        if (error) throw error;
        if (!data.session) {
          setSentTo(email);
          return;
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
          <Mail className="mx-auto h-12 w-12 text-[oklch(0.5_0.14_78)]" />
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
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[oklch(0.82_0.15_84)]/40 bg-[oklch(0.82_0.15_84)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[oklch(0.5_0.14_78)]">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure access
        </div>
        <h1 className="text-2xl font-bold">
          {mode === "otp" ? "Sign in with email token" : mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "otp"
            ? "We email you a one-time token — no password needed."
            : mode === "signin"
              ? "Sign in to access your exam and results."
              : "Register to save your exam performance."}
        </p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" required autoComplete="email" value={email} readOnly={mode === "otp" && codeSent}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          {mode === "otp" && codeSent && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Login token</label>
              <input inputMode="numeric" autoComplete="one-time-code" required value={code}
                onChange={(e) => setCode(e.target.value)} placeholder="123456"
                className="w-full rounded-md border bg-background px-3 py-2 text-center text-lg font-semibold tracking-[0.4em]" />
            </div>
          )}
          {mode !== "otp" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          )}
          {info && !err && <div className="rounded-md border border-[oklch(0.82_0.15_84)]/40 bg-[oklch(0.82_0.15_84)]/10 px-3 py-2 text-xs text-[oklch(0.5_0.14_78)]">{info}</div>}
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
            {mode === "otp"
              ? (codeSent ? <><KeyRound className="h-4 w-4" /> Verify token</> : <><Mail className="h-4 w-4" /> Send login token</>)
              : mode === "signin" ? <><LogIn className="h-4 w-4" /> Sign in</> : <><UserPlus className="h-4 w-4" /> Create account</>}
          </button>
        </form>
        {mode === "otp" && codeSent && (
          <button onClick={() => { setCodeSent(false); setCode(""); setInfo(null); setErr(null); }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            Use a different email / resend token
          </button>
        )}
        <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
          {mode !== "otp" && (
            <button onClick={() => { setMode("otp"); setErr(null); setInfo(null); }} className="block w-full hover:text-foreground">
              Sign in with an email token instead
            </button>
          )}
          {mode !== "signin" && (
            <button onClick={() => { setMode("signin"); setErr(null); setInfo(null); setCodeSent(false); }} className="block w-full hover:text-foreground">
              Sign in with a password
            </button>
          )}
          {mode !== "signup" && (
            <button onClick={() => { setMode("signup"); setErr(null); setInfo(null); setCodeSent(false); }} className="block w-full hover:text-foreground">
              Create an account with a password
            </button>
          )}
        </div>
        <p className="mt-4 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          After signing up, you'll need a valid access token from an administrator to start an exam.
        </p>
      </div>
    </div>
  );
}