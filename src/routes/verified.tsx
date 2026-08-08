import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/verified")({
  head: () => ({
    meta: [
      { title: "Email verified · Rwanda Provisional Licence Exam" },
      { name: "description", content: "Confirmation page for verifying your email address before starting the Rwanda provisional driving licence practice exam." },
      { property: "og:title", content: "Email verified · Rwanda Provisional Licence Exam" },
      { property: "og:description", content: "Confirmation page for verifying your email address before starting the Rwanda provisional driving licence practice exam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifiedPage,
});

type State = "checking" | "success" | "error";

function VerifiedPage() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const q = url.searchParams;

      const errDesc = hash.get("error_description") ?? q.get("error_description");
      if (errDesc) {
        if (!cancelled) { setState("error"); setMessage(errDesc); }
        return;
      }

      try {
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const tokenHash = q.get("token_hash");
        const code = q.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (tokenHash) {
          const type = (q.get("type") ?? "signup") as "signup" | "email_change" | "recovery" | "magiclink" | "invite";
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getUser();
          if (!data.user) throw new Error("This verification link is missing or has already been used.");
        }

        window.history.replaceState({}, "", window.location.pathname);
        if (!cancelled) {
          setState("success");
          setMessage("Your email has been verified successfully. You can now sign in and start your exam.");
        }
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setMessage(e instanceof Error ? e.message : "We couldn't verify this link. It may have expired.");
        }
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto grid min-h-[75vh] max-w-md items-center px-4">
      <div className="w-full rounded-xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        {state === "checking" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />}
        {state === "success" && <CheckCircle2 className="mx-auto h-14 w-14 text-[oklch(0.6_0.15_150)]" />}
        {state === "error" && <XCircle className="mx-auto h-14 w-14 text-destructive" />}

        <h1 className="mt-5 text-2xl font-bold">
          {state === "checking" && "Verifying your email"}
          {state === "success" && "Email verified successfully"}
          {state === "error" && "Verification failed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {state !== "checking" && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Go to home
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              {state === "success" ? "Sign in" : "Back to sign in"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}