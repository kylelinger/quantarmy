'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Company, Role, Skill, Position, Trade, BacktestResult, WSEvent, RoleType } from './types'

const BASE = '/api'

// --- Generic fetcher ---

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error ?? `API error: ${res.status}`)
  return json.data as T
}

// --- Company ---

export function useCompany(id: string | null) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await apiFetch<Company>(`/company/${id}`)
      setCompany(data)
    } catch (e) {
      console.error('Failed to fetch company:', e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { refresh() }, [refresh])
  return { company, loading, refresh }
}

export async function createCompany(name: string, initial_capital: number, market: string) {
  return apiFetch<Company>('/company', {
    method: 'POST',
    body: JSON.stringify({ name, initial_capital, market }),
  })
}

// --- Roles ---

export function useRoles(companyId: string | null) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await apiFetch<Role[]>(`/company/${companyId}/roles`)
      setRoles(data)
    } catch (e) {
      console.error('Failed to fetch roles:', e)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { refresh() }, [refresh])
  return { roles, loading, refresh }
}

export async function setRoleSkill(companyId: string, roleType: string, skillId: string, config?: Record<string, any>) {
  return apiFetch<Role>(`/company/${companyId}/roles/${roleType}/skill`, {
    method: 'PUT',
    body: JSON.stringify({ skill_id: skillId, config }),
  })
}

// --- Skills ---

export function useSkills(params?: { role_type?: string; source?: string; search?: string }) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams(params as any).toString()
      const data = await apiFetch<Skill[]>(`/skills?${qs}`)
      setSkills(data)
    } catch (e) {
      console.error('Failed to fetch skills:', e)
    } finally {
      setLoading(false)
    }
  }, [params?.role_type, params?.source, params?.search])

  useEffect(() => { refresh() }, [refresh])
  return { skills, loading, refresh }
}

export async function runBacktest(skillId: string, symbol: string, period: string, config?: Record<string, any>) {
  return apiFetch<BacktestResult & { error?: string }>(`/skills/${skillId}/backtest`, {
    method: 'POST',
    body: JSON.stringify({ symbol, period, config }),
  })
}

export async function importSkill(githubUrl: string, roleType: string) {
  return apiFetch<{ import_id: string; status: string }>('/skills/import', {
    method: 'POST',
    body: JSON.stringify({ github_url: githubUrl, role_type: roleType }),
  })
}

// --- Trading ---

export function usePositions(companyId: string | null) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await apiFetch<Position[]>(`/company/${companyId}/trading/positions`)
      setPositions(data)
    } catch (e) {
      console.error('Failed to fetch positions:', e)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { refresh() }, [refresh])
  return { positions, loading, refresh }
}

export function useTradeHistory(companyId: string | null, limit = 50) {
  const [trades, setTrades] = useState<Trade[]>([])

  const refresh = useCallback(async () => {
    if (!companyId) return
    try {
      const data = await apiFetch<Trade[]>(`/company/${companyId}/trading/history?limit=${limit}`)
      setTrades(data)
    } catch (e) {
      console.error('Failed to fetch trade history:', e)
    }
  }, [companyId, limit])

  useEffect(() => { refresh() }, [refresh])
  return { trades, refresh }
}

export async function startTrading(companyId: string) {
  return apiFetch<{ message: string; status: string }>(`/company/${companyId}/trading/start`, { method: 'POST' })
}

export async function stopTrading(companyId: string) {
  return apiFetch<{ message: string; status: string }>(`/company/${companyId}/trading/stop`, { method: 'POST' })
}

// --- WebSocket ---

export function useCompanyWS(companyId: string | null) {
  const [events, setEvents] = useState<WSEvent[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!companyId) return

    const wsBase = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'
    const ws = new WebSocket(`${wsBase}/ws/${companyId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as WSEvent
        setEvents(prev => [...prev.slice(-200), event])  // Keep last 200
      } catch {}
    }

    // Ping every 25s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      ws.close()
    }
  }, [companyId])

  return { events, connected }
}

// --- Watchlist ---

export function useWatchlist(companyId: string | null) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await apiFetch<any[]>(`/company/${companyId}/watchlist`)
      setItems(data)
    } catch (e) {
      console.error('Failed to fetch watchlist:', e)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { refresh() }, [refresh])
  return { items, loading, refresh }
}

export async function addToWatchlist(companyId: string, symbol: string, displayName?: string, market = 'crypto') {
  return apiFetch<any>(`/company/${companyId}/watchlist`, {
    method: 'POST',
    body: JSON.stringify({ symbol, display_name: displayName || symbol, market }),
  })
}

export async function batchAddWatchlist(companyId: string, symbols: Array<{ symbol: string; display_name?: string; market?: string }>) {
  return apiFetch<any>(`/company/${companyId}/watchlist/batch`, {
    method: 'POST',
    body: JSON.stringify({ symbols }),
  })
}

export async function removeFromWatchlist(companyId: string, itemId: string) {
  return apiFetch<any>(`/company/${companyId}/watchlist/${itemId}`, { method: 'DELETE' })
}

export async function updateWatchlistItem(companyId: string, itemId: string, updates: { notes?: string; tags?: string[]; priority?: number }) {
  return apiFetch<any>(`/company/${companyId}/watchlist/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function requestAnalysis(companyId: string, itemId: string) {
  return apiFetch<any>(`/company/${companyId}/watchlist/${itemId}/analyze`, { method: 'POST' })
}

// --- Performance ---

export function usePerformance(companyId: string | null) {
  const [perf, setPerf] = useState<BacktestResult | null>(null)

  const refresh = useCallback(async () => {
    if (!companyId) return
    try {
      const data = await apiFetch<BacktestResult>(`/company/${companyId}/trading/performance`)
      setPerf(data)
    } catch (e) {
      console.error('Failed to fetch performance:', e)
    }
  }, [companyId])

  useEffect(() => { refresh() }, [refresh])
  return { perf, refresh }
}

// --- Equity curve ---

export function useEquityCurve(companyId: string | null) {
  const [data, setData] = useState<{ time: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetch_() {
      try {
        const d = await apiFetch<{ time: string; value: number }[]>(`/company/${companyId}/trading/equity`)
        if (!cancelled) setData(d)
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch_()
    return () => { cancelled = true }
  }, [companyId])

  return { data, loading }
}

// --- Real-time ticker ---

interface Ticker24h {
  symbol: string
  price: number
  change_24h: number
  change_pct_24h: number
  high_24h: number
  low_24h: number
  volume_24h: number
  quote_volume_24h: number
  source: string
}

export function useTicker24h(symbol: string | null, refreshIntervalMs = 15000) {
  const [ticker, setTicker] = useState<Ticker24h | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false

    async function fetchTicker() {
      try {
        const res = await fetch(`/api/market/ticker24h?symbol=${encodeURIComponent(symbol!)}`)
        const json = await res.json()
        if (!cancelled && json.ok) {
          setTicker(json.data)
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTicker()
    const interval = setInterval(fetchTicker, refreshIntervalMs)
    return () => { cancelled = true; clearInterval(interval) }
  }, [symbol, refreshIntervalMs])

  return { ticker, loading }
}
