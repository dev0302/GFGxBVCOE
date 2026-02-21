'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accordion – vertically stacked headings that reveal content on click.
 * @param {Array<{ title: React.ReactNode, content: React.ReactNode }>} items
 * @param {boolean} [allowMultiple] - allow multiple panels open
 * @param {string} [className]
 * @param {string} [itemClassName]
 * @param {string} [triggerClassName]
 * @param {string} [contentClassName]
 */
export function Accordion({
  items = [],
  allowMultiple = false,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
}) {
  const [openIndexes, setOpenIndexes] = useState(allowMultiple ? [] : null);

  const isOpen = (index) =>
    allowMultiple
      ? Array.isArray(openIndexes) && openIndexes.includes(index)
      : openIndexes === index;

  const toggle = (index) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        (prev || []).includes(index)
          ? (prev || []).filter((i) => i !== index)
          : [...(prev || []), index]
      );
    } else {
      setOpenIndexes((prev) => (prev === index ? null : index));
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const open = isOpen(index);
        return (
          <div
            key={index}
            className={cn(
              'rounded-xl border border-white/10 overflow-hidden bg-white/[0.03]',
              itemClassName
            )}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5',
                triggerClassName
              )}
              aria-expanded={open}
              aria-controls={`accordion-content-${index}`}
              id={`accordion-trigger-${index}`}
            >
              <span className="font-semibold text-white">{item.title}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`accordion-content-${index}`}
                  role="region"
                  aria-labelledby={`accordion-trigger-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'px-5 pb-4 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5',
                      contentClassName
                    )}
                  >
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
