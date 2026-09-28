/**
 * SOClens Frontend API Client
 * Connects directly to local supervisory backend /api/* routes
 */

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('soclens_token') || localStorage.getItem('sat_sa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  getMe: () => request<{ user: any }>('/auth/me'),

  // Data & Lifecycle
  generateDemoData: () =>
    request<{ message: string; counts: any; assessment: any }>('/data/generate-demo', {
      method: 'POST'
    }),
  runAssessment: () =>
    request<{ message: string; result: any }>('/analytics/run', {
      method: 'POST'
    }),
  getDataStatus: () => request<any>('/data/status'),
  uploadData: (payload: { fileName: string; format: string; content: string }) =>
    request<any>('/data/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),

  // CSE
  getCSEs: () => request<any[]>('/cse'),
  getCSEById: (id: string) => request<any>(`/cse/${id}`),

  // Findings
  getFindings: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any[]>(`/findings${params ? `?${params}` : ''}`);
  },
  getFindingById: (id: string) => request<any>(`/findings/${id}`),
  reviewFinding: (id: string, action: string, note: string) =>
    request<any>(`/findings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, note })
    }),

  // Cases
  getCases: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any[]>(`/cases${params ? `?${params}` : ''}`);
  },
  getCaseById: (id: string) => request<any>(`/cases/${id}`),

  // Negative Space & Contradictions
  getNegativeSpaceGaps: (cseId?: string) =>
    request<any[]>(`/negative-space${cseId ? `?cseId=${cseId}` : ''}`),
  getContradictions: (cseId?: string) =>
    request<any[]>(`/kpi-evidence${cseId ? `?cseId=${cseId}` : ''}`),
  getContradictionById: (id: string) => request<any>(`/kpi-evidence/${id}`),
  reviewContradiction: (id: string, action: string, note: string) =>
    request<any>(`/kpi-evidence/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, note })
    }),

  // Benchmarking & Trends
  getBenchmarking: () => request<any>('/benchmarking'),
  getTrends: () => request<any>('/trends'),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/audit'),

  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (payload: any) =>
    request<any>('/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetSettings: () =>
    request<any>('/settings/reset', {
      method: 'POST'
    }),

  // Global Search
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),

  // Reports
  getReportsSummary: () => request<any>('/reports/summary')
};
