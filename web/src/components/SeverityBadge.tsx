import React from 'react';

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
  const getStyles = (s: number) => {
    switch (s) {
      case 1:
      case 2:
        return { label: s === 1 ? 'Low' : 'Minor', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      case 3:
        return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
      case 4:
        return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
      case 5:
        return { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' };
      default:
        return { label: `Level ${s}`, color: 'text-slate-300', bg: 'bg-slate-800 border-slate-700' };
    }
  };

  const info = getStyles(severity);
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg border ${info.bg} ${info.color} ${sizeClass}`}
      title={`Severity ${severity}/5`}
    >
      <span className="font-bold mr-1">S{severity}</span>
      {showLabel && <span className="opacity-90">{info.label}</span>}
    </span>
  );
};
