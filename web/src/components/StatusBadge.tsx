import React from 'react';
import type { ReportStatus } from '../api/types';
import { STATUS_LABELS } from '../lib/enums';

interface StatusBadgeProps {
  status: ReportStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'submitted':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'pending_verification':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold';
      case 'verified':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'assigned':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'in_progress':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'rejected':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'escalated':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const label = STATUS_LABELS[status as ReportStatus] || status || 'Unknown';
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${getStyle(
        status
      )} ${sizeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80"></span>
      {label}
    </span>
  );
};
