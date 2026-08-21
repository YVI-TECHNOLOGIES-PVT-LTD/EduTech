import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  spinnerPlacement?: 'start' | 'end';
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      spinnerPlacement = 'start',
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Button ref={ref} disabled={disabled || isLoading} className={cn(className)} {...props}>
        {isLoading && spinnerPlacement === 'start' && <Spinner size="sm" className="mr-2" />}
        {isLoading && loadingText ? loadingText : children}
        {isLoading && spinnerPlacement === 'end' && <Spinner size="sm" className="ml-2" />}
      </Button>
    );
  },
);

LoadingButton.displayName = 'LoadingButton';
