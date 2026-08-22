"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimationValues = Record<string, string | number>;

type BlurTextProps = {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: AnimationValues;
  animationTo?: AnimationValues[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

function buildKeyframes(from: AnimationValues, steps: AnimationValues[]) {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  return Object.fromEntries([...keys].map((key) => [key, [from[key], ...steps.map((step) => step[key])]]));
}

export function BlurText({
  text,
  delay = 80,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  onAnimationComplete,
  stepDuration = 0.3,
}: BlurTextProps) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const defaultFrom = useMemo<AnimationValues>(
    () => ({ filter: "blur(10px)", opacity: 0, y: direction === "top" ? -28 : 28 }),
    [direction],
  );
  const defaultTo = useMemo<AnimationValues[]>(
    () => [
      { filter: "blur(4px)", opacity: 0.55, y: direction === "top" ? 4 : -4 },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  const from = animationFrom ?? defaultFrom;
  const to = animationTo ?? defaultTo;
  const times = Array.from({ length: to.length + 1 }, (_, index) => index / to.length);

  return (
    <p ref={ref} className={className}>
      {elements.map((segment, index) => (
        <motion.span
          className="inline-block will-change-[transform,filter,opacity]"
          key={`${segment}-${index}`}
          initial={from}
          animate={inView ? buildKeyframes(from, to) : from}
          transition={{ duration: stepDuration * to.length, times, delay: (index * delay) / 1000 }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment || "\u00A0"}
          {animateBy === "words" && index < elements.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </p>
  );
}
