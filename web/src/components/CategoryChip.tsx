import React from 'react';
import type { Category } from '../api/types';
import { CATEGORY_LABELS } from '../lib/enums';

interface CategoryChipProps {
  category: Category | string;
  className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ category, className = '' }) => {
  const label = CATEGORY_LABELS[category as Category] || category || 'Unknown';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-slate-300 border border-white/10 ${className}`}
    >
      {label}
    </span>
  );
};
