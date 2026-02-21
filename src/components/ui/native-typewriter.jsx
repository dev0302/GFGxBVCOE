import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Types out content character by character with an optional blinking cursor.
 * @param {string} content - Full text to type
 * @param {string} [className] - Tailwind/style classes for the text
 * @param {number} [speed=40] - Delay in ms between characters
 * @param {boolean} [cursor=true] - Show blinking cursor
 */
export function NativeTypewriter({
  content = "",
  className,
  speed = 40,
  cursor = true,
  ...props
}) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= content.length) return;
    const t = setTimeout(() => {
      setDisplayed((prev) => prev + content[index]);
      setIndex((i) => i + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [index, content, speed]);

  return (
    <span className={cn("inline", className)} {...props}>
      {displayed}
      {cursor && (
        <span
          className="inline-block w-0.5 h-[1em] align-baseline bg-current ml-0.5 animate-pulse"
          aria-hidden
        />
      )}
    </span>
  );
}
