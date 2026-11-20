"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * FlipWords (Aceternity style): rotates through words with an animated
 * flip — used for hero subheadlines ("for analysts / accountants / teams").
 */
export function FlipWords({
  words,
  interval = 2600,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  if (words.length <= 1) return <span className={className}>{words[0]}</span>;

  return (
    <span className={cn("relative inline-block align-baseline", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={reduce ? false : { opacity: 0, y: 14, rotateX: -70 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -14, rotateX: 70 }}
          transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="inline-block font-bold text-red-600"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
