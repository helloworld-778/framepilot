import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PromptPanel } from "@/components/workspace/prompt-panel";
import { DEMO_BRIEFS } from "@/data/demo-projects";
import { generateDirection } from "@/lib/director";

const demo = DEMO_BRIEFS[0];
if (!demo) {
  throw new Error("Demo briefs are missing");
}
const output = generateDirection(demo.brief);

const writeText = vi.fn<(value: string) => Promise<void>>();

/**
 * `userEvent.setup()` installs its own clipboard stub, so ours has to be
 * attached afterwards to be the one under test.
 */
function setupWithClipboard() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return user;
}

describe("PromptPanel", () => {
  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
  });

  it("copies the master prompt exactly as generated", async () => {
    const user = setupWithClipboard();
    render(<PromptPanel output={output} />);

    await user.click(screen.getByRole("button", { name: /^copy prompt$/i }));

    expect(writeText).toHaveBeenCalledWith(output.masterPrompt);
  });

  it("copies the negative prompt exactly as generated", async () => {
    const user = setupWithClipboard();
    render(<PromptPanel output={output} />);

    await user.click(screen.getByRole("button", { name: /copy negative prompt/i }));

    expect(writeText).toHaveBeenCalledWith(output.negativePrompt);
  });

  it("confirms the copy to screen readers and on the button", async () => {
    const user = setupWithClipboard();
    render(<PromptPanel output={output} />);

    await user.click(screen.getByRole("button", { name: /^copy prompt$/i }));

    expect(await screen.findByText(/copy prompt: copied to clipboard/i)).toBeInTheDocument();
  });

  it("surfaces a copy failure instead of pretending it worked", async () => {
    writeText.mockRejectedValue(new Error("blocked"));
    const user = setupWithClipboard();
    render(<PromptPanel output={output} />);

    await user.click(screen.getByRole("button", { name: /^copy prompt$/i }));

    // The button label and the live-region announcement both report it.
    expect(await screen.findAllByText(/copy failed/i)).toHaveLength(2);
  });

  it("renders both prompts in full", () => {
    render(<PromptPanel output={output} />);

    expect(screen.getByText(output.negativePrompt)).toBeInTheDocument();
    expect(screen.getByText(/FORMAT: 9:16 aspect ratio/)).toBeInTheDocument();
  });
});

