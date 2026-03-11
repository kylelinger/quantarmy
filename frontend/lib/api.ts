import type { ApiResponse, Company, Role, Skill, Position, Trade, BacktestResult } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json: ApiResponse<T> = await res.json()
  if (!json.ok) throw new Error(json.error ?? 'Unknown error')
  return json.data
}

// --- Company ---

export const companyApi = {
  create: (name: string, initial_capital: number, market: string) =>
    request<Company>('/company', {
      method: 'POST',
      body: JSON.stringify({ name, initial_capital, market }),
    }),

  get: (id: string) => request<Company>(`/company/${id}`),

  reset: (id: string) =>
    request<Company>(`/company/${id}/reset`, { method: 'POST' }),

  delete: (id: string) =>
    request<void>(`/company/${id}`, { method: 'DELETE' }),
}

// --- Roles ---

export const roleApi = {
  list: (companyId: string) =>
    request<Role[]>(`/company/${companyId}/roles`),

  get: (companyId: string, roleType: string) =>
    request<Role>(`/company/${companyId}/roles/${roleType}`),

  setSkill: (companyId: string, roleType: string, skillId: string, config?: Record<string, any>) =>
    request<Role>(`/company/${companyId}/roles/${roleType}/skill`, {
      method: 'PUT',
      body: JSON.stringify({ skill_id: skillId, config }),
    }),

  updateConfig: (companyId: string, roleType: string, config: Record<string, any>) =>
    request<Role>(`/company/${companyId}/roles/${roleType}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
}

// --- Skills ---

export const skillApi = {
  list: (params?: { role_type?: string; source?: string; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<Skill[]>(`/skills?${qs}`)
  },

  get: (id: string) => request<Skill>(`/skills/${id}`),

  import: (github_url: string, role_type: string) =>
    request<{ import_id: string; status: string }>('/skills/import', {
      method: 'POST',
      body: JSON.stringify({ github_url, role_type }),
    }),

  importStatus: (importId: string) =>
    request<{ status: string; progress: number; skill_id: string | null }>(`/skills/import/${importId}`),

  backtest: (id: string, symbol: string, period: string, config?: Record<string, any>) =>
    request<BacktestResult>(`/skills/${id}/backtest`, {
      method: 'POST',
      body: JSON.stringify({ symbol, period, config }),
    }),
}

// --- Trading ---

export const tradingApi = {
  positions: (companyId: string) =>
    request<Position[]>(`/company/${companyId}/trading/positions`),

  history: (companyId: string, params?: { limit?: number; offset?: number; symbol?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<Trade[]>(`/company/${companyId}/trading/history?${qs}`)
  },

  performance: (companyId: string) =>
    request<BacktestResult>(`/company/${companyId}/trading/performance`),

  start: (companyId: string) =>
    request<void>(`/company/${companyId}/trading/start`, { method: 'POST' }),

  stop: (companyId: string) =>
    request<void>(`/company/${companyId}/trading/stop`, { method: 'POST' }),
}

// --- Market ---

export const marketApi = {
  symbols: (market?: string) => {
    const qs = market ? `?market=${market}` : ''
    return request<string[]>(`/market/symbols${qs}`)
  },

  price: (symbol: string) =>
    request<{ symbol: string; price: number }>(`/market/price/${symbol}`),

  klines: (symbol: string, interval: string, limit?: number) => {
    const qs = new URLSearchParams({ interval, ...(limit ? { limit: String(limit) } : {}) }).toString()
    return request<any[]>(`/market/klines/${symbol}?${qs}`)
  },
}
