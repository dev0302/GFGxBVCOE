import { cn } from "../../lib/utils";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  // icon,
  img,
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col rounded-xl border border-neutral-200 bg-white transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none",
        className
      )}
    >
      {/* Image or Header */}
      {img ? (
        <div className="w-full h-48  flex-shrink-0">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        header
      )}

      {/* Content */}
      <div className="flex flex-col justify-between p-4 flex-grow min-h-[4rem]">
        {/* {<div className="mb-2">{icon}</div>} */}
        <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200">
          {title}
        </div>
        <div
          className="mt-1 font-sans text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 group-hover/bento:line-clamp-none transition-all duration-200"
        >
          {description}
        </div>
      </div>
    </div>
  );
};
