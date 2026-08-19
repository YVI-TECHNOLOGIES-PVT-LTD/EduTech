import React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground border-slate-200 dark:border-border',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm',
        ghost:
          'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline',
        cta: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
        hero: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg',
        heroOutline: 'border-2 border-primary text-primary hover:bg-primary/10',
      },
      size: {
        default: 'h-10 px-4 py-2 gap-2',
        xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
        sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
        md: 'h-10 px-4 text-sm rounded-xl gap-2',
        lg: 'h-11 px-6 text-base rounded-xl gap-2.5',
        xl: 'h-12 px-8 text-base rounded-xl gap-3',
        icon: 'size-10 rounded-xl',
        'icon-xs': 'size-7 rounded-lg',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);


export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <ButtonPrimitive
          ref={ref}
          data-slot="button"
          render={children}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        />
      );
    }

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
