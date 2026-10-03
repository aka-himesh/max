import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../api/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange, className = '' }) => {
  const { page, page_size, total } = meta;
  const totalPages = Math.max(1, Math.ceil(total / page_size));
  const startItem = total === 0 ? 0 : (page - 1) * page_size + 1;
  const endItem = Math.min(total, page * page_size);

  return (
    <div
      className={`flex items-center justify-between border-t border-white/10 bg-slate-900/50 px-4 py-3 sm:px-6 rounded-b-2xl ${className}`}
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="relative inline-flex items-center rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.1] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.1] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-white">{startItem}</span> to{' '}
            <span className="font-semibold text-white">{endItem}</span> of{' '}
            <span className="font-semibold text-white">{total}</span> reports
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-l-xl px-2.5 py-1.5 text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/[0.05] disabled:opacity-30"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="relative inline-flex items-center px-4 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-inset ring-white/10">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-r-xl px-2.5 py-1.5 text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/[0.05] disabled:opacity-30"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
