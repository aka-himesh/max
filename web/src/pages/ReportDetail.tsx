import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import type { ReportStatus, ReportDetail as IReportDetail, Department } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryChip } from '../components/CategoryChip';
import { ImageWithBoxes } from '../components/ImageWithBoxes';
import { Timeline } from '../components/Timeline';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import { ALLOWED_STATUS_TRANSITIONS, STATUS_LABELS } from '../lib/enums';
import { formatDateTime, formatPercentage } from '../lib/format';
import {
  findRoadRegistryByGps,
  generateComplaintEmailDraft,
} from '../data/roadRegistry';
import {
  ArrowLeft,
  Bot,
  MapPin,
  Clock,
  Building2,
  HardHat,
  AlertOctagon,
  CheckCircle2,
  Share2,
  Send,
  Mail,
  Copy,
  Check,
} from 'lucide-react';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Fetch report detail
  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<IReportDetail>({
    queryKey: ['report-detail', id],
    queryFn: () => api.getReportDetail(id!),
    enabled: !!id,
  });

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['report-history', id],
    queryFn: () => api.getReportHistory(id!),
    enabled: !!id,
  });

  // Fetch escalations
  const { data: escalations = [] } = useQuery({
    queryKey: ['report-escalations', id],
    queryFn: () => api.getReportEscalations(id!),
    enabled: !!id,
  });

  // Fetch departments for assignment
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  // Mutation: Status Change
  const statusMutation = useMutation({
    mutationFn: (data: { status: ReportStatus; comment?: string }) =>
      api.updateReportStatus(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['report-history', id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedStatus('');
      setStatusComment('');
      setActionSuccess('Status updated successfully.');
      setActionError(null);
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to update status.');
      setActionSuccess(null);
    },
  });

  // Mutation: Department Assignment
  const assignMutation = useMutation({
    mutationFn: (data: { department_id: string }) => api.assignReport(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['report-history', id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedDept('');
      setActionSuccess('Report assigned to department.');
      setActionError(null);
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to assign department.');
      setActionSuccess(null);
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-indigo-400 mb-3" />
        <p className="text-xs font-medium text-slate-400">Retrieving incident dossier...</p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="space-y-6">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to reports
        </Link>
        <ErrorBanner message={(error as Error)?.message || 'Report not found.'} onRetry={() => refetch()} />
      </div>
    );
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[report.status] || [];

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedStatus) {
      setActionError('Please select a target status.');
      return;
    }

    if ((selectedStatus === 'rejected' || selectedStatus === 'resolved') && !statusComment.trim()) {
      setActionError(`A comment is strictly required when marking a report as ${selectedStatus}.`);
      return;
    }

    statusMutation.mutate({
      status: selectedStatus as ReportStatus,
      comment: statusComment.trim() || undefined,
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedDept) {
      setActionError('Please select a department to assign.');
      return;
    }

    assignMutation.mutate({ department_id: selectedDept });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/reports"
            className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Report #{report.report_id}
              </h1>
              <StatusBadge status={report.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submitted {formatDateTime(report.created_at)} • Updated {formatDateTime(report.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CategoryChip category={report.category} />
          <SeverityBadge severity={report.severity} size="md" />
        </div>
      </div>

      {/* Action Banners */}
      {actionError && (
        <ErrorBanner message={actionError} className="animate-in fade-in duration-200" />
      )}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Officer Manual Verification Action Banner for AI Drive Mode Detections */}
      {report.status === 'pending_verification' && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Drive Mode Pothole Detection — Awaiting Officer Verification
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  This defect was automatically captured during vehicle driving. Review the photo and telemetry below. Approving will officially register the defect and dispatch a rectification work order & DLP notice to the registered contractor.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  statusMutation.mutate({
                    status: 'verified',
                    comment: 'Verified by municipal officer. Defect rectification notice and DLP work order dispatched to contractor.',
                  });
                }}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
              >
                {statusMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Verify & Dispatch Notice</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const reason = prompt('Please enter rejection reason (e.g., False positive, shadow artifact, not road defect):');
                  if (reason) {
                    statusMutation.mutate({
                      status: 'rejected',
                      comment: reason,
                    });
                  }
                }}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Matched Contractor Info Strip */}
          {report.contractor && (
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Assigned Contractor: <strong className="text-white">{report.contractor.contractor_name} ({report.contractor.company})</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                <span>Contractor Email: <span className="text-indigo-400">{report.contractor.email}</span></span>
                <span className="text-slate-600">•</span>
                <span>DLP Status: <span className={report.road?.dlp_active ? 'text-amber-400 font-bold' : 'text-slate-400'}>{report.road?.dlp_active ? 'Active DLP (24h SLA)' : 'Standard Maintenance (72h)'}</span></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo with AI Bounding Box Overlay */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-lg">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Incident Evidence & Visual Inspection
            </h2>
            <ImageWithBoxes
              imageUrl={report.image_url}
              aiResult={report.ai_result}
              alt={report.category}
            />
          </div>

          {/* Description Card */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Citizen Description & Observations
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {report.description || 'No descriptive comments provided with this report.'}
            </p>
          </div>

          {/* AI Result Card */}
          {report.ai_result && (
            <div className="glass-panel text-white p-5 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Machine Learning Detection Model
                  </h3>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  {report.ai_result.model_name} v{report.ai_result.model_version}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Detected Class</div>
                  <div className="font-semibold text-white">{report.ai_result.detected_class}</div>
                </div>
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">AI Confidence</div>
                  <div className="font-bold text-emerald-400 font-mono text-sm">
                    {formatPercentage(report.ai_result.confidence)}
                  </div>
                </div>
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Inferred Category</div>
                  <div className="font-semibold text-white capitalize">
                    {report.ai_result.category.replace('_', ' ')}
                  </div>
                </div>
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Processed At</div>
                  <div className="text-slate-300 font-mono text-[10px]">
                    {formatDateTime(report.ai_result.processed_at)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Road Infrastructure & DLP */}
          {report.road && (
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Road Registry & Defect Liability Period (DLP)
                  </h3>
                </div>
                {report.road.dlp_active ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DLP Active (Contractor Liable)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-slate-400 border border-white/10">
                    Municipal Maintenance
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">Road Name</div>
                  <div className="font-semibold text-white">{report.road.road_name}</div>
                  <div className="text-slate-400 text-[11px]">{report.road.road_segment}</div>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">DLP Start Date</div>
                  <div className="font-semibold text-slate-200 font-mono">{report.road.dlp_start_date}</div>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">DLP End Date</div>
                  <div className="font-semibold text-slate-200 font-mono">{report.road.dlp_end_date}</div>
                </div>
              </div>
            </div>
          )}

          {/* Contractor Details & Official Notice Requisition */}
          {report.contractor && (
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Contractor Contact Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/40 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Generate DLP Notice</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">Contractor Name</div>
                  <div className="font-semibold text-white">{report.contractor.contractor_name}</div>
                  <div className="text-slate-400 text-[11px]">{report.contractor.company}</div>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">Email Address</div>
                  <a href={`mailto:${report.contractor.email}`} className="font-semibold text-indigo-400 hover:underline font-mono">
                    {report.contractor.email}
                  </a>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-400 text-[10px] mb-0.5">Phone Number</div>
                  <div className="font-semibold text-slate-200">{report.contractor.phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4">Status & Dispatch Log History</h3>
            <Timeline items={history} />
          </div>

          {/* Escalation History */}
          {escalations.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-3">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Escalation Records</span>
              </div>
              <div className="space-y-3">
                {escalations.map((esc) => (
                  <div key={esc.escalation_id} className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/30 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-rose-200">
                        {esc.previous_authority} → {esc.escalated_to}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDateTime(esc.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-300">{esc.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Status Management, SLA, Assign */}
        <div className="space-y-6">
          {/* Action Card: Update Status */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Workflow State Transition</h3>

            {allowedTransitions.length === 0 ? (
              <div className="text-xs text-slate-400 bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                This report is in a terminal state ({report.status}). No further transitions allowed.
              </div>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Advance Status To:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-white/10 bg-slate-900 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Next State --</option>
                    {allowedTransitions.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Action Note / Comment
                    {(selectedStatus === 'rejected' || selectedStatus === 'resolved') && (
                      <span className="text-rose-400 font-bold ml-1">*Required</span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Enter dispatch note, contractor instruction, or closure justification..."
                    className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={statusMutation.isPending || !selectedStatus}
                  className="w-full py-2 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {statusMutation.isPending ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Commit Status Change</span>
                </button>
              </form>
            )}
          </div>

          {/* Action Card: Reassign Department */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Reassign Department</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Responsible Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-white/10 bg-slate-900 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assignMutation.isPending || !selectedDept}
                className="w-full py-2 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold border border-white/10 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {assignMutation.isPending ? <Spinner size="sm" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>Assign & Dispatch</span>
              </button>
            </form>
          </div>

          {/* SLA Tracking Card */}
          {report.sla && (
            <div
              className={`p-5 rounded-3xl border shadow-lg ${
                report.sla.breached
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'glass-panel border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`w-4 h-4 ${
                    report.sla.breached ? 'text-rose-400' : 'text-slate-400'
                  }`}
                />
                <h3 className="text-sm font-bold text-white">Service Level Agreement (SLA)</h3>
              </div>

              <div className="text-xs space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Due Date:</span>
                  <span className="font-semibold text-white font-mono">{formatDateTime(report.sla.due_at)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Compliance Status:</span>
                  {report.sla.breached ? (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full font-bold text-[10px] border border-rose-500/30">
                      BREACHED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold text-[10px] border border-emerald-500/30">
                      Within SLA
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location & Geospatial Point */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Geospatial Coordinates</h3>
            </div>
            <div className="text-xs bg-white/[0.02] p-3 rounded-2xl border border-white/10 space-y-1">
              <div className="font-semibold text-white">
                {report.address || 'Address not resolved'}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Full Official Email Letter Preview */}
      {showEmailModal && (() => {
        const roadRecord = findRoadRegistryByGps(report.latitude, report.longitude);
        const emailDraft = generateComplaintEmailDraft({
          reportId: report.report_id,
          category: report.category,
          categoryLabel: report.category,
          roadRecord,
          latitude: report.latitude,
          longitude: report.longitude,
          severity: report.severity,
          aiConfidence: report.ai_confidence ?? undefined,
          description: report.description ?? undefined,
          evidenceUrl: report.image_url,
        });

        const handleCopy = () => {
          navigator.clipboard.writeText(emailDraft.body);
          setCopiedEmail(true);
          setTimeout(() => setCopiedEmail(false), 2000);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#090d16] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Official Contractor DLP Requisition Memo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-white text-xs bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/10"
                >
                  Close
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandatory SLA: <strong className="text-white">{emailDraft.slaHours} Hours</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-xl border border-white/10 transition"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied to Clipboard' : 'Copy Notice'}</span>
                </button>
              </div>

              <div className="bg-[#030712] border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-slate-200 overflow-y-auto flex-1 whitespace-pre-wrap leading-relaxed">
                {emailDraft.body}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-slate-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
