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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      {label}
    </span>
  );
};
