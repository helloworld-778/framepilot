import type { Metadata } from "next";
import { Suspense } from "react";

import { SceneBriefForm } from "@/components/scene-form/scene-brief-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create a scene",
  description:
    "Write a short scene brief, choose a creative direction, and get a shot-by-shot production plan.",
};

function FormFallback() {
  return (
    <div className="mx-auto w-full max-w-[88rem] space-y-6 px-5 py-12 sm:px-8">
      <Skeleton className="h-10 w-72 bg-surface-raised" />
      <Skeleton className="h-40 w-full bg-surface-raised" />
      <Skeleton className="h-24 w-full bg-surface-raised" />
    </div>
  );
}

export default function CreatePage() {
  return (
    // useSearchParams needs a Suspense boundary so the shell can still prerender.
    <Suspense fallback={<FormFallback />}>
      <SceneBriefForm />
    </Suspense>
  );
}

