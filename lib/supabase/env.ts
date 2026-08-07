/**
 * Supabase environment resolution for the optional v2 cloud layer.
 *
 * Three rules govern this module:
 *
 *  1. Nothing throws at import time. FramePilot v1 is local-first and must build,
 *     render, and pass tests with no Supabase variables present at all.
 *  2. Values are read inside functions, never captured into module constants, so
 *     a caller always sees the current environment.
 *  3. No variable value is ever logged or included in an error message. Only the
 *     *names* of missing variables are reported.
 *
 * Only `NEXT_PUBLIC_*` variables appear here. They are browser-safe: the
 * publishable key is designed to ship to the client, and Row Level Security is
 * what protects user data. Service-role credentials must never reach this file.
 */

/** Env var names, written out so Next.js can inline them at build time. */
export const SUPABASE_URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
/**
 * Supabase generates this key name by default in every project dashboard.
 * The @supabase/ssr helpers, supabase/proxy.ts, and .env.local all use it.
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is the earlier Phase 1 alias; both are
 * accepted so existing code keeps working during migration.
 */
export const SUPABASE_ANON_KEY_VAR = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
export const SUPABASE_PUBLISHABLE_KEY_VAR = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export interface SupabasePublicConfig {
  url: string;
  /** The resolved anon/publishable key, regardless of which var name it came from. */
  publishableKey: string;
}

export type SupabaseConfigResult =
  | { status: "ok"; config: SupabasePublicConfig }
  /** Which variable names are absent or blank. Never their values. */
  | { status: "unconfigured"; missing: string[] };

/**
 * Trims and discards blank strings. A variable that is present but empty — the
 * exact shape of an uncommented-but-unfilled `.env.local` line — counts as
 * absent rather than as a broken value.
 */
function readVar(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolves the public Supabase configuration without throwing.
 *
 * Accepts NEXT_PUBLIC_SUPABASE_ANON_KEY (the real Supabase default, used by
 * @supabase/ssr and .env.local) or the earlier NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * alias. The anon key takes precedence when both are set.
 *
 * Note the literal `process.env.NEXT_PUBLIC_…` member expressions: Next.js
 * replaces these statically at build time, so dynamic lookup would silently
 * yield undefined in the browser bundle.
 */
export function getSupabasePublicConfig(): SupabaseConfigResult {
  const url = readVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Prefer the real Supabase key name; fall back to the Phase 1 alias.
  const publishableKey =
    readVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    readVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const missing: string[] = [];
  if (url === null) {
    missing.push(SUPABASE_URL_VAR);
  }
  if (publishableKey === null) {
    // Report both accepted names so the developer knows either one works.
    missing.push(`${SUPABASE_ANON_KEY_VAR} (or ${SUPABASE_PUBLISHABLE_KEY_VAR})`);
  }

  if (url === null || publishableKey === null) {
    return { status: "unconfigured", missing };
  }

  return { status: "ok", config: { url, publishableKey } };
}

/**
 * The explicit "is v2 available?" check.
 *
 * A future optional v2 surface should branch on this and render an unavailable
 * state, so a missing configuration degrades to v1 rather than to an error.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().status === "ok";
}

/**
 * Error thrown only when a client factory is actually invoked without
 * configuration. Carries variable names, never values.
 */
export class SupabaseNotConfiguredError extends Error {
  readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    super(
      `Supabase is not configured. Missing environment variable(s): ${missing.join(
        ", ",
      )}. FramePilot's local-first mode does not require these; see docs/v2-architecture.md.`,
    );
    this.name = "SupabaseNotConfiguredError";
    this.missing = missing;
  }
}

/**
 * For use at the point of client construction, not at import time.
 *
 * @throws {SupabaseNotConfiguredError} when either public variable is absent.
 */
export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const result = getSupabasePublicConfig();
  if (result.status === "unconfigured") {
    throw new SupabaseNotConfiguredError(result.missing);
  }
  return result.config;
}
