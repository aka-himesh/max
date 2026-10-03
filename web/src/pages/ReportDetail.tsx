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
} from 'lucide-react';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
        <Spinner size="lg" className="text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Retrieving incident dossier...</p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="space-y-6">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
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
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Report #{report.report_id}
              </h1>
              <StatusBadge status={report.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Image, Description, AI & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo with AI Bounding Box Overlay */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Incident Evidence & Visual Inspection
            </h2>
            <ImageWithBoxes
              imageUrl={report.image_url}
              aiResult={report.ai_result}
              alt={report.category}
            />
          </div>

          {/* Description Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Citizen Description & Observations
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed">
              {report.description || 'No descriptive comments provided with this report.'}
            </p>
          </div>

          {/* AI Result Card */}
          {report.ai_result && (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Machine Learning Detection Model
                  </h3>
                </div>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  {report.ai_result.model_name} v{report.ai_result.model_version}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Detected Class</div>
                  <div className="font-semibold text-white">{report.ai_result.detected_class}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">AI Confidence</div>
                  <div className="font-bold text-emerald-400 text-sm">
                    {formatPercentage(report.ai_result.confidence)}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Inferred Category</div>
                  <div className="font-semibold text-white capitalize">
                    {report.ai_result.category.replace('_', ' ')}
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 mb-1">Processed At</div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    {formatDateTime(report.ai_result.processed_at)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Road Infrastructure & Defect Liability Period (DLP) */}
          {report.road && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Road Registry & Defect Liability Period (DLP)
                  </h3>
                </div>
                {report.road.dlp_active ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    DLP Active (Contractor Liable)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Municipal Maintenance
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">Road Name</div>
                  <div className="font-semibold text-slate-800">{report.road.road_name}</div>
                  <div className="text-slate-500 text-[11px]">{report.road.road_segment}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">DLP Start Date</div>
                  <div className="font-semibold text-slate-800">{report.road.dlp_start_date}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">DLP End Date</div>
                  <div className="font-semibold text-slate-800">{report.road.dlp_end_date}</div>
                </div>
              </div>
            </div>
          )}

          {/* Contractor Details */}
          {report.contractor && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <HardHat className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Contractor Contact Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">Contractor Name</div>
                  <div className="font-semibold text-slate-800">{report.contractor.contractor_name}</div>
                  <div className="text-slate-500 text-[11px]">{report.contractor.company}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">Email Address</div>
                  <a href={`mailto:${report.contractor.email}`} className="font-semibold text-indigo-600 hover:underline">
                    {report.contractor.email}
                  </a>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px] mb-0.5">Phone Number</div>
                  <div className="font-semibold text-slate-800">{report.contractor.phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Status & Dispatch Log History</h3>
            <Timeline items={history} />
          </div>

          {/* Escalation History */}
          {escalations.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-3">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Escalation Records</span>
              </div>
              <div className="space-y-3">
                {escalations.map((esc) => (
                  <div key={esc.escalation_id} className="bg-white p-3.5 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-rose-900">
                        {esc.previous_authority} → {esc.escalated_to}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDateTime(esc.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-700">{esc.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Status Management, SLA, Assign */}
        <div className="space-y-6">
          {/* Action Card: Update Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Workflow State Transition</h3>

            {allowedTransitions.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                This report is in a terminal state ({report.status}). No further transitions allowed.
              </div>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Status To:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action Note / Comment
                    {(selectedStatus === 'rejected' || selectedStatus === 'resolved') && (
                      <span className="text-rose-600 font-bold ml-1">*Required</span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Enter dispatch note, contractor instruction, or closure justification..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={statusMutation.isPending || !selectedStatus}
                  className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {statusMutation.isPending ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Commit Status Change</span>
                </button>
              </form>
            )}
          </div>

          {/* Action Card: Reassign Department */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Reassign Department</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {assignMutation.isPending ? <Spinner size="sm" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>Assign & Dispatch</span>
              </button>
            </form>
          </div>

          {/* SLA Tracking Card */}
          {report.sla && (
            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                report.sla.breached
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`w-4 h-4 ${
                    report.sla.breached ? 'text-rose-600' : 'text-slate-500'
                  }`}
                />
                <h3 className="text-sm font-bold">Service Level Agreement (SLA)</h3>
              </div>

              <div className="text-xs space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Due Date:</span>
                  <span className="font-semibold">{formatDateTime(report.sla.due_at)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">Compliance Status:</span>
                  {report.sla.breached ? (
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded font-bold text-[11px]">
                      BREACHED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]">
                      Within SLA
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location & Geospatial Point */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Geospatial Coordinates</h3>
            </div>
            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-800">
                {report.address || 'Address not resolved'}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
