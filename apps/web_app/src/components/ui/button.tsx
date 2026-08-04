import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:scale-[1.015]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-premium-sm hover:shadow-premium-md hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-premium-sm",
        outline: "border border-border bg-background text-foreground hover:bg-muted/80 hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md shadow-premium-sm",
        ghost: "hover:bg-muted/80 hover:text-foreground active:scale-100 hover:scale-100",
        link: "text-primary underline-offset-4 hover:underline active:scale-100 hover:scale-100",
        // Custom variants for the school website
        cta: "bg-primary text-primary-foreground font-bold shadow-lg shadow-premium-md hover:bg-primary/90 hover:shadow-glow-lg",
        ctaOutline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold",
        hero: "bg-primary text-primary-foreground font-extrabold text-base px-8 py-4 shadow-xl shadow-premium-lg hover:bg-primary/95",
        heroOutline: "border-2 border-white/80 text-white font-bold hover:bg-white/10 backdrop-blur-sm",
        nav: "text-foreground/80 hover:text-foreground hover:bg-muted/50 font-semibold active:scale-100 hover:scale-100",
        navActive: "text-primary bg-primary/10 font-bold active:scale-100 hover:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        xl: "h-15 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
