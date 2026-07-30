import type { Metadata } from "next";

import { ResultsWorkspace } from "@/components/workspace/results-workspace";

export const metadata: Metadata = {
  title: "Saved project",
  description:
    "A saved storyboard with its shot direction, prompts, and production-readiness checks.",
};

/**
 * `params` is a promise in Next 16. Projects live in the browser, so this route
 * is only a shell: the id is handed to the client workspace, which reads the
 * record from local storage.
 */
export default async function SavedProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <ResultsWorkspace source={{ kind: "project", id }} />;
}

