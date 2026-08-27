import React, { useEffect, useState } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FadeContentProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  blur?: boolean;
}

export const FadeContent: React.FC<FadeContentProps> = ({
  children,
  className = '',
  duration = 0.4,
  delay = 0,
  direction = 'up',
  distance = 12,
  blur = false,
  ...props
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const getInitialPosition = () => {
    if (prefersReducedMotion) return {};
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      case 'none':
      default:
        return {};
    }
  };

  const variants: Variants = {
    hidden: {
      opacity: prefersReducedMotion ? 1 : 0,
      filter: blur && !prefersReducedMotion ? 'blur(4px)' : 'none',
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      filter: 'none',
      x: 0,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FadeContent;
