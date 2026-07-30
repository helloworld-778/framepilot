import type { Metadata } from "next";

import { ProjectList } from "@/components/projects/project-list";

export const metadata: Metadata = {
  title: "Saved projects",
  description:
    "Every scene you have saved in this browser, with its creative direction, runtime, and production-readiness score.",
};

export default function ProjectsPage() {
  return <ProjectList />;
}

