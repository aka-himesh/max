import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import type { DashboardStats, Report } from '../api/types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryChip } from '../components/CategoryChip';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatTimeRelative } from '../lib/format';
import { CATEGORY_LABELS } from '../lib/enums';
import {
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const SEVERITY_COLORS = ['#10b981', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
const SOURCE_COLORS = ['#6366f1', '#06b6d4'];

export const Dashboard: React.FC = () => {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48 mb-2"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 rounded-xl"></div>
          <div className="h-72 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <ErrorBanner
          message={(error as Error)?.message || 'Failed to load dashboard statistics.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { totals, by_status, by_category, by_severity, by_source, by_department, avg_resolution_hours, recent_reports } = stats;

  // Chart data transforms
  const statusData = Object.entries(by_status || {}).map(([key, val]) => ({
    name: key.replace('_', ' '),
    count: val,
  }));

  const categoryData = Object.entries(by_category || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({
      name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
      count: val,
    }));

  const severityData = [1, 2, 3, 4, 5].map((sev) => ({
    severity: `S${sev}`,
    count: by_severity?.[sev.toString()] || 0,
  }));

  const sourceData = [
    { name: 'Citizen Reports', value: by_source?.citizen || 0 },
    { name: 'Vehicle AI (Dashcam)', value: by_source?.vehicle_ai || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Executive Command Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Realtime city infrastructure health, active dispatches & SLA compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <span>View All Reports</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Reports"
          value={totals.total}
          subtitle="All recorded civic events"
          icon={<Layers className="w-5 h-5" />}
        />
        <StatCard
          title="Active Open"
          value={totals.open}
          subtitle="Awaiting resolution"
          highlightColor="border-amber-200"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Resolved Issues"
          value={totals.resolved}
          subtitle="Fixed & closed"
          highlightColor="border-emerald-200"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="Escalated"
          value={totals.escalated}
          subtitle="Higher authority tier"
          highlightColor="border-rose-200"
          icon={<Flame className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          title="Avg Resolution"
          value={`${avg_resolution_hours.toFixed(1)}h`}
          subtitle="Mean time to fix"
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Reports by Status</h2>
            <span className="text-xs text-slate-400">Workflow stage breakdown</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Severity Distribution (1 to 5)</h2>
            <span className="text-xs text-slate-400">Hazard urgency level</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="severity" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Top Issue Categories</h2>
            <span className="text-xs text-slate-400">Volume by incident type</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categoryData.slice(0, 6)}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Ingestion (Citizen vs Vehicle AI) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Ingestion Source Split</h2>
            <span className="text-xs text-slate-400">Citizen App vs Vehicle AI</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Workload Breakdown */}
      {by_department && by_department.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Department Workload Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {by_department.map((d) => (
              <div key={d.department_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 truncate mb-1">
                  {d.department_name}
                </div>
                <div className="text-xl font-bold text-indigo-700">{d.count}</div>
                <div className="text-[10px] text-slate-400">Active tasks</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incoming Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Incident Reports</h2>
            <p className="text-xs text-slate-500">Latest issues requiring attention or review</p>
          </div>
          <Link
            to="/reports"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recent_reports && recent_reports.length > 0 ? (
            recent_reports.map((report: Report) => (
              <Link
                key={report.report_id}
                to={`/reports/${report.report_id}`}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={report.image_url}
                    alt={report.category}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=100';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryChip category={report.category} />
                      <SeverityBadge severity={report.severity} />
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        #{report.report_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate max-w-md">
                      {report.description || 'No description provided'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`} •{' '}
                      {formatTimeRelative(report.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={report.status} />
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent reports found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
