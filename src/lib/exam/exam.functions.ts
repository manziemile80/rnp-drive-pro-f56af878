import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ------- User: check access & redeem token -------

export const checkAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const isAdmin = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin.data === true) return { hasAccess: true, isAdmin: true as const };
    const { data } = await supabase
      .from("access_tokens")
      .select("id")
      .eq("assigned_to", userId)
      .eq("revoked", false)
      .limit(1);
    return { hasAccess: !!(data && data.length), isAdmin: false as const, tokenId: data?.[0]?.id };
  });

export const redeemToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().min(4).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase();
    const { data: tok, error } = await supabase
      .from("access_tokens")
      .select("id, assigned_to, revoked")
      .eq("code", code)
      .maybeSingle();
    if (error || !tok) throw new Error("Invalid access token");
    if (tok.revoked) throw new Error("This token has been revoked");
    if (tok.assigned_to && tok.assigned_to !== userId) throw new Error("This token has already been used by another account");
    if (tok.assigned_to === userId) return { ok: true, tokenId: tok.id };
    const { error: upErr } = await supabase
      .from("access_tokens")
      .update({ assigned_to: userId, redeemed_at: new Date().toISOString() })
      .eq("id", tok.id)
      .is("assigned_to", null);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, tokenId: tok.id };
  });

// ------- Attempts -------

const submitSchema = z.object({
  score: z.number().int(),
  total: z.number().int(),
  percentage: z.number(),
  passed: z.boolean(),
  correct: z.number().int(),
  wrong: z.number().int(),
  unanswered: z.number().int(),
  timeUsedMs: z.number().int(),
  lang: z.string().max(8),
  answers: z.record(z.string(), z.union([z.enum(["a", "b", "c", "d"]), z.null()])),
  questions: z.array(z.object({
    id: z.number(),
    correctLetter: z.enum(["a", "b", "c", "d"]),
    stem: z.string(),
  })),
});

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string })?.email ?? null;
    const { data: tok } = await supabase
      .from("access_tokens").select("id").eq("assigned_to", userId).eq("revoked", false).limit(1);
    const { error } = await supabase.from("exam_attempts").insert({
      user_id: userId,
      user_email: email,
      token_id: tok?.[0]?.id ?? null,
      score: data.score,
      total: data.total,
      percentage: data.percentage,
      passed: data.passed,
      correct: data.correct,
      wrong: data.wrong,
      unanswered: data.unanswered,
      time_used_ms: data.timeUsedMs,
      lang: data.lang,
      answers: data.answers,
      questions: data.questions,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exam_attempts")
      .select("id, score, total, percentage, passed, correct, wrong, unanswered, time_used_ms, lang, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ------- Admin -------

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || data !== true) throw new Error("Forbidden: admin only");
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export const createTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { count: number; note?: string }) =>
    z.object({ count: z.number().int().min(1).max(200), note: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rows = Array.from({ length: data.count }, () => ({
      code: makeCode(),
      created_by: context.userId,
      note: data.note ?? null,
    }));
    const { data: inserted, error } = await context.supabase
      .from("access_tokens").insert(rows).select("id, code, note, created_at");
    if (error) throw new Error(error.message);
    return inserted ?? [];
  });

export const listTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("access_tokens")
      .select("id, code, assigned_to, redeemed_at, revoked, note, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setTokenRevoked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; revoked: boolean }) =>
    z.object({ id: z.string().uuid(), revoked: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("access_tokens").update({ revoked: data.revoked }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("access_tokens").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("exam_attempts")
      .select("id, user_id, user_email, score, total, percentage, passed, correct, wrong, unanswered, time_used_ms, lang, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const grantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const target = users?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!target) throw new Error("No user with that email has signed up yet");
    const { error: insErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: target.id, role: "admin" });
    if (insErr && !insErr.message.includes("duplicate")) throw new Error(insErr.message);
    return { ok: true };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: data === true };
  });