import React from 'react';
import { SEVERITY_DESCRIPTIONS } from '../lib/enums';

interface SeverityBadgeProps {
  severity: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showLabel = true,
  size = 'sm',
}) => {
  const info = SEVERITY_DESCRIPTIONS[severity] || {
    label: `Level ${severity}`,
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
  };

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${info.bg} ${info.color} ${sizeClass}`}
      title={`Severity ${severity}/5`}
    >
      <span className="font-bold mr-1">S{severity}</span>
      {showLabel && <span className="opacity-90">{info.label}</span>}
    </span>
  );
};
