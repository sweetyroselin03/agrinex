import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badgeText?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  badgeText,
  action,
}) => {
  return (
    <div className="farm-card p-6 sm:p-7 mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-2xl text-[#185C2B] shrink-0 border border-[#E0E7D8]">
            {icon}
          </div>
        )}
        <div>
          {badgeText && (
            <span className="text-[10px] font-black uppercase tracking-wider text-[#185C2B] bg-[#EEF3E8] px-2.5 py-0.5 rounded-full inline-block mb-1 border border-[#E0E7D8]">
              {badgeText}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#5B7065] font-medium mt-0.5 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
};

export default PageHeader;
