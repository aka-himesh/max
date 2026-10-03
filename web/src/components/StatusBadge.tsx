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
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'verified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'assigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'in_progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'escalated':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const label = STATUS_LABELS[status as ReportStatus] || status || 'Unknown';
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${getStyle(
        status
      )} ${sizeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
};
