import React from 'react';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = (props) => {
  return <ShadcnSkeleton {...props} />;
};

export default Skeleton;
