import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full ring-1 ring-border/20 select-none',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-14 w-14 text-lg',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  ),
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const avatarBadgeVariants = cva(
  'absolute bottom-0 end-0 z-10 flex items-center justify-center rounded-full ring-2 ring-background',
  {
    variants: {
      size: {
        sm: 'h-2.5 w-2.5',
        default: 'h-3 w-3',
        lg: 'h-3.5 w-3.5',
      },
      variant: {
        online: 'bg-emerald-500',
        busy: 'bg-rose-500',
        away: 'bg-amber-500',
        offline: 'bg-muted-foreground/40',
        default: 'bg-primary text-primary-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
);

interface AvatarBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof avatarBadgeVariants> {}

const AvatarBadge = React.forwardRef<HTMLSpanElement, AvatarBadgeProps>(
  ({ className, size, variant, ...props }, ref) => (
    <span ref={ref} className={cn(avatarBadgeVariants({ size, variant, className }))} {...props} />
  ),
);
AvatarBadge.displayName = 'AvatarBadge';

const AvatarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center -space-x-2 rtl:space-x-reverse [&>*:hover]:z-10', className)}
      {...props}
    />
  ),
);
AvatarGroup.displayName = 'AvatarGroup';

const AvatarGroupCount = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof avatarVariants>
>(({ className, size, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      avatarVariants({ size }),
      'flex items-center justify-center rounded-full bg-muted font-bold text-xs text-muted-foreground ring-2 ring-background select-none',
      className,
    )}
    {...props}
  />
));
AvatarGroupCount.displayName = 'AvatarGroupCount';

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
};
