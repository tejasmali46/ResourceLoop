const envApiUrl = (import.meta as any).env?.VITE_API_URL || '';
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/+$/, '')}/api/v1` : '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('resourceloop_token');
  const userTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-timezone': userTimezone,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'API request failed', response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (userData: any) =>
    request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  getMe: () =>
    request<{ success: boolean; user: any; unreadNotificationsCount: number }>('/auth/me'),

  // Resources
  getResources: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    return request<{ success: boolean; count: number; resources: any[] }>(`/resources?${qs.toString()}`);
  },
  getResourceById: (id: string, params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    return request<{ success: boolean; resource: any; availabilityInfo: any; upcomingReservations: any[] }>(
      `/resources/${id}?${qs.toString()}`
    );
  },
  checkAvailability: (payload: { resourceId: string; startDate: string; endDate: string; quantity: number }) =>
    request<{ success: boolean; data: any }>('/resources/check-availability', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createResource: (data: any) =>
    request<{ success: boolean; resource: any }>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResource: (id: string, data: any) =>
    request<{ success: boolean; resource: any }>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  scheduleMaintenance: (id: string, data: { startDate: string; endDate: string; reason: string }) =>
    request<{ success: boolean; resource: any }>(`/resources/${id}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Events
  createEvent: (data: any) =>
    request<{ success: boolean; requestNumber: string; event: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEvents: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    return request<{ success: boolean; count: number; events: any[] }>(`/events?${qs.toString()}`);
  },
  getEventById: (id: string) =>
    request<{ success: boolean; event: any; reservations: any[]; decisions: any[]; handovers: any[]; tasks?: any[] }>(
      `/events/${id}`
    ),
  resubmitEvent: (id: string, payload: any) =>
    request<{ success: boolean; message: string; event: any }>(`/events/${id}/resubmit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelEvent: (id: string, reason: string) =>
    request<{ success: boolean; message: string; event: any }>(`/events/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Approvals
  getPendingApprovals: () =>
    request<{ success: boolean; count: number; pendingRequests: any[]; tasks?: any[] }>('/approvals/pending'),
  submitApprovalDecision: (payload: { eventId: string; decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'; reason: string }) =>
    request<{ success: boolean; message: string; event: any }>('/approvals/decision', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forwardOrReassignTask: (payload: { taskId: string; toUserId: string; reason: string }) =>
    request<{ success: boolean; task: any }>('/approvals/reassign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getFacultyDashboard: () =>
    request<{
      success: boolean;
      pendingApprovals: any[];
      pendingCount: number;
      inReview: any[];
      changesRequested: any[];
      recentDecisions: any[];
      upcomingEvents: any[];
    }>('/approvals/faculty-dashboard'),
  getHodDashboard: () =>
    request<{
      success: boolean;
      pendingApprovals: any[];
      pendingCount: number;
      upcomingEvents: any[];
      stagedRequests: any[];
      recentDecisions: any[];
      activeReservations: any[];
    }>('/approvals/hod-dashboard'),

  // Handover & Condition Reporting
  getHandoverQueue: () =>
    request<{ success: boolean; readyForCheckout: any[]; activeCheckedOut: any[] }>('/handover/queue'),
  checkoutResource: (payload: any) =>
    request<{ success: boolean; message: string; handover: any }>('/handover/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  returnResource: (payload: any) =>
    request<{ success: boolean; message: string; handover: any }>('/handover/return', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getHandoverHistory: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; count: number; handovers: any[] }>(`/handover/history?${qs}`);
  },

  // Incidents
  getIncidents: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; count: number; incidents: any[] }>(`/incidents?${qs}`);
  },
  getIncidentById: (id: string) =>
    request<{ success: boolean; incident: any }>(`/incidents/${id}`),
  createIncident: (payload: any) =>
    request<{ success: boolean; message: string; incident: any }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIncident: (id: string, payload: any) =>
    request<{ success: boolean; message: string; incident: any }>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; unreadCount: number; notifications: any[] }>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean; notification: any }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/notifications/read-all', { method: 'PUT' }),

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; page: number; limit: number; logs: any[] }>(
      `/audit?${qs}`
    );
  },

  // Analytics
  getDashboardStats: () =>
    request<{ success: boolean; stats: any }>('/analytics/dashboard-stats'),
  getInstitutionAnalytics: () =>
    request<{ success: boolean; data: any }>('/analytics/institution'),

  // AI Assistant: ResourceLoop Intelligence
  askAssistant: (payload: { query: string; context?: any }) =>
    request<{ success: boolean; data: any }>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Users (Admin Management)
  getUsers: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    return request<{ success: boolean; total: number; count: number; totalPages: number; page: number; users: any[] }>(
      `/users?${qs.toString()}`
    );
  },
  getUserById: (id: string) =>
    request<{ success: boolean; user: any }>(`/users/${id}`),
  createUser: (userData: any) =>
    request<{ success: boolean; message: string; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id: string, userData: any) =>
    request<{ success: boolean; message: string; user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Meta
  getDepartments: () => request<{ success: boolean; departments: any[] }>('/meta/departments'),
  getClubs: () => request<{ success: boolean; clubs: any[] }>('/meta/clubs'),
  getFaculty: () => request<{ success: boolean; faculty: any[] }>('/meta/faculty'),
  getSettings: () => request<{ success: boolean; settings: any }>('/meta/settings'),
};
