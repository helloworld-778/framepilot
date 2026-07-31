import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
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
const FAKE_KEY = "sb_publishable_not-a-real-key";

function clearSupabaseEnv(): void {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

describe("supabase env helper", () => {
  beforeEach(clearSupabaseEnv);
  afterEach(clearSupabaseEnv);

  describe("when nothing is configured", () => {
    it("reports unconfigured instead of throwing", () => {
      expect(() => getSupabasePublicConfig()).not.toThrow();
      expect(getSupabasePublicConfig()).toEqual({
        status: "unconfigured",
        missing: [SUPABASE_URL_VAR, SUPABASE_PUBLISHABLE_KEY_VAR],
      });
    });

    it("answers the explicit configured check with false", () => {
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("names every missing variable so a developer can act on it", () => {
      const result = getSupabasePublicConfig();
      expect(result.status).toBe("unconfigured");
      if (result.status === "unconfigured") {
        expect(result.missing).toContain(SUPABASE_URL_VAR);
        expect(result.missing).toContain(SUPABASE_PUBLISHABLE_KEY_VAR);
      }
    });
  });

  describe("when only one variable is present", () => {
    it("is still unconfigured, reporting just the absent key", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;

      const result = getSupabasePublicConfig();
      expect(result).toEqual({
        status: "unconfigured",
        missing: [SUPABASE_PUBLISHABLE_KEY_VAR],
      });
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("is still unconfigured, reporting just the absent url", () => {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;

      expect(getSupabasePublicConfig()).toEqual({
        status: "unconfigured",
        missing: [SUPABASE_URL_VAR],
      });
    });
  });

  describe("when variables are blank or whitespace", () => {
    it("treats an empty string as absent", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";

      // This is the exact shape of an unfilled `.env.local` line, so it must
      // degrade to v1 rather than produce a client pointed at "".
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("treats whitespace as absent", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "\t\n";

      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe("when fully configured", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;
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
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = FAKE_KEY;

      expect(requireSupabasePublicConfig()).toEqual({
        url: FAKE_URL,
        publishableKey: FAKE_KEY,
      });
    });

    it("throws a typed error listing the missing variable names", () => {
      expect(() => requireSupabasePublicConfig()).toThrow(SupabaseNotConfiguredError);

      try {
        requireSupabasePublicConfig();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(SupabaseNotConfiguredError);
        const typed = error as SupabaseNotConfiguredError;
        expect(typed.missing).toEqual([
          SUPABASE_URL_VAR,
          SUPABASE_PUBLISHABLE_KEY_VAR,
        ]);
        expect(typed.message).toContain(SUPABASE_URL_VAR);
      }
    });

    it("never puts a variable's value in the error message", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_URL;

      try {
        requireSupabasePublicConfig();
        expect.unreachable("should have thrown");
      } catch (error) {
        // Only names leak, never values — this is the whole point of the helper.
        expect((error as Error).message).not.toContain(FAKE_URL);
      }
    });
  });
});
