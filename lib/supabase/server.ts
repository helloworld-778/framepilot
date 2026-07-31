import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Server-side Supabase client factory for the optional v2 cloud layer.
 *
 * Not wired to any route, server action, or component yet — Phase 1 is schema and
 * contracts only.
 *
 * Scope of this factory, deliberately narrow:
 *
 *  - It uses the *publishable* key, exactly like the browser client, so every
 *    query it makes is still subject to Row Level Security.
 *  - It is NOT a service-role client. No code in this repository may hold a
 *    service-role key. Admin writes to reference tables will arrive later behind
 *    a separate, explicitly reviewed trusted boundary.
 *  - It does no cookie handling or session refresh. Cookie-bound sessions need
 *    `@supabase/ssr`, which is out of scope until auth lands in Phase 2. Until
 *    then this client is effectively anonymous and can only read data whose RLS
 *    policy permits it.
 *
 * Server-only is enforced with an explicit runtime guard rather than the
 * `server-only` package, which is not a dependency of this project. The guard
 * runs on invocation, so importing this module stays safe everywhere.
 */

export class SupabaseServerClientMisuseError extends Error {
  constructor() {
    super(
      "createServerSupabaseClient() was called in a browser environment. Use createBrowserSupabaseClient() from lib/supabase/client.ts instead.",
    );
    this.name = "SupabaseServerClientMisuseError";
  }
}

export interface ServerClientOptions {
  /**
   * A caller-supplied end-user access token. When provided it is forwarded as the
   * request Authorization header so RLS evaluates `auth.uid()` as that user.
   * Phase 2 will populate this from a verified session; nothing does today.
   */
  accessToken?: string;
}

/**
 * @throws {SupabaseNotConfiguredError} when the public variables are absent.
 * @throws {SupabaseServerClientMisuseError} when called from the browser.
 */
export function createServerSupabaseClient(
  options: ServerClientOptions = {},
): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new SupabaseServerClientMisuseError();
  }

  const { url, publishableKey } = requireSupabasePublicConfig();

  return createClient(url, publishableKey, {
    auth: {
      // A server client must never persist or refresh state across requests.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: options.accessToken
      ? { headers: { Authorization: `Bearer ${options.accessToken}` } }
      : undefined,
  });
}
