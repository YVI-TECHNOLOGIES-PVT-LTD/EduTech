import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        primary: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-xs',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive',
        outline: 'border-border/80 bg-background text-foreground',
        success:
          'border-emerald-200/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 dark:border-emerald-800',
        warning:
          'border-amber-200/80 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 dark:border-amber-800',
        info: 'border-indigo-200/80 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 dark:border-indigo-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
