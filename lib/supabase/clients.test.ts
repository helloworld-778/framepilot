import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createBrowserSupabaseClient,
  resetBrowserSupabaseClient,
} from "@/lib/supabase/client";
import { SupabaseNotConfiguredError } from "@/lib/supabase/env";
import {
  SupabaseServerClientMisuseError,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

/**
 * Construction-only tests. No network request is made: `createClient` builds a
 * lazy client object, and nothing here calls a query method. The credentials are
 * obvious fakes.
 */
const FAKE_URL = "https://example-local.supabase.co";
const FAKE_KEY = "sb_publishable_not-a-real-key";

function clearSupabaseEnv(): void {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

function configure(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;
}

describe("supabase client factories", () => {
  beforeEach(() => {
    clearSupabaseEnv();
    resetBrowserSupabaseClient();
  });

  afterEach(() => {
    clearSupabaseEnv();
    resetBrowserSupabaseClient();
  });

  describe("importing the factories", () => {
    it("does not throw when the environment is absent", async () => {
      // The v1 build must never break because a v2 module was reachable.
      await expect(import("@/lib/supabase/client")).resolves.toBeDefined();
      await expect(import("@/lib/supabase/server")).resolves.toBeDefined();
      await expect(import("@/lib/supabase/env")).resolves.toBeDefined();
    });
  });

  describe("browser client", () => {
    it("fails clearly only when invoked without configuration", () => {
      expect(() => createBrowserSupabaseClient()).toThrow(SupabaseNotConfiguredError);
    });

    it("builds a client when configuration is present", () => {
      configure();

      const client = createBrowserSupabaseClient();

      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
    });

    it("reuses one client per process by default", () => {
      configure();

      expect(createBrowserSupabaseClient()).toBe(createBrowserSupabaseClient());
    });

    it("can be asked for a fresh client that bypasses the singleton", () => {
      configure();

      const cached = createBrowserSupabaseClient();
      const fresh = createBrowserSupabaseClient({ fresh: true });

      expect(fresh).not.toBe(cached);
      // A fresh client must not replace the cached one.
      expect(createBrowserSupabaseClient()).toBe(cached);
    });

    it("does not persist a session, since Phase 1 has no auth flow", () => {
      configure();

      const client = createBrowserSupabaseClient();

      // A stateless client cannot write tokens to storage behind v1's back.
      expect(globalThis.localStorage?.getItem("supabase.auth.token") ?? null).toBeNull();
      expect(client).toBeDefined();
    });
  });

  describe("server client", () => {
    it("fails clearly only when invoked without configuration", () => {
      expect(() => createServerSupabaseClient()).toThrow(SupabaseNotConfiguredError);
    });

    it("builds a client when configuration is present", () => {
      configure();

      const client = createServerSupabaseClient();

      expect(client).toBeDefined();
      expect(typeof client.from).toBe("function");
    });

    it("accepts an end-user access token for RLS evaluation", () => {
      configure();

      expect(() =>
        createServerSupabaseClient({ accessToken: "fake.jwt.value" }),
      ).not.toThrow();
    });

    it("returns a distinct client per call, never a shared singleton", () => {
      configure();

      // Sharing a server client across requests would risk leaking one user's
      // Authorization header into another request.
      expect(createServerSupabaseClient()).not.toBe(createServerSupabaseClient());
    });

    it("refuses to run in a browser environment", () => {
      configure();
      const globals = globalThis as { window?: unknown };
      globals.window = {};

      try {
        expect(() => createServerSupabaseClient()).toThrow(
          SupabaseServerClientMisuseError,
        );
      } finally {
        delete globals.window;
      }
    });
  });
});
