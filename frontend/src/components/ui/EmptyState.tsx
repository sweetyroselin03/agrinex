import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌱',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`farm-card p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="w-16 h-16 rounded-3xl bg-[#EEF3E8] border border-[#E0E7D8] flex items-center justify-center text-3xl shadow-sm">
        {icon}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-black text-[#123B24]">{title}</h3>
        {description && (
          <p className="text-xs text-[#5B7065] leading-relaxed font-medium">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
