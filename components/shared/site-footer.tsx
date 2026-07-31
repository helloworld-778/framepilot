import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline/80 bg-canvas-deep/40">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-2 px-5 py-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          {APP_NAME} — pre-production and prompt intelligence. Plans are generated locally in your
          browser.
        </p>
        <p>No model calls, no accounts, no uploads.</p>
      </div>
    </footer>
  );
}

