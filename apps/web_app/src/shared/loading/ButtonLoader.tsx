import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface ButtonLoaderProps {
  className?: string;
  size?: number;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({ className, size = 16 }) => {
  return <Spinner size={size} className={cn('text-current', className)} />;
};

export default ButtonLoader;
