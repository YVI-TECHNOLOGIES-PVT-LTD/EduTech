import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonLoaderProps {
  className?: string;
  size?: number;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({ className, size = 16 }) => {
  return <Loader2 className={cn('animate-spin text-current', className)} size={size} />;
};
