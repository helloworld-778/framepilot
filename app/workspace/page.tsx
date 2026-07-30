import type { Metadata } from "next";

import { ResultsWorkspace } from "@/components/workspace/results-workspace";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "Your editable storyboard, master prompt, negative prompt, and production-readiness checks.",
};

export default function WorkspacePage() {
  return <ResultsWorkspace />;
}

