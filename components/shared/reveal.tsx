"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One small entrance animation, reused. `MotionProvider` already honours
 * prefers-reduced-motion, so this is a no-op for users who ask for less motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
