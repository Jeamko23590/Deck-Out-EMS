import type { LeaderboardEntry, Merchandise, PaymentStatus, Registration, Tournament, TournamentResult } from '../types'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'deckout-ems-token-v1'

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  error?: string
  data: T
}

export interface EmsAdminUser {
  id: string
  username: string
  email: string
  full_name: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

export interface AdminReportStats {
  events: { live_events: number; upcoming_events: number }
  registrations: { total: number; confirmed: number; pending_payments: number }
  verifiedRevenue: number
  products: number
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const envelope = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || envelope.success === false) {
    throw new Error(envelope.message || envelope.error || `Request failed (${response.status})`)
  }
  return envelope.data
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export const authTokenKey = TOKEN_KEY

export const emsApi = {
  auth: {
    login: (email: string, password: string) => request<{ token: string; user: { id: string; username: string; email: string; name: string; role: string } }>('/auth/login', json('POST', { email, password })),
    me: () => request<{ user: { id: string; username: string; email: string; name: string; role: string } }>('/auth/me'),
    updateProfile: (fullName: string) => request<{ user: { id: string; username: string; email: string; full_name: string; role: string } }>('/auth/profile', json('PUT', { fullName })),
    changePassword: (currentPassword: string, newPassword: string) => request<unknown>('/auth/password', json('PUT', { currentPassword, newPassword })),
  },
  tournaments: {
    list: async () => (await request<{ tournaments: Tournament[] }>('/tournaments')).tournaments,
    listAdmin: async () => (await request<{ tournaments: Tournament[] }>('/tournaments/admin/all')).tournaments,
    create: (value: Omit<Tournament, 'id' | 'createdAt'>) => request<{ tournament: Tournament }>('/tournaments', json('POST', value)),
    update: (id: string, value: Partial<Tournament>) => request<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`, json('PUT', value)),
    setStatus: (id: string, status: Tournament['status']) => request<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
    remove: (id: string) => request<unknown>(`/tournaments/${encodeURIComponent(id)}`, json('DELETE')),
  },
  registrations: {
    listAdmin: async () => (await request<{ registrations: Registration[] }>('/registrations')).registrations,
    create: (value: { tournamentId: string; name: string; email: string; tag: string; region: string; method: string; reference: string; note?: string }) => request<{ registration: Registration }>('/registrations', json('POST', value)),
    reviewPayment: (id: string, status: PaymentStatus, note: string) => request<{ registration: Registration }>(`/registrations/${encodeURIComponent(id)}/payment`, json('PATCH', { paymentStatus: status, note })),
    setStatus: (id: string, registrationStatus: Registration['registrationStatus']) => request<{ registration: Registration }>(`/registrations/${encodeURIComponent(id)}/status`, json('PATCH', { registrationStatus })),
  },
  results: {
    list: async () => (await request<{ results: TournamentResult[] }>('/results')).results,
    create: (value: Omit<TournamentResult, 'id'>) => request<{ result: TournamentResult }>('/results', json('POST', value)),
    update: (id: string, value: Partial<TournamentResult>) => request<{ result: TournamentResult }>(`/results/${encodeURIComponent(id)}`, json('PUT', value)),
    remove: (id: string) => request<unknown>(`/results/${encodeURIComponent(id)}`, json('DELETE')),
  },
  leaderboard: {
    list: async () => (await request<{ leaderboard: LeaderboardEntry[] }>('/leaderboard')).leaderboard,
    create: (value: Omit<LeaderboardEntry, 'id' | 'rank'>) => request<{ entry: LeaderboardEntry }>('/leaderboard', json('POST', value)),
    update: (id: string, value: Partial<LeaderboardEntry>) => request<{ entry: LeaderboardEntry }>(`/leaderboard/${encodeURIComponent(id)}`, json('PUT', value)),
    remove: (id: string) => request<unknown>(`/leaderboard/${encodeURIComponent(id)}`, json('DELETE')),
  },
  products: {
    list: async () => (await request<{ merchandise: Merchandise[] }>('/products')).merchandise,
    listAdmin: async () => (await request<{ merchandise: Merchandise[] }>('/products/admin')).merchandise,
    create: (value: Omit<Merchandise, 'id' | 'createdAt'>) => request<{ product: Merchandise }>('/products', json('POST', value)),
    update: (id: string, value: Partial<Merchandise>) => request<{ product: Merchandise }>(`/products/${encodeURIComponent(id)}`, json('PUT', value)),
    archive: (id: string) => request<unknown>(`/products/${encodeURIComponent(id)}`, json('DELETE')),
  },
  categories: {
    list: async () => (await request<{ categories: string[] }>('/categories')).categories,
    create: (name: string) => request<{ category: { id: number; name: string } }>('/categories', json('POST', { name })),
  },
  admin: {
    stats: () => request<AdminReportStats>('/admin/stats'),
    payments: async () => (await request<{ payments: { status: string; count: number; total: number }[] }>('/admin/payments')).payments,
    export: (type: string) => request<{ type: string; rows: Record<string, unknown>[]; count: number }>(`/admin/export/${encodeURIComponent(type)}`),
    listEmsUsers: async () => (await request<{ users: EmsAdminUser[] }>('/admin/ems-users')).users,
    createEmsUser: (value: { username: string; email: string; fullName: string; password: string; role: 'admin' | 'staff' }) => request<{ user: EmsAdminUser }>('/admin/ems-users', json('POST', value)),
    updateEmsUser: (id: string, value: { fullName?: string; role?: 'admin' | 'staff'; isActive?: boolean }) => request<{ user: EmsAdminUser }>(`/admin/ems-users/${encodeURIComponent(id)}`, json('PUT', value)),
  },
}
