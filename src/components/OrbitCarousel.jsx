import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

// --- Data: team members ---
// Replace name / position / avatar with your actual team data
const people = [
  {
    id: 1,
    name: "Aarav Sharma",
    position: "Chairperson",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=AS",
  },
  {
    id: 2,
    name: "Priya Mehta",
    position: "Vice Chairperson",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=PM",
  },
  {
    id: 3,
    name: "Rohan Verma",
    position: "General Secretary",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=RV",
  },
  {
    id: 4,
    name: "Ananya Gupta",
    position: "Treasurer",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=AG",
  },
  {
    id: 5,
    name: "Karan Malhotra",
    position: "Technical Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=KM",
  },
  {
    id: 6,
    name: "Ishita Rao",
    position: "Design Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=IR",
  },
  {
    id: 7,
    name: "Dev Kapoor",
    position: "Events Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=DK",
  },
  {
    id: 8,
    name: "Sara Khan",
    position: "PR Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=SK",
  },
  {
    id: 9,
    name: "Yash Trivedi",
    position: "Content Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=YT",
  },
  {
    id: 10,
    name: "Neha Joshi",
    position: "Marketing Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=NJ",
  },
  {
    id: 11,
    name: "Arjun Bansal",
    position: "Operations Head",
    avatar: "https://placehold.co/200x200/1e1e3f/ffffff?text=AB",
  },
];

// --- Utility for fallback images ---
const safeImage = (e) => {
  const target = e.target;
  target.src = "https://placehold.co/200x200/1e1e3f/ffffff?text=?";
};

// --- Custom hook for responsive detection ---
const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState("lg");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize("xs");
      else if (width < 640) setScreenSize("sm");
      else if (width < 768) setScreenSize("md");
      else setScreenSize("lg");
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return screenSize;
};

// --- Main Component ---
export default function OrbitCarousel() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const screenSize = useResponsive();

  // Responsive sizing — ellipse spreads vertically below `sm`, horizontally from `sm` up
  const getResponsiveValues = () => {
    switch (screenSize) {
      case "xs":
        return {
          radiusX: 160,
          radiusY: 165,
          profileSize: 42,
          cardWidth: "w-36",
          avatarSize: "w-12 h-12",
          avatarMargin: "-mt-8",
          fontSize: { name: "text-sm", position: "text-xs" },
          containerWidth: 260,
          containerHeight: 420,
        };
      case "sm":
        return {
          radiusX: 190,
          radiusY: 110,
          profileSize: 50,
          cardWidth: "w-40",
          avatarSize: "w-14 h-14",
          avatarMargin: "-mt-9",
          fontSize: { name: "text-base", position: "text-xs" },
          containerWidth: 480,
          containerHeight: 320,
        };
      case "md":
        return {
          radiusX: 280,
          radiusY: 130,
          profileSize: 62,
          cardWidth: "w-44",
          avatarSize: "w-16 h-16",
          avatarMargin: "-mt-10",
          fontSize: { name: "text-base", position: "text-sm" },
          containerWidth: 660,
          containerHeight: 360,
        };
      default:
        return {
          radiusX: 380,
          radiusY: 200,
          profileSize: 76,
          cardWidth: "w-52",
          avatarSize: "w-20 h-20",
          avatarMargin: "-mt-12",
          fontSize: { name: "text-lg", position: "text-sm" },
          containerWidth: 880,
          containerHeight: 420,
        };
    }
  };

  const {
    radiusX,
    radiusY,
    profileSize,
    cardWidth,
    avatarSize,
    avatarMargin,
    fontSize,
    containerWidth,
    containerHeight,
  } = getResponsiveValues();

  // Calculate elliptical x/y position for each profile
  const getPosition = React.useCallback(
    (index) => {
      const angle = ((index - activeIndex) * (2 * Math.PI)) / people.length - Math.PI / 2;
      return {
        x: containerWidth / 2 + radiusX * Math.cos(angle) - profileSize / 2,
        y: containerHeight / 2 + radiusY * Math.sin(angle) - profileSize / 2,
      };
    },
    [activeIndex, radiusX, radiusY, containerWidth, containerHeight, profileSize]
  );

  // Navigation
  const next = () => setActiveIndex((i) => (i + 1) % people.length);
  const prev = () => setActiveIndex((i) => (i - 1 + people.length) % people.length);

  const handleProfileClick = React.useCallback(
    (index) => {
      if (index === activeIndex) return;
      setActiveIndex(index);
    },
    [activeIndex]
  );

  const handleViewAll = () => {
    // Plain React (no router assumed) - swap for useNavigate() if you use react-router-dom
    window.location.href = "/team";
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") prev();
      else if (event.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-rotation
  React.useEffect(() => {
    if (isHovering) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div
      className="flex flex-col items-center p-2 sm:p-4 justify-center relative min-h-[350px] sm:min-h-[300px] transition-colors duration-300"
      style={{ backgroundColor: "#161629" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerWidth, height: containerHeight }}
      >
        {/* Active Person Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={people[activeIndex].id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className={`z-10 backdrop-blur-sm shadow-xl shadow-black/40 rounded-xl p-2 sm:p-3 md:p-4 ${cardWidth} text-center border border-white/10`}
            style={{ backgroundColor: "#1e1e3f" }}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              src={people[activeIndex].avatar}
              alt={people[activeIndex].name}
              onError={safeImage}
              className={`${avatarSize} rounded-full mx-auto ${avatarMargin} border-4 object-cover shadow-md`}
              style={{ borderColor: "#161629" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <h2 className={`mt-2 font-bold text-white ${fontSize.name}`}>
                {people[activeIndex].name}
              </h2>
              <div className={`flex items-center justify-center text-indigo-300 mt-1 ${fontSize.position}`}>
                <span className="truncate">{people[activeIndex].position}</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center mt-2 sm:mt-3 space-x-1 sm:space-x-2"
            >
              <button
                onClick={prev}
                className="p-1 sm:p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-300 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={handleViewAll}
                className="flex items-center gap-1 px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Users size={13} />
                View All
              </button>
              <button
                onClick={next}
                className="p-1 sm:p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={14} className="text-gray-300 sm:w-4 sm:h-4" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Orbiting Profiles (elliptical layout) */}
        {people.map((p, i) => {
          const { x, y } = getPosition(i);
          const isActive = i === activeIndex;

          return (
            <motion.div
              key={p.id}
              animate={{ left: x, top: y }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
                delay: isActive ? 0 : Math.abs(i - activeIndex) * 0.03,
              }}
              style={{
                width: profileSize,
                height: profileSize,
                position: "absolute",
                zIndex: isActive ? 20 : 10,
              }}
            >
              <motion.img
                src={p.avatar}
                alt={p.name}
                onError={safeImage}
                onClick={() => handleProfileClick(i)}
                whileHover={{
                  scale: 1.15,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                className={`w-full h-full object-cover rounded-full cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "border-4 border-indigo-400 shadow-lg"
                    : "border-2 border-white/20 hover:border-indigo-400"
                }`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
        {people.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
              index === activeIndex ? "bg-indigo-400" : "bg-white/20"
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}
