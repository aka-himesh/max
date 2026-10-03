import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  highlightColor = 'border-white/10',
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 border ${highlightColor} shadow-lg hover:border-white/20 transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && <div>{icon}</div>}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
        {value}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};
