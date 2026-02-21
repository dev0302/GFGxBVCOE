import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AddDepartmentUnlockAnimation({ isActive, onComplete }) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsUnlocking(true);
      setIsComplete(false);
      let doneTimer;
      const timer = setTimeout(() => {
        setIsComplete(true);
        doneTimer = setTimeout(() => onComplete?.(), 800);
      }, 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(doneTimer);
      };
    } else {
      setIsUnlocking(false);
      setIsComplete(false);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / 24,
    delay: Math.random() * 0.3,
    duration: 1.2 + Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md px-4">
        <motion.div
          className="relative bg-[#252536] border border-gray-500/30 rounded-2xl p-16 shadow-xl"
          animate={
            isUnlocking
              ? {
                  boxShadow: [
                    "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                    "0 0 0 4px rgba(34, 211, 238 / 0.15)",
                    "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <AnimatePresence>
            {isUnlocking && (
              <>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-2xl border border-cyan-400/40 z-0"
                    initial={{ scale: 1, opacity: 0.3 }}
                    style={{ zIndex: -1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, delay, ease: "easeOut" }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isUnlocking &&
              particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full"
                  style={{ left: "50%", top: "50%" }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(particle.angle) * 200,
                    y: Math.sin(particle.angle) * 200,
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
          </AnimatePresence>

          <div className="relative z-10 flex flex-col items-center space-y-8">
            <motion.div
              className="relative"
              animate={isUnlocking ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <AnimatePresence>
                {isUnlocking && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border border-cyan-400/60"
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-gray-500/50"
                      initial={{ scale: 1, opacity: 0.3 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.4, repeat: Infinity }}
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.div
                className="relative w-20 h-20 rounded-full border-2 border-cyan-400 bg-[#1e1e2f] flex items-center justify-center"
                animate={
                  isUnlocking
                    ? {
                        borderColor: [
                          "rgb(34 211 238)",
                          "rgb(34 211 238 / 0.5)",
                          "rgb(34 211 238)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  repeat: isUnlocking ? Infinity : 0,
                }}
              >
                <svg
                  className="w-9 h-9 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </motion.div>
            </motion.div>

            <div className="text-center space-y-4">
              <AnimatePresence mode="wait">
                {isUnlocking && !isComplete && (
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl font-semibold text-white"
                  >
                    Activating...
                  </motion.h2>
                )}

                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <motion.h2
                      className="text-2xl font-semibold text-white"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      Unlocked
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-400"
                    >
                      Department added successfully
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isUnlocking && !isComplete && (
                <motion.div
                  className="w-48 h-px bg-gray-500/40 overflow-hidden mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-cyan-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.8, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isUnlocking && (
              <>
                {["top-left", "top-right", "bottom-left", "bottom-right"].map(
                  (corner, i) => (
                    <motion.div
                      key={corner}
                      className={`absolute w-8 h-8 border-cyan-400/60 rounded-none ${
                        corner === "top-left"
                          ? "top-0 left-0 border-t border-l"
                          : corner === "top-right"
                            ? "top-0 right-0 border-t border-r"
                            : corner === "bottom-left"
                              ? "bottom-0 left-0 border-b border-l"
                              : "bottom-0 right-0 border-b border-r"
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: [0, 0.4, 0],
                        scale: [0.8, 1, 1],
                      }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  )
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
