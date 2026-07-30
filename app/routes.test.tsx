import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "@/app/error";
import NotFound from "@/app/not-found";

describe("not-found route", () => {
  it("explains the miss and offers a way back", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /this shot is not in the plan/i,
    );
    expect(screen.getByRole("link", { name: /create a scene/i })).toHaveAttribute(
      "href",
      "/create",
    );
    expect(screen.getByRole("link", { name: /saved projects/i })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("link", { name: /back to start/i })).toHaveAttribute("href", "/");
  });
});

describe("error boundary", () => {
  it("offers a recovery action that re-renders the segment", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /something broke mid-take/i,
    );

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("reassures the user that stored work is untouched", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByText(/your saved work is untouched/i)).toBeInTheDocument();
  });

  it("shows a reference when Next provides a digest", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(screen.getByText(/reference: abc123/i)).toBeInTheDocument();
  });

  it("omits the reference line when there is no digest", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.queryByText(/reference:/i)).not.toBeInTheDocument();
  });
});
