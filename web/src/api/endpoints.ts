import { apiClient } from './client';
import type {
  AuthResponse,
  DashboardStats,
  Department,
  EscalationItem,
  HistoryItem,
  MapReportPoint,
  Notification,
  Paginated,
  Report,
  ReportDetail,
  ReportStatus,
  User,
  RoadInfo,
  Contractor,
  ReportFilterParams,
} from './types';

export const api = {
  // 7.1 Health & Auth
  health: async (): Promise<{ status: string }> => {
    const res = await apiClient.get<{ data: { status: string } }>('/health');
    return res.data.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/login', credentials);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<{ data: User }>('/auth/me');
    return res.data.data;
  },

  // 7.2 Reports
  createReport: async (formData: FormData): Promise<ReportDetail> => {
    const res = await apiClient.post<{ data: ReportDetail }>('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  getReports: async (params?: ReportFilterParams): Promise<Paginated<Report>> => {
    const res = await apiClient.get<{ data: Report[]; meta: Paginated<Report>['meta'] }>('/reports', {
      params,
    });
    return {
      data: res.data.data,
      meta: res.data.meta || { page: 1, page_size: 20, total: res.data.data.length },
    };
  },

  getReportsMap: async (params?: Omit<ReportFilterParams, 'page' | 'page_size'>): Promise<MapReportPoint[]> => {
    const res = await apiClient.get<{ data: MapReportPoint[] }>('/reports/map', { params });
    return res.data.data;
  },

  getReportDetail: async (reportId: string): Promise<ReportDetail> => {
    const res = await apiClient.get<{ data: ReportDetail }>(`/reports/${reportId}`);
    return res.data.data;
  },

  updateReportStatus: async (
    reportId: string,
    data: { status: ReportStatus; comment?: string }
  ): Promise<Report> => {
    const res = await apiClient.patch<{ data: Report }>(`/reports/${reportId}/status`, data);
    return res.data.data;
  },

  assignReport: async (
    reportId: string,
    data: { department_id: string; officer_id?: string }
  ): Promise<Report> => {
    const res = await apiClient.patch<{ data: Report }>(`/reports/${reportId}/assign`, data);
    return res.data.data;
  },

  getReportHistory: async (reportId: string): Promise<HistoryItem[]> => {
    const res = await apiClient.get<{ data: HistoryItem[] }>(`/reports/${reportId}/history`);
    return res.data.data;
  },

  getReportEscalations: async (reportId: string): Promise<EscalationItem[]> => {
    const res = await apiClient.get<{ data: EscalationItem[] }>(`/reports/${reportId}/escalations`);
    return res.data.data;
  },

  // 7.3 ML Ingestion (Dashcam)
  submitMlReport: async (formData: FormData): Promise<{
    report_id: string;
    is_duplicate: boolean;
    duplicate_of: string | null;
    status: ReportStatus;
    road?: RoadInfo | null;
    contractor?: Contractor | null;
    email_dispatched?: {
      recipient: string;
      cc?: string;
      subject: string;
      body: string;
      dlp_active: boolean;
    };
  }> => {
    const res = await apiClient.post<{
      data: {
        report_id: string;
        is_duplicate: boolean;
        duplicate_of: string | null;
        status: ReportStatus;
        road?: RoadInfo | null;
        contractor?: Contractor | null;
        email_dispatched?: {
          recipient: string;
          cc?: string;
          subject: string;
          body: string;
          dlp_active: boolean;
        };
      };
    }>('/ml/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  // 7.4 Reference data, notifications, dashboard
  getDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<{ data: Department[] }>('/departments');
    return res.data.data;
  },

  getRoadDetail: async (roadId: string): Promise<RoadInfo> => {
    const res = await apiClient.get<{ data: RoadInfo }>(`/roads/${roadId}`);
    return res.data.data;
  },

  getContractorDetail: async (contractorId: string): Promise<Contractor> => {
    const res = await apiClient.get<{ data: Contractor }>(`/contractors/${contractorId}`);
    return res.data.data;
  },

  getNotifications: async (params?: {
    page?: number;
    page_size?: number;
    unread_only?: boolean;
  }): Promise<Paginated<Notification>> => {
    const res = await apiClient.get<{ data: Notification[]; meta: Paginated<Notification>['meta'] }>(
      '/notifications',
      { params }
    );
    return {
      data: res.data.data,
      meta: res.data.meta || { page: 1, page_size: 20, total: res.data.data.length },
    };
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats');
    return res.data.data;
  },
};
