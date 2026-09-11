import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  const contents = Array.isArray(content) ? content : [content];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing");

  const currentContent = contents[quoteIndex] || "";

  useEffect(() => {
    if (!loop) {
      if (displayed.length >= currentContent.length) return;

      const timer = setTimeout(() => {
        setDisplayed(currentContent.slice(0, displayed.length + 1));
      }, speed);

      return () => clearTimeout(timer);
    }

    // TYPE
    if (phase === "typing") {
      if (displayed.length < currentContent.length) {
        const timer = setTimeout(() => {
          setDisplayed(currentContent.slice(0, displayed.length + 1));
        }, speed);

        return () => clearTimeout(timer);
      }

      // Finished typing → wait
      const timer = setTimeout(() => {
        setPhase("deleting");
      }, pauseMs);

      return () => clearTimeout(timer);
    }

    // DELETE
    if (phase === "deleting") {
      if (displayed.length > 0) {
        const timer = setTimeout(() => {
          setDisplayed((prev) => prev.slice(0, -1));
        }, deleteSpeed);

        return () => clearTimeout(timer);
      }

      // Finished deleting → next quote
      const timer = setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % contents.length);
        setPhase("typing");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    displayed,
    phase,
    quoteIndex,
    currentContent,
    speed,
    deleteSpeed,
    pauseMs,
    loop,
    contents.length,
  ]);

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