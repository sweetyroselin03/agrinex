import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorWidgetProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorWidget: React.FC<ErrorWidgetProps> = ({
  title = 'Unable to load data',
  message = 'There was an issue fetching this section. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">{title}</h4>
          <p className="text-amber-800/90 mt-0.5 font-medium">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorWidget;
