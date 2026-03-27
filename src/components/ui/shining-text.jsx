"use client";

import * as React from "react";
import { motion } from "motion/react";

export function ShiningText({ text, className = "" }) {
  return (
    <motion.h1
      className={`bg-[linear-gradient(110deg,rgba(147,51,234,0.35),35%,rgba(233,213,255,0.95),50%,rgba(147,51,234,0.35),75%,rgba(147,51,234,0.35))] bg-[length:200%_100%] bg-clip-text text-base font-regular text-transparent ${className}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.h1>
  );
}

