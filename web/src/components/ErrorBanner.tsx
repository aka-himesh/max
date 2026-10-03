import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = 'Failed to load data from the server.',
  code,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-rose-200">
            {code ? `Error: ${code}` : 'Operation Notice'}
          </div>
          <p className="text-xs text-rose-300/90 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/30 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
