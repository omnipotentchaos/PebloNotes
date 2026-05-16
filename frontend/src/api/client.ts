/**
 * Peblo Conjure — API Client
 * Centralized HTTP client with JWT auth, error handling, and type-safe methods.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(body.detail || 'Something went wrong', res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    request<{ access_token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request<any>('/auth/me'),
};

// ── Notes ──
export const notesApi = {
  list: (params?: {
    search?: string;
    tag?: string;
    category?: string;
    is_archived?: boolean;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
    }
    const qs = searchParams.toString();
    return request<{ notes: any[]; total: number }>(`/notes${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => request<any>(`/notes/${id}`),

  create: (data: { title?: string; content?: string; tags?: string[]; category?: string }) =>
    request<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/notes/${id}`, { method: 'DELETE' }),

  toggleShare: (id: string) =>
    request<{ share_id: string; share_url: string; is_public: boolean }>(
      `/notes/${id}/share`,
      { method: 'POST' }
    ),

  getTags: () => request<{ tags: { name: string; count: number }[] }>('/notes/tags/all'),
};

// ── AI ──
export const aiApi = {
  generateSummary: (data: { content: string; note_id?: string }) =>
    request<{
      summary: string;
      action_items: string[];
      suggested_title: string;
      tokens_used: number;
    }>('/ai/generate-summary', { method: 'POST', body: JSON.stringify(data) }),

  getUsage: () => request<any>('/ai/usage'),
};

// ── Share ──
export const shareApi = {
  getSharedNote: (shareId: string) => request<any>(`/shared/${shareId}`),
};

// ── Insights ──
export const insightsApi = {
  get: () => request<any>('/insights'),
};

export { ApiError };
