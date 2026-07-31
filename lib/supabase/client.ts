"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Browser Supabase client factory for the optional v2 cloud layer.
 *
 * Nothing in FramePilot v1 imports this. Importing it is side-effect free and
 * safe: configuration is only read when `createBrowserSupabaseClient()` is
 * actually called, so a v1 build with no Supabase variables is unaffected.
 *
 * Session persistence is deliberately off in Phase 1. Auth is out of scope, and
 * a factory that quietly wrote tokens to localStorage would be a behaviour
 * change we have not designed for yet. Phase 2 will revisit this together with
 * `@supabase/ssr` for cookie-based sessions.
 */

let cached: SupabaseClient | null = null;

export interface BrowserClientOptions {
  /** Bypass the module singleton. Used by tests. */
  fresh?: boolean;
}

/**
 * @throws {SupabaseNotConfiguredError} when the public variables are absent.
 */
export function createBrowserSupabaseClient(
  options: BrowserClientOptions = {},
): SupabaseClient {
  if (cached && !options.fresh) {
    return cached;
  }

  const { url, publishableKey } = requireSupabasePublicConfig();

  const client = createClient(url, publishableKey, {
    auth: {
      // Phase 1 has no auth flow. Keep the client stateless so it cannot
      // persist or refresh a session behind v1's back.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  if (!options.fresh) {
    cached = client;
  }
  return client;
}

/** Test seam so the singleton cannot leak between cases. */
export function resetBrowserSupabaseClient(): void {
  cached = null;
}
