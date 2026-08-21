import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: 'sm' | 'default' | 'lg' | 'xl' | number;
  label?: string;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  default: 'h-4 w-4',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'default', label = 'Loading', ...props }, ref) => {
    const sizeClass = typeof size === 'number' ? undefined : sizeMap[size] || sizeMap.default;
    const style =
      typeof size === 'number' ? { width: size, height: size, ...props.style } : props.style;

    return (
      <span className="inline-flex items-center justify-center">
        <Loader2
          ref={ref}
          role="status"
          aria-label={label}
          aria-live="polite"
          data-slot="spinner"
          style={style}
          className={cn('animate-spin text-current shrink-0', sizeClass, className)}
          {...props}
        />
        <span className="sr-only">{label}</span>
      </span>
    );
  },
);

Spinner.displayName = 'Spinner';

export { Spinner };
