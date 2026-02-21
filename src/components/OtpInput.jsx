import { motion } from "framer-motion";
import { useRef, useEffect } from "react";

export const OtpInput = ({ value, onChange, disabled }) => {
  const inputs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow only numbers
    if (!/^\d*$/.test(val)) return;

    const otpArray = value.split("");
    // Take only the last character entered
    otpArray[index] = val.slice(-1);
    const newOtp = otpArray.join("");
    onChange(newOtp);

    // Move focus forward
    if (val && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move focus back on backspace
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative flex-1">
          <motion.input
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={disabled}
            // iOS Dynamic Animation
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileFocus={{ 
              scale: 1.1, 
              y: -4,
              borderColor: "#06b6d4", // cyan-500
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`w-full aspect-square text-center text-2xl font-bold rounded-2xl bg-[#252536]/50 border-2 outline-none transition-all
              ${value[i] 
                ? "border-cyan-500 text-white" 
                : "border-gray-500/30 text-gray-400 focus:bg-[#252536]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}`}
          />
          
          {/* Animated Indicator for active empty slot */}
          {value.length === i && !disabled && (
            <motion.div
              layoutId="cursor"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-1 bg-cyan-500 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};