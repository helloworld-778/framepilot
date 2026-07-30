import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="border-t border-hairline/70 bg-surface-sunken/40">
      <div className="relative mx-auto w-full max-w-[88rem] overflow-hidden px-5 py-16 sm:px-8">
        <div aria-hidden className="fp-atmosphere opacity-70" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
              Bring an idea. Leave with a plan.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
              Everything runs in this browser tab. No sign-in, no uploads, no generation costs — just
              the direction work that makes generation worth doing.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/create">
              Create a scene
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
