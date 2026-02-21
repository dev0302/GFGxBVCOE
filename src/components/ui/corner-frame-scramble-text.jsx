'use client';

import { TextScramble } from '@/components/ui/text-scramble';
import { cn } from '@/lib/utils';

const frameBg =
  'bg-[linear-gradient(to_right,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_right,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_left,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_left,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_bottom,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_bottom,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_top,var(--foreground)_1.5px,transparent_1.5px),linear-gradient(to_top,var(--foreground)_1.5px,transparent_1.5px)] bg-[length:15px_15px] bg-no-repeat bg-[position:0_0,0_100%,100%_0,100%_100%,0_0,100%_0,0_100%,100%_100%]';

export default function CornerFrameScrambleText({
  value,
  className,
  textClassName,
  as,
  loop = false,
  loopDelay = 2000,
  ...props
}) {
  const displayValue = value !== undefined && value !== null ? String(value) : '';
  return (
    <div
      className={cn(
        'relative inline-block px-6 py-3',
        frameBg,
        className
      )}
      {...props}
    >
      <TextScramble as={as} className={cn('relative z-10', textClassName)} loop={loop} loopDelay={loopDelay}>
        {displayValue}
      </TextScramble>
    </div>
  );
}
