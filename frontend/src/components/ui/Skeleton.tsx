import React from 'react';

export const SkeletonText: React.FC<{ className?: string }> = ({ className = 'h-4 w-3/4' }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = 'h-48' }) => (
  <div className={`farm-card p-6 space-y-3 ${className}`}>
    <div className="skeleton-shimmer h-6 w-1/3 rounded-lg" />
    <div className="skeleton-shimmer h-4 w-full rounded-lg" />
    <div className="skeleton-shimmer h-4 w-2/3 rounded-lg" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number; height?: string }> = ({
  count = 3,
  height = 'h-16',
}) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`skeleton-shimmer ${height} w-full rounded-2xl`} />
    ))}
  </div>
);
