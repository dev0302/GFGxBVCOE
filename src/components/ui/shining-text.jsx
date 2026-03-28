"use client";

import * as React from "react";
import { motion } from "motion/react";

export function ShiningText({ text, className = "" }) {
  return (
    <motion.h1
     className={`bg-[linear-gradient(110deg,rgba(15,118,110,0.9),35%,rgba(153,246,228,1),50%,rgba(20,184,166,0.9),75%,rgba(15,118,110,0.9))] bg-[length:200%_100%] bg-clip-text text-base font-regular text-transparent ${className}`}
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

