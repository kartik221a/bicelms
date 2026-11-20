"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * SplitText (React Bits style): headline words rise and blur into place
 * with a per-word stagger. Optionally highlight specific words in brand red
 * by passing their index (0-based) in `accent`.
 */
export function SplitText({
  text,
  className,
  wordClassName,
  accent = [],
  delay = 0,
  stagger = 0.055,
  once = true,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  /** indexes of words rendered in animated brand-red gradient */
  accent?: number[];
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <motion.span
      className={cn("inline-block", className)}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, i) => {
        const isAccent = accent.includes(i);
        return (
          <motion.span
            key={`${word}-${i}`}
            aria-hidden
            className={cn(
              "inline-block will-change-transform",
              isAccent ? "gradient-text-red" : wordClassName
            )}
            variants={{
              hidden: { opacity: 0, y: 22, rotateX: -55, filter: "blur(6px)" },
              show: {
                opacity: 1,
                y: 0,
                rotateX: 0,
                filter: "blur(0px)",
                transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
              },
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
