import React from 'react';
import type { HistoryItem } from '../api/types';
import { formatDateTime } from '../lib/format';
import { StatusBadge } from './StatusBadge';
import { ArrowRight, MessageSquare } from 'lucide-react';

interface TimelineProps {
  items: HistoryItem[];
  emptyMessage?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  emptyMessage = 'No status history logged yet.',
}) => {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-500 italic py-3">{emptyMessage}</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
      {items.map((item) => (
        <div key={item.log_id || item.timestamp} className="relative group">
          {/* Circle indicator */}
          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-indigo-500 bg-slate-900 shadow-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                <StatusBadge status={item.old_status} size="sm" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <StatusBadge status={item.new_status} size="sm" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {formatDateTime(item.timestamp)}
              </span>
            </div>

            <div className="text-xs text-slate-300 font-medium mb-1">
              Action by: <span className="font-semibold text-white">{item.changed_by_name}</span>{' '}
              <span className="text-slate-400 capitalize">({item.changed_by_role})</span>
            </div>

            {item.comment && (
              <div className="mt-2 text-xs bg-slate-900/60 border border-white/10 rounded-xl p-2.5 text-slate-300 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{item.comment}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
