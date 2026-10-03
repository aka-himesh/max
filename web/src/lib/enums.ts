import type { Category, ReportStatus, ReportSource, Role } from '../api/types';

export const CATEGORY_LABELS: Record<Category, string> = {
  damaged_road: 'Damaged Road',
  pothole: 'Pothole',
  illegal_parking: 'Illegal Parking',
  broken_road_sign: 'Broken Road Sign',
  fallen_tree: 'Fallen Tree',
  garbage: 'Littering / Garbage',
  vandalism: 'Vandalism',
  dead_animal: 'Dead Animal',
  damaged_concrete: 'Damaged Concrete',
  electric_hazard: 'Electric Hazard',
  other: 'Other Issue',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  escalated: 'Escalated',
};

export const SOURCE_LABELS: Record<ReportSource, string> = {
  citizen: 'Citizen Report',
  vehicle_ai: 'Vehicle AI Detection',
};

export const ROLE_LABELS: Record<Role, string> = {
  citizen: 'Citizen',
  officer: 'Department Officer',
  admin: 'System Administrator',
  contractor: 'Contractor',
};

/**
 * Valid status transitions as enforced by Backend (RULES.md Section 5)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ['verified', 'rejected'],
  verified: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  escalated: ['in_progress', 'resolved'],
  resolved: [],
  rejected: [],
};

export const SEVERITY_DESCRIPTIONS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Low', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  2: { label: 'Minor', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  3: { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  4: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  5: { label: 'Critical', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};
