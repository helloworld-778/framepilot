"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Short, refined entrance stagger. `MotionProvider` sets
 * `reducedMotion="user"`, so these collapse to a plain fade-free mount for
 * anyone who asks for less motion — usability is never delayed by animation.
 */

const DURATION = 0.36;
const EASE = [0.22, 0.61, 0.36, 1] as const;

export function StaggerGroup({
  children,
  delay = 0,
  stagger = 0.06,
  className,
  inView = true,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
  /** When false, animates on mount instead of on scroll. */
  inView?: boolean;
}) {
  const variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      {...(inView
        ? { whileInView: "shown", viewport: { once: true, margin: "-56px" } }
        : { animate: "shown" })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 10,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        shown: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
