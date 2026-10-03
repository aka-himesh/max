import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { Department } from '../api/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/enums';

export interface FilterState {
  status?: string;
  category?: string;
  severity?: string;
  department_id?: string;
  source?: string;
  sort?: string;
  q?: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  departments: Department[];
  showDepartmentFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  departments,
  showDepartmentFilter = true,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => onFilterChange({ q: e.target.value || undefined })}
            placeholder="Search by description, address or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort by:</label>
          <select
            value={filters.sort || '-created_at'}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            className="text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="-priority_score">Highest Priority</option>
            <option value="priority_score">Lowest Priority</option>
          </select>
        </div>
      </div>

      {/* Filter rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Severity</label>
          <select
            value={filters.severity || ''}
            onChange={(e) => onFilterChange({ severity: e.target.value || undefined })}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="5">Severity 5 (Critical)</option>
            <option value="4">Severity 4 (High)</option>
            <option value="3">Severity 3 (Moderate)</option>
            <option value="2">Severity 2 (Minor)</option>
            <option value="1">Severity 1 (Low)</option>
          </select>
        </div>

        {/* Department (if admin or allowed) */}
        {showDepartmentFilter && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={filters.department_id || ''}
              onChange={(e) => onFilterChange({ department_id: e.target.value || undefined })}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Source */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source</label>
          <select
            value={filters.source || ''}
            onChange={(e) => onFilterChange({ source: e.target.value || undefined })}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="citizen">Citizen</option>
            <option value="vehicle_ai">Vehicle AI</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
