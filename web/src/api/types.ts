/**
 * Civic Issue Reporting & Tracking System
 * API Types strictly derived from RULES.md Sections 4, 5, 7, and 12.
 * Wire format is snake_case and strictly typed.
 */

export type Role = 'citizen' | 'officer' | 'admin' | 'contractor';

export type ReportSource = 'citizen' | 'vehicle_ai';

export type ReportStatus =
  | 'submitted'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'escalated';

export type Channel = 'in_app' | 'email' | 'push' | 'sms';

export type NotificationType =
  | 'report_received'
  | 'status_changed'
  | 'assigned'
  | 'duplicate_merged'
  | 'escalated'
  | 'resolved';

export type Category =
  | 'damaged_road'
  | 'pothole'
  | 'illegal_parking'
  | 'broken_road_sign'
  | 'fallen_tree'
  | 'garbage'
  | 'vandalism'
  | 'dead_animal'
  | 'damaged_concrete'
  | 'electric_hazard'
  | 'other';

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department_id: string | null;
  department_name?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Department {
  department_id: string;
  department_name: string;
  department_type: string;
  contact_email: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  image_width?: number;
  image_height?: number;
}

export interface AiResult {
  model_name: string;
  model_version: string;
  detected_class_id: number;
  detected_class: string;
  category: Category;
  confidence: number;
  bounding_box: BoundingBox;
  processed_at: string;
  raw?: Array<{
    class_id: number;
    class_name: string;
    category: Category;
    confidence: number;
    bbox: { x1: number; y1: number; x2: number; y2: number };
  }>;
}

export interface RoadInfo {
  road_id: string;
  road_name: string;
  road_segment: string;
  dlp_start_date: string; // YYYY-MM-DD
  dlp_end_date: string; // YYYY-MM-DD
  dlp_active: boolean;
}

export interface Contractor {
  contractor_id: string;
  contractor_name: string;
  company: string;
  email: string;
  phone: string;
}

export interface SlaInfo {
  due_at: string; // ISO UTC
  breached: boolean;
}

export interface ResolutionInfo {
  note: string | null;
  resolved_at: string | null;
}

export interface Report {
  report_id: string;
  source: ReportSource;
  category: Category;
  description: string | null;
  image_url: string;
  latitude: number;
  longitude: number;
  address: string | null;
  severity: number; // 1 to 5
  priority_score: number; // 0 to 100
  status: ReportStatus;
  department_id: string;
  department_name: string;
  ai_confidence: number | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReportDetail extends Report {
  ai_result: AiResult | null;
  road: RoadInfo | null;
  contractor: Contractor | null;
  sla: SlaInfo | null;
  resolution: ResolutionInfo | null;
}

export interface MapReportPoint {
  report_id: string;
  latitude: number;
  longitude: number;
  category: Category;
  severity: number;
  status: ReportStatus;
}

export interface HistoryItem {
  log_id: string;
  old_status: ReportStatus;
  new_status: ReportStatus;
  changed_by_name: string;
  changed_by_role: Role;
  comment: string | null;
  timestamp: string;
}

export interface EscalationItem {
  escalation_id: string;
  previous_authority: string;
  escalated_to: string;
  reason: string;
  timestamp: string;
}

export interface Notification {
  notification_id: string;
  report_id: string | null;
  type: NotificationType;
  message: string;
  channel: Channel;
  is_read: boolean;
  sent_at: string;
}

export interface DashboardStats {
  totals: {
    total: number;
    open: number;
    resolved: number;
    escalated: number;
    sla_breached: number;
  };
  by_status: Record<ReportStatus, number>;
  by_category: Record<Category, number>;
  by_severity: Record<string, number>;
  by_source: Record<ReportSource, number>;
  by_department: Array<{
    department_id: string;
    department_name: string;
    count: number;
  }>;
  avg_resolution_hours: number;
  recent_reports: Report[];
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface ReportFilterParams {
  status?: string;
  category?: string;
  severity?: number | string;
  department_id?: string;
  source?: string;
  mine?: boolean;
  from?: string;
  to?: string;
  q?: string;
  sort?: 'created_at' | '-created_at' | 'priority_score' | '-priority_score';
  page?: number;
  page_size?: number;
}

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status?: number;

  constructor(code: string, message: string, details?: Record<string, unknown>, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}
