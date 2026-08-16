import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, LogIn, LogOut, User } from "lucide-react";
import { getLang, setLang, getTheme, setTheme } from "@/lib/exam/store";
import { LANGS, t, type Lang } from "@/lib/exam/i18n";
import { supabase } from "@/integrations/supabase/client";
import rnpLogo from "@/assets/rnp-logo.png.asset.json";

export function SiteHeader() {
  const [lang, setL] = useState<Lang>("rw");
  const [theme, setTh] = useState<"light" | "dark">("light");
  const [email, setEmail] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setL(getLang());
    const th = getTheme();
    setTh(th);
    setTheme(th);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    setL(l);
  };
  const toggleTheme = () => {
    const nt = theme === "light" ? "dark" : "light";
    setTheme(nt);
    setTh(nt);
  };

  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
        pathname === to
          ? "bg-white/10 text-primary-foreground"
          : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-primary-foreground/10 print:hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:gap-4 sm:py-3 md:flex md:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={rnpLogo.url}
              alt="Rwanda National Police"
              className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-0.5 ring-2 ring-gold sm:h-11 sm:w-11"
            />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold uppercase tracking-wider text-gold sm:text-sm">Provisional Licence Exam</div>
              <div className="truncate text-[11px] text-primary-foreground/70">Republic of Rwanda · Practice System</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {link("/", t("home", lang))}
            {link("/stats", t("stats", lang))}
            {link("/admin", t("admin", lang))}
          </nav>
          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-primary-foreground/10 pt-2.5 md:col-span-1 md:flex-nowrap md:border-0 md:pt-0">
            <div className="flex items-center gap-1 rounded-md bg-primary-foreground/5 p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
                    lang === l.code
                      ? "bg-gold text-gold-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground"
                  }`}
                  aria-label={l.label}
                >
                  <span className="mr-1">{l.flag}</span>
                  <span className="hidden sm:inline">{l.native}</span>
                </button>
              ))}
            </div>
            {email ? (
              <div className="flex items-center gap-1">
                <span className="hidden items-center gap-1 rounded-md bg-primary-foreground/5 px-2 py-1 text-xs text-primary-foreground/80 sm:inline-flex" title={email}>
                  <User className="h-3 w-3" />
                  <span className="max-w-[140px] truncate">{email}</span>
                </span>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground hover:brightness-105"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      <nav className="-mx-1 flex items-center gap-1 overflow-x-auto pb-2 md:hidden">
          {link("/", t("home", lang))}
          {link("/stats", t("stats", lang))}
          {link("/admin", t("admin", lang))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/40 py-6 text-center text-xs text-muted-foreground print:hidden">
      <div className="mx-auto max-w-7xl px-4">
        Rwanda Provisional Driving Licence — Practice Examination System · Original design inspired by Rwanda National Police public materials · Not an official government service.
      </div>
    </footer>
  );
}