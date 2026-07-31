import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { DEMO_BRIEF_BY_SLUG } from "@/data/demo-projects";
import { DEFAULT_SCENE_BRIEF } from "@/lib/constants";
import { generateDirection } from "@/lib/director";
import { saveProject } from "@/lib/project-store";
import { writeDraft, writePreferences } from "@/lib/storage";

/**
 * The create form has three prefill sources with an established precedence:
 * an explicit edit source, then `?demo=`, then `?direction=`, then the stored
 * preferences from the last scene the user directed. Anything unrecognised is
 * ignored in favour of the current defaults.
 */

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const NOW = "2026-05-01T10:00:00.000Z";

function checkedName(name: RegExp): HTMLElement {
  return screen.getByRole("radio", { name, checked: true });
}

async function expectChecked(name: RegExp): Promise<void> {
  await waitFor(() => expect(checkedName(name)).toBeInTheDocument());
}

describe("create form prefill", () => {
  beforeEach(() => {
    push.mockClear();
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  describe("?direction=", () => {
    it("preselects a valid direction", async () => {
      searchParams = new URLSearchParams("direction=whimsical-fantasy");
      render(<SceneBriefForm />);

      await expectChecked(/whimsical fantasy/i);
      expect(screen.getByRole("radio", { name: /documentary realism/i })).not.toBeChecked();
    });

    it("preselects every real direction id", async () => {
      for (const id of ["nonlinear-suspense", "premium-product-film"] as const) {
        searchParams = new URLSearchParams(`direction=${id}`);
        const view = render(<SceneBriefForm />);

        await waitFor(() =>
          expect(
            screen.getAllByRole("radio", { checked: true }).some((radio) =>
              radio.getAttribute("value") === id,
            ),
          ).toBe(true),
        );
        view.unmount();
      }
    });

    it("leaves runtime and ratio on their defaults", async () => {
      searchParams = new URLSearchParams("direction=nonlinear-suspense");
      render(<SceneBriefForm />);

      await expectChecked(/nonlinear suspense/i);
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /9:16 vertical/i })).toBeChecked();
      expect(DEFAULT_SCENE_BRIEF.duration).toBe(15);
      expect(DEFAULT_SCENE_BRIEF.aspectRatio).toBe("9:16");
    });

    it("falls back to the defaults when the value is not a real direction", async () => {
      searchParams = new URLSearchParams("direction=cinema-verite-deluxe");
      render(<SceneBriefForm />);

      await expectChecked(/documentary realism/i);
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
      // No invented direction appears in the group.
      expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(4);
    });

    it("ignores an empty direction parameter", async () => {
      searchParams = new URLSearchParams("direction=");
      render(<SceneBriefForm />);

      await expectChecked(/documentary realism/i);
    });
  });

  describe("stored preferences", () => {
    it("prefills direction, runtime, and ratio from the last directed scene", async () => {
      writePreferences({
        lastDirectoryId: "nonlinear-suspense",
        lastDuration: 30,
        lastAspectRatio: "16:9",
      });
      render(<SceneBriefForm />);

      await expectChecked(/nonlinear suspense/i);
      expect(screen.getByRole("radio", { name: /30 sec/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /16:9 landscape/i })).toBeChecked();
    });

    it("applies only the preferences that are stored", async () => {
      writePreferences({ lastDuration: 8 });
      render(<SceneBriefForm />);

      await waitFor(() =>
        expect(screen.getByRole("radio", { name: /8 sec/i })).toBeChecked(),
      );
      expect(screen.getByRole("radio", { name: /documentary realism/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /9:16 vertical/i })).toBeChecked();
    });

    it("never prefills the description or optional detail", async () => {
      writePreferences({ lastDirectoryId: "whimsical-fantasy", lastDuration: 30 });
      render(<SceneBriefForm />);

      await expectChecked(/whimsical fantasy/i);
      expect(screen.getByLabelText(/scene description/i)).toHaveValue("");
      expect(screen.getByLabelText(/primary subject/i)).toHaveValue("");
    });

    it("keeps the defaults when a stored preference is corrupt", async () => {
      window.localStorage.setItem(
        "framepilot:prefs:v1",
        JSON.stringify({ schemaVersion: 1, lastDuration: 11 }),
      );
      render(<SceneBriefForm />);

      await expectChecked(/documentary realism/i);
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
    });
  });

  describe("precedence", () => {
    it("lets ?direction= win over a stored preference", async () => {
      writePreferences({ lastDirectoryId: "premium-product-film", lastDuration: 30 });
      searchParams = new URLSearchParams("direction=whimsical-fantasy");
      render(<SceneBriefForm />);

      await expectChecked(/whimsical fantasy/i);
      // The direction param short-circuits the whole preference block, so the
      // stored runtime is not applied either.
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
    });

    it("lets ?demo= win over both ?direction= and preferences", async () => {
      writePreferences({ lastDirectoryId: "whimsical-fantasy", lastDuration: 8 });
      searchParams = new URLSearchParams(
        "demo=craft-collective&direction=nonlinear-suspense",
      );
      render(<SceneBriefForm />);

      const demo = DEMO_BRIEF_BY_SLUG["craft-collective"];
      expect(demo).toBeDefined();
      await waitFor(() =>
        expect(screen.getByLabelText(/primary subject/i)).toHaveValue(
          demo!.brief.primarySubject ?? "",
        ),
      );
      expect(screen.getByRole("radio", { name: /documentary realism/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /30 sec/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /1:1 square/i })).toBeChecked();
    });

    it("lets an edit source win over ?direction= and preferences", async () => {
      const source = DEMO_BRIEF_BY_SLUG["plastic-awareness"];
      expect(source).toBeDefined();
      const brief = source!.brief;
      writeDraft(brief, generateDirection(brief, { now: NOW }), NOW);
      writePreferences({ lastDirectoryId: "whimsical-fantasy", lastDuration: 8 });
      searchParams = new URLSearchParams("edit=draft&direction=premium-product-film");
      render(<SceneBriefForm />);

      await waitFor(() =>
        expect(screen.getByText(/editing your current working brief/i)).toBeInTheDocument(),
      );
      await expectChecked(/nonlinear suspense/i);
      expect(screen.getByRole("radio", { name: /30 sec/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /16:9 landscape/i })).toBeChecked();
      expect(screen.getByLabelText(/scene description/i)).toHaveValue(brief.description);
    });

    it("lets a saved project edit source win over preferences", async () => {
      const source = DEMO_BRIEF_BY_SLUG["cultural-fest"];
      expect(source).toBeDefined();
      const brief = source!.brief;
      const saved = saveProject(brief, generateDirection(brief, { now: NOW }), NOW);
      expect(saved.status).toBe("ok");
      if (saved.status !== "ok") {
        return;
      }
      writePreferences({ lastDirectoryId: "nonlinear-suspense", lastDuration: 8 });
      searchParams = new URLSearchParams(`edit=project&id=${saved.project.id}`);
      render(<SceneBriefForm />);

      await expectChecked(/whimsical fantasy/i);
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
      expect(screen.getByLabelText(/scene description/i)).toHaveValue(brief.description);
    });

    it("falls back safely when the requested edit source is gone", async () => {
      writePreferences({ lastDirectoryId: "premium-product-film", lastDuration: 30 });
      searchParams = new URLSearchParams("edit=project&id=does-not-exist");
      render(<SceneBriefForm />);

      expect(
        await screen.findByText(/that saved project is not in this browser/i),
      ).toBeInTheDocument();
      // Nothing is invented: the form stays on its defaults and stays usable.
      expect(screen.getByRole("radio", { name: /documentary realism/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /15 sec/i })).toBeChecked();
      expect(screen.getByLabelText(/scene description/i)).toHaveValue("");
      expect(
        screen.getByRole("button", { name: /direct my scene/i }),
      ).toBeInTheDocument();
    });
  });
});
