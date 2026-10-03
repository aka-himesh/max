import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import type { Report, Department, ReportFilterParams } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryChip } from '../components/CategoryChip';
import { FilterBar, type FilterState } from '../components/FilterBar';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { formatTimeRelative } from '../lib/format';
import { useAuth } from '../auth/AuthContext';
import { Bot, User as UserIcon, Eye, ArrowUpDown } from 'lucide-react';

export const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Parse filters from URL
  const filters: FilterState = useMemo(() => {
    return {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      department_id: searchParams.get('department_id') || undefined,
      source: searchParams.get('source') || undefined,
      sort: searchParams.get('sort') || '-created_at',
      q: searchParams.get('q') || undefined,
    };
  }, [searchParams]);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

  // Fetch departments for filter
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  // Query reports
  const queryParams: ReportFilterParams = useMemo(() => {
    return {
      status: filters.status,
      category: filters.category,
      severity: filters.severity,
      department_id: filters.department_id,
      source: filters.source,
      sort: filters.sort as ReportFilterParams['sort'],
      q: filters.q,
      page,
      page_size: pageSize,
    };
  }, [filters, page, pageSize]);

  const {
    data: reportResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reports', queryParams],
    queryFn: () => api.getReports(queryParams),
    refetchInterval: 20000,
  });

  const reports: Report[] = reportResponse?.data || [];
  const meta = reportResponse?.meta || { page, page_size: pageSize, total: 0 };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();

    Object.entries(updated).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });

    params.set('page', '1'); // Reset to page 1 on filter
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Incident Reports Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review, verify, assign departments and update status of civic complaints.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        departments={departments}
        showDepartmentFilter={user?.role === 'admin'}
      />

      {/* Error state */}
      {isError && (
        <ErrorBanner
          message={(error as Error)?.message || 'Failed to fetch reports from backend.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Reports Data Table */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Spinner size="lg" className="text-indigo-400 mb-3" />
            <span className="text-xs font-medium text-slate-300">Loading incident records...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No matching reports found"
              description="Try adjusting your filters, searching for a different keyword, or resetting filters."
              action={
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Reset All Filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Photo & Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">
                    <span className="inline-flex items-center gap-1">
                      Priority
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </span>
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {reports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Photo & Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={report.image_url}
                          alt={report.category}
                          className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0 bg-slate-900"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=80';
                          }}
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CategoryChip category={report.category} />
                            {report.is_duplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                                Dup ({report.report_count})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 font-medium truncate">
                            {report.description || 'No description provided'}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            #{report.report_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <SeverityBadge severity={report.severity} />
                    </td>

                    {/* Priority Score */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              report.priority_score > 75
                                ? 'bg-rose-500'
                                : report.priority_score > 50
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, report.priority_score))}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-300 font-mono">
                          {Math.round(report.priority_score)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                      {report.department_name || 'Unassigned'}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {report.source === 'vehicle_ai' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          <Bot className="w-3 h-3" />
                          Vehicle AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] text-slate-300 border border-white/10">
                          <UserIcon className="w-3 h-3 text-slate-500" />
                          Citizen
                        </span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      {formatTimeRelative(report.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/reports/${report.report_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white text-slate-200 hover:text-slate-950 font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {!isLoading && reports.length > 0 && (
          <Pagination meta={meta} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
};
