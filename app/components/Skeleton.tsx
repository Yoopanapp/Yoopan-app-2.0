import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div 
      // CHANGEMENT ICI : bg-gray-200 (jour) vs dark:bg-slate-800 (nuit)
      className={`animate-pulse bg-gray-200 dark:bg-slate-800/80 rounded-md ${className}`} 
    />
  );
};