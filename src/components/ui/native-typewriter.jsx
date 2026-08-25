import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Types out content character by character with an optional blinking cursor.
 * @param {string} content      - Full text to type
 * @param {string} [className]  - Tailwind/style classes for the text
 * @param {number} [speed=40]   - Delay in ms between typed characters
 * @param {boolean} [cursor=true] - Show blinking cursor
 * @param {boolean} [loop=false]  - Loop indefinitely (type → pause → delete → repeat)
 * @param {number} [deleteSpeed=30] - Delay in ms between deleted characters
 * @param {number} [pauseMs=1800]   - Pause in ms after fully typed before deleting
 */
export function NativeTypewriter({
  content = "",
  className,
  speed = 40,
  cursor = true,
  loop = false,
  deleteSpeed = 30,
  pauseMs = 1800,
  ...props
}) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  // phase: "typing" | "pausing" | "deleting" | "restarting"
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    if (!loop) {
      // Original one-shot behaviour
      if (index >= content.length) return;
      const t = setTimeout(() => {
        setDisplayed((prev) => prev + content[index]);
        setIndex((i) => i + 1);
      }, speed);
      return () => clearTimeout(t);
    }

    // ── Looping behaviour ──
    if (phase === "typing") {
      if (index >= content.length) {
        // Finished typing — pause before deleting
        const t = setTimeout(() => setPhase("deleting"), pauseMs);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setDisplayed((prev) => prev + content[index]);
        setIndex((i) => i + 1);
      }, speed);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length === 0) {
        // Finished deleting — brief pause then restart
        const t = setTimeout(() => {
          setIndex(0);
          setPhase("typing");
        }, speed * 3);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setDisplayed((prev) => prev.slice(0, -1));
      }, deleteSpeed);
      return () => clearTimeout(t);
    }
  }, [index, displayed, phase, content, speed, deleteSpeed, pauseMs, loop]);

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
