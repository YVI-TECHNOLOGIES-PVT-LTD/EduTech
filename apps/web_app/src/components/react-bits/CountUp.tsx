import React, { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useTransform, animate } from 'framer-motion';

export interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
  formatter?: (value: number) => string;
  whileInView?: boolean;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.2,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
  formatter,
  whileInView = true,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [hasStarted, setHasStarted] = useState(!whileInView);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (formatter) return formatter(from);
    return `${prefix}${from.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  });

  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => {
    if (formatter) {
      return formatter(latest);
    }
    const fixed = Number(latest.toFixed(decimals));
    const parts = fixed.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    if (decimals > 0) {
      parts[1] = (parts[1] || '').padEnd(decimals, '0');
      return `${prefix}${parts.join('.')}${suffix}`;
    }
    return `${prefix}${parts[0]}${suffix}`;
  });

  useEffect(() => {
    if (whileInView && inView && !hasStarted) {
      setHasStarted(true);
    }
  }, [inView, whileInView, hasStarted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      if (formatter) {
        setDisplayValue(formatter(to));
      } else {
        const parts = to.toFixed(decimals).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        const formatted = decimals > 0 ? parts.join('.') : parts[0];
        setDisplayValue(`${prefix}${formatted}${suffix}`);
      }
      return;
    }

    if (!hasStarted) return;

    const controls = animate(count, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });

    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [to, hasStarted, duration, delay, decimals, prefix, suffix, separator, formatter]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
};

export default CountUp;
