import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import type { Report } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatTimeRelative } from '../../lib/format';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export const OfficerVerificationQueue: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch only pending_verification reports
  const { data: response, isLoading } = useQuery({
    queryKey: ['pending-verification-reports'],
    queryFn: () => api.getReports({ status: 'pending_verification', page_size: 50, sort: '-created_at' }),
    refetchInterval: 10000,
  });

  const reports: Report[] = response?.data || [];

  // Mutation: Quick Verify & Dispatch
  const verifyMutation = useMutation({
    mutationFn: (reportId: string) =>
      api.updateReportStatus(reportId, {
        status: 'verified',
        comment: 'Verified by officer from pending triage queue. DLP Notice dispatched to contractor.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Mutation: Quick Reject
  const rejectMutation = useMutation({
    mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) =>
      api.updateReportStatus(reportId, {
        status: 'rejected',
        comment: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleQuickVerify = (reportId: string) => {
    verifyMutation.mutate(reportId);
  };

  const handleQuickReject = (reportId: string) => {
    const reason = prompt('Please enter rejection reason (e.g. shadow artifact, false positive, non-road cavity):');
    if (reason && reason.trim()) {
      rejectMutation.mutate({ reportId, reason: reason.trim() });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0d1322] border border-amber-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Officer Pothole Verification Queue
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Review live vehicle camera detections. Approving dispatches an official DLP work order notice to the responsible contractor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
            {reports.length} Pending Approval
          </span>
        </div>
      </div>

      {/* Verification Queue Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Spinner size="lg" className="text-amber-400 mb-3" />
          <span className="text-xs font-medium text-slate-300">Loading pending verification queue...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <EmptyState
            title="All Clear — Zero Pending Verifications"
            description="There are no vehicle AI pothole detections waiting for officer verification right now."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div
              key={report.report_id}
              className="bg-[#0c1220] border border-white/10 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  <img
                    src={report.image_url}
                    alt={report.category}
                    className="w-24 h-24 rounded-2xl object-cover border border-white/10 shrink-0 bg-slate-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusBadge status="pending_verification" />
                      <SeverityBadge severity={report.severity} />
                    </div>

                    <h3 className="text-sm font-bold text-white truncate mb-1">
                      {report.address || 'Corridor Telemetry Geo-Fix'}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {report.description || 'AI Drive Mode live detection awaiting officer verification.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>Lat: {report.latitude.toFixed(4)}, Lng: {report.longitude.toFixed(4)}</span>
                      <span>•</span>
                      <span>{formatTimeRelative(report.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <Link
                  to={`/reports/${report.report_id}`}
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <span>Inspect Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickReject(report.report_id)}
                    disabled={rejectMutation.isPending}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleQuickVerify(report.report_id)}
                    disabled={verifyMutation.isPending}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Dispatch</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
