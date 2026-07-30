"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` makes every Framer Motion animation in the tree honour
 * the OS setting, so we never have to remember to check it per component.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
