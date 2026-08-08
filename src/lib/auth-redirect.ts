// After email verification, Supabase sends the user to its configured redirect
// target. If that lands anywhere other than the production domain below, this
// bridges them across while preserving the auth tokens in the URL.
export const PRODUCTION_ORIGIN = "https://rnp-drive-pro.vercel.app";

export function bridgeVerificationRedirect() {
  if (typeof window === "undefined") return;

  const { origin, hash, search, pathname } = window.location;
  if (origin === PRODUCTION_ORIGIN) return;

  // Only act on an actual auth callback (tokens live in the hash, errors in the query).
  const isAuthCallback =
    /access_token=|refresh_token=|type=(signup|recovery|magiclink|invite|email_change)/.test(hash) ||
    /(^|[?&])(token_hash|error_code|error_description)=/.test(search);
  if (!isAuthCallback) return;

  window.location.replace(`${PRODUCTION_ORIGIN}${pathname}${search}${hash}`);
}