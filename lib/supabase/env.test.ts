import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SUPABASE_ANON_KEY_VAR,
  SUPABASE_PUBLISHABLE_KEY_VAR,
  SUPABASE_URL_VAR,
  SupabaseNotConfiguredError,
  getSupabasePublicConfig,
  isSupabaseConfigured,
  requireSupabasePublicConfig,
} from "@/lib/supabase/env";

/**
 * No real project, key, or network is involved. The values below are obvious
 * fakes and exist only to exercise the present/absent branches.
 */
const FAKE_URL = "https://example-local.supabase.co";
const FAKE_KEY = "sb_anon_not-a-real-key";

function clearSupabaseEnv(): void {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

describe("supabase env helper", () => {
  beforeEach(clearSupabaseEnv);
  afterEach(clearSupabaseEnv);

  describe("when nothing is configured", () => {
    it("reports unconfigured instead of throwing", () => {
      expect(() => getSupabasePublicConfig()).not.toThrow();
      const result = getSupabasePublicConfig();
      expect(result.status).toBe("unconfigured");
      if (result.status === "unconfigured") {
        expect(result.missing).toContain(SUPABASE_URL_VAR);
      }
    });

    it("answers the explicit configured check with false", () => {
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("mentions both accepted key names in the missing report", () => {
      const result = getSupabasePublicConfig();
      expect(result.status).toBe("unconfigured");
      if (result.status === "unconfigured") {
        // The message should tell the developer about both accepted names.
        const keyEntry = result.missing.find((m) =>
          m.includes(SUPABASE_ANON_KEY_VAR),
        );
        expect(keyEntry).toBeDefined();
        expect(keyEntry).toContain(SUPABASE_PUBLISHABLE_KEY_VAR);
      }
    });
  });

  describe("accepts NEXT_PUBLIC_SUPABASE_ANON_KEY (the real Supabase default)", () => {
    it("is configured when the anon key is present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;

      expect(getSupabasePublicConfig()).toEqual({
        status: "ok",
        config: { url: FAKE_URL, publishableKey: FAKE_KEY },
      });
      expect(isSupabaseConfigured()).toBe(true);
    });

    it("is still unconfigured when only the url is present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;

      expect(isSupabaseConfigured()).toBe(false);
    });

    it("is still unconfigured when only the key is present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;

      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe("accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Phase 1 alias)", () => {
    it("is configured when the publishable-key alias is present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;

      expect(isSupabaseConfigured()).toBe(true);
      const result = requireSupabasePublicConfig();
      expect(result.publishableKey).toBe(FAKE_KEY);
    });
  });

  describe("when the anon key takes precedence over the alias", () => {
    it("uses the anon key when both are present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-value";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "alias-key-value";

      const result = requireSupabasePublicConfig();
      expect(result.publishableKey).toBe("anon-key-value");
    });
  });

  describe("when variables are blank or whitespace", () => {
    it("treats an empty string as absent", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

      // Exact shape of an unfilled .env.local line — must degrade to v1.
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("treats whitespace as absent", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "\t\n";

      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe("when fully configured via anon key", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;
    });

    it("returns the resolved config", () => {
      expect(getSupabasePublicConfig()).toEqual({
        status: "ok",
        config: { url: FAKE_URL, publishableKey: FAKE_KEY },
      });
      expect(isSupabaseConfigured()).toBe(true);
    });

    it("trims surrounding whitespace", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = `  ${FAKE_URL}  `;
      expect(requireSupabasePublicConfig().url).toBe(FAKE_URL);
    });

    it("reads the environment on every call rather than caching at import", () => {
      expect(isSupabaseConfigured()).toBe(true);
      clearSupabaseEnv();
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe("requireSupabasePublicConfig", () => {
    it("returns the config when present", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_KEY;

      expect(requireSupabasePublicConfig()).toEqual({
        url: FAKE_URL,
        publishableKey: FAKE_KEY,
      });
    });

    it("throws a typed error when unconfigured", () => {
      expect(() => requireSupabasePublicConfig()).toThrow(SupabaseNotConfiguredError);

      try {
        requireSupabasePublicConfig();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(SupabaseNotConfiguredError);
        const typed = error as SupabaseNotConfiguredError;
        expect(typed.missing).toContain(SUPABASE_URL_VAR);
        expect(typed.message).toContain(SUPABASE_URL_VAR);
      }
    });

    it("never puts a variable value in the error message", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;

      try {
        requireSupabasePublicConfig();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect((error as Error).message).not.toContain(FAKE_URL);
      }
    });
  });
});
