import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import type { Report } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { CategoryChip } from '../../components/CategoryChip';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatTimeRelative } from '../../lib/format';
import { PlusCircle, Camera, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export const CitizenMyReports: React.FC = () => {
  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['citizen-my-reports'],
    queryFn: () => api.getReports({ sort: '-created_at', page_size: 50 }),
  });

  const reports: Report[] = reportResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1322] border border-white/[0.08] p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>My Submitted Reports & Grievances</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time progress, municipal department actions, and contractor repair updates for your logged issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/citizen/drive-mode"
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Drive Mode</span>
          </Link>
          <Link
            to="/citizen/report"
            className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>
      </div>

      {/* Reports List */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Spinner size="lg" className="text-cyan-400 mb-3" />
            <span className="text-xs font-medium text-slate-300">Loading your civic records...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No reports filed yet"
              description="You haven't reported any potholes or civic issues yet. Click below to file your first report."
              action={
                <Link
                  to="/citizen/report"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                >
                  Report an Issue
                </Link>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {reports.map((report) => (
              <div
                key={report.report_id}
                className="p-5 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={report.image_url}
                    alt={report.category}
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10 shrink-0 bg-slate-900"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <CategoryChip category={report.category} />
                      <StatusBadge status={report.status} />
                      <SeverityBadge severity={report.severity} />
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1">
                      {report.address || 'Corridor Telemetry Fix'}
                    </h3>

                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatTimeRelative(report.created_at)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        #{report.report_id.replace('r_', '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <Link
                    to={`/reports/${report.report_id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white transition"
                  >
                    <span>View Status Tracking</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
