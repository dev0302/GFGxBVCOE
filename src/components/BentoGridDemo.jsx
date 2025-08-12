import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import gfg1 from "../images/gfg1.jpg";
import gfg2 from "../images/gfg2.jpg";
import gfg3 from "../images/gfg3.jpg";
import gfg4 from "../images/gfg4.jpg";
import gfg5 from "../images/gfg5.jpg";

import {
  ClipboardCopy,
  FileX,
  PenTool,
  Columns,
  TrendingUp,
  AlignStartVertical,
  AlignEndHorizontal,
} from "lucide-react";

export default function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={
            item.img ? (
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Skeleton />
            )
          }
        //   icon={item.icon}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

const items = [
  {
    title: "The Dawn of Innovation",
    description: "Explore the birth of groundbreaking ideas and inventions.",
    img: gfg1,
    // icon: <ClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Digital Revolution",
    description: "Dive into the transformative power of technology.",
    img: gfg2,
    // icon: <FileX className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Art of Design",
    description: "Discover the beauty of thoughtful and functional design.",
    img: gfg3,
    // icon: <PenTool className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Power of Communication",
    description: "Understand the impact of effective communication in our lives.",
    img: gfg4,
    // icon: <Columns className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Pursuit of Knowledge",
    description: "Join the quest for understanding and enlightenment.",
    img: gfg5,
    // icon: <TrendingUp className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Joy of Creation",
    description: "Experience the thrill of bringing ideas to life.",
    img: "https://via.placeholder.com/300x200",
    // icon: <AlignStartVertical className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "The Spirit of Adventure",
    description: "Embark on exciting journeys and thrilling discoveries.",
    img: "https://via.placeholder.com/300x200",
    // icon: <AlignEndHorizontal className="h-4 w-4 text-neutral-500" />,
  },
];
