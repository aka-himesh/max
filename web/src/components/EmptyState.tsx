import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching your current filters or query.',
  icon,
  action,
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
      <div className="w-12 h-12 mx-auto text-slate-500 flex items-center justify-center rounded-2xl bg-white/[0.04] mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
