import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError, type ApiErrorResponse } from './types';
import { tokenStorage } from '../auth/tokenStorage';

// Mock data imports for offline / mock mode
import departmentsMock from '../mocks/departments.json';
import dashboardStatsMock from '../mocks/dashboard_stats.json';
import reportsMock from '../mocks/reports.json';
import reportsMapMock from '../mocks/reports_map.json';
import reportDetailMock from '../mocks/report_detail.json';
import historyMock from '../mocks/history.json';
import escalationsMock from '../mocks/escalations.json';
import notificationsMock from '../mocks/notifications.json';

const isMockMode = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Unwrap { data, meta } or handle ApiError
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data?.error;

      // Handle 401 Unauthorized: Clear session and redirect to login
      if (status === 401) {
        tokenStorage.clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      if (errorData) {
        throw new ApiError(
          errorData.code || 'API_ERROR',
          errorData.message || 'An unexpected server error occurred.',
          errorData.details,
          status
        );
      }

      throw new ApiError(
        `HTTP_${status}`,
        error.message || `Request failed with status ${status}`,
        undefined,
        status
      );
    }

    if (error.request) {
      throw new ApiError(
        'NETWORK_ERROR',
        'Cannot connect to backend server. Please check your network or server status.',
        undefined,
        0
      );
    }

    throw new ApiError('UNKNOWN_ERROR', error.message || 'An unknown error occurred.');
  }
);

// Mock adapter setup when VITE_USE_MOCK=true
if (isMockMode) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiClient.interceptors.request.use(async (config: any) => {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    // Mock auth/login
    if (url.includes('/auth/login') && method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const email = body?.email;
      const isAdmin = email === 'admin@demo.com';

      const mockUser = {
        user_id: isAdmin ? 'u_admin_1' : 'u_officer_1',
        name: isAdmin ? 'Commissioner Sharma' : 'Ramesh Kumar',
        email: email || 'officer@demo.com',
        phone: '+91 98765 43210',
        role: isAdmin ? 'admin' : 'officer',
        department_id: isAdmin ? null : 'd_roads',
        department_name: isAdmin ? null : 'Roads & Infrastructure',
      };

      config.adapter = async () => ({
        data: {
          data: {
            access_token: 'mock_jwt_token_' + (isAdmin ? 'admin' : 'officer'),
            token_type: 'Bearer',
            expires_in: 86400,
            user: mockUser,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock auth/me
    if (url.includes('/auth/me')) {
      const storedUser = tokenStorage.getUser();
      config.adapter = async () => ({
        data: {
          data: storedUser || {
            user_id: 'u_officer_1',
            name: 'Ramesh Kumar',
            email: 'officer@demo.com',
            phone: '+91 98765 43210',
            role: 'officer',
            department_id: 'd_roads',
            department_name: 'Roads & Infrastructure',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock auth/logout
    if (url.includes('/auth/logout')) {
      config.adapter = async () => ({
        data: {},
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /dashboard/stats
    if (url.includes('/dashboard/stats')) {
      config.adapter = async () => ({
        data: dashboardStatsMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /departments
    if (url.includes('/departments')) {
      config.adapter = async () => ({
        data: departmentsMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /reports/map
    if (url.includes('/reports/map')) {
      config.adapter = async () => ({
        data: reportsMapMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /reports/{id}/history
    if (url.match(/\/reports\/[^/]+\/history/)) {
      config.adapter = async () => ({
        data: historyMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /reports/{id}/escalations
    if (url.match(/\/reports\/[^/]+\/escalations/)) {
      config.adapter = async () => ({
        data: escalationsMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock PATCH /reports/{id}/status
    if (url.match(/\/reports\/[^/]+\/status/) && method === 'patch') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      config.adapter = async () => ({
        data: {
          data: {
            ...reportDetailMock.data,
            status: body?.status || 'in_progress',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock PATCH /reports/{id}/assign
    if (url.match(/\/reports\/[^/]+\/assign/) && method === 'patch') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      config.adapter = async () => ({
        data: {
          data: {
            ...reportDetailMock.data,
            status: 'assigned',
            department_id: body?.department_id || 'd_roads',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock POST /reports (Citizen create report)
    if (url.endsWith('/reports') && method === 'post') {
      const newReportId = 'r_' + Math.floor(Math.random() * 9000 + 1000);
      const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
      let category = 'pothole';
      let description = 'User submitted report via portal';
      let lat = 21.1458;
      let lng = 79.0882;
      let address = 'Manually Pinpointed Location, Ward 12';

      if (isFormData) {
        category = (config.data.get('category') as string) || category;
        description = (config.data.get('description') as string) || description;
        lat = parseFloat(config.data.get('latitude') as string) || lat;
        lng = parseFloat(config.data.get('longitude') as string) || lng;
        address = (config.data.get('address') as string) || address;
      }

      const createdReport = {
        ...reportDetailMock.data,
        report_id: newReportId,
        category,
        description,
        latitude: lat,
        longitude: lng,
        address,
        source: 'citizen',
        status: 'submitted',
        severity: category === 'electric_hazard' ? 5 : category === 'pothole' ? 3 : 2,
        priority_score: 70.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      config.adapter = async () => ({
        data: { data: createdReport },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      });
      return config;
    }

    // Mock POST /ml/reports (Dashcam Ingestion & Contractor DLP lookup)
    if (url.includes('/ml/reports') && method === 'post') {
      const newReportId = 'r_dash_' + Math.floor(Math.random() * 9000 + 1000);
      
      const mockResult = {
        report_id: newReportId,
        is_duplicate: false,
        duplicate_of: null,
        status: 'verified' as const,
        road: {
          road_id: 'rd_401',
          road_name: 'Inner Ring Road - Sector 4',
          road_segment: 'Segment 4A (km 12.4 - 14.1)',
          dlp_start_date: '2024-06-01',
          dlp_end_date: '2028-05-31',
          dlp_active: true,
        },
        contractor: {
          contractor_id: 'c_901',
          contractor_name: 'Rajesh Sharma',
          company: 'Apex Infrastructure & Highway Builders Ltd.',
          email: 'contact@apexinfra.com',
          phone: '+91 98230 45678',
        },
        email_dispatched: {
          recipient: 'contact@apexinfra.com',
          cc: 'roads.engineer@city.gov',
          subject: '[URGENT - DLP REPAIR NOTICE] Pothole Hazard Detected on Ring Road Segment 4A',
          body: 'Automated notification: AI Dashcam Unit bus-12-cam-1 identified a high severity pothole on Ring Road Segment 4A (Lat: 21.1458, Lng: 79.0882). As this road is under active Defect Liability Period (DLP expiring 2028-05-31), Apex Infrastructure is requested to deploy maintenance crew within 24h as per SLA terms.',
          dlp_active: true,
        },
      };

      config.adapter = async () => ({
        data: { data: mockResult },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /reports/{id}
    if (url.match(/\/reports\/[^/]+$/) && method === 'get') {
      config.adapter = async () => ({
        data: reportDetailMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /reports
    if (url.includes('/reports') && method === 'get') {
      config.adapter = async () => ({
        data: reportsMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    // Mock /notifications
    if (url.includes('/notifications')) {
      config.adapter = async () => ({
        data: notificationsMock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      return config;
    }

    return config;
  });
}
