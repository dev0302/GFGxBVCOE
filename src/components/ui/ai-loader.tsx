import * as React from "react";
import "./ai-loader.css";

export interface AILoaderProps {
  size?: number;
  text?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({
  size = 180,
  text = "Generating",
}) => {
  const letters = text.split("");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-lg backdrop-saturate-150 dark:bg-black/35"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="relative flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="ai-loader-animate-letter inline-block text-richblack-25 opacity-40 dark:text-gray-800"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}

        <div className="ai-loader-animate-circle absolute inset-0 rounded-full" />
      </div>
    </div>
  );
};

/** Alias for compatibility with the provided snippet */
export const Component = AILoader;
