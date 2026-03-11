// ============================================
// QuantArmy Shared Types
// ============================================

// --- Enums ---

export type RoleType =
  | 'ceo'
  | 'cto'
  | 'strategist'
  | 'risk_officer'
  | 'collector'
  | 'executor'
  | 'analyst'
  | 'researcher'

export type MarketType = 'crypto' | 'stock'

export type CompanyStatus = 'active' | 'paused' | 'stopped'

export type SkillSource = 'builtin' | 'marketplace' | 'github'

export type SkillImportStatus = 'analyzing' | 'adapting' | 'testing' | 'success' | 'failed'

export type PositionSide = 'long' | 'short'

// --- Role Metadata ---

export interface RoleMeta {
  type: RoleType
  label: string
  icon: string
  description: string
  color: string
}

export const ROLES: RoleMeta[] = [
  { type: 'ceo', label: 'CEO', icon: '👔', description: '全局决策、资金分配、团队协调', color: '#f59e0b' },
  { type: 'cto', label: 'CTO', icon: '⚙️', description: '系统架构、技术选型、故障处理', color: '#6366f1' },
  { type: 'strategist', label: '策略师', icon: '📈', description: '制定交易策略、参数优化', color: '#22c55e' },
  { type: 'risk_officer', label: '风控官', icon: '🛡️', description: '仓位管理、止损止盈、回撤控制', color: '#ef4444' },
  { type: 'collector', label: '信息采集员', icon: '📡', description: '新闻监控、社交媒体、链上数据', color: '#06b6d4' },
  { type: 'executor', label: '交易执行员', icon: '⚡', description: '订单执行、滑点控制', color: '#f97316' },
  { type: 'analyst', label: '数据分析师', icon: '📊', description: '回测、报表、绩效归因', color: '#8b5cf6' },
  { type: 'researcher', label: '研究员', icon: '🔬', description: '新策略发现、学术论文解读', color: '#ec4899' },
]

// --- Data Models ---

export interface Company {
  id: string
  name: string
  initial_capital: number
  current_equity: number
  market: MarketType
  status: CompanyStatus
  created_at: string
  roles: Role[]
}

export interface Role {
  id: string
  company_id: string
  role_type: RoleType
  active_skill_id: string | null
  active_skill: Skill | null
  config: Record<string, any>
  status: 'active' | 'idle' | 'error'
  last_output: string | null
}

export interface Skill {
  id: string
  name: string
  role_type: RoleType
  version: string
  description: string
  author: string
  source: SkillSource
  source_url: string | null
  parameters: SkillParameter[]
  backtest_result: BacktestResult | null
}

export interface SkillParameter {
  name: string
  type: 'int' | 'float' | 'str' | 'bool' | 'select'
  default: any
  description: string
  min_value?: number
  max_value?: number
  options?: string[]
}

export interface Position {
  id: string
  symbol: string
  side: PositionSide
  size: number
  entry_price: number
  current_price: number
  unrealized_pnl: number
  pnl_pct: number
  opened_at: string
}

export interface Trade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  fee: number
  strategy: string
  signal_reason: string
  executed_at: string
}

export interface BacktestResult {
  trades: number
  win_rate: number
  profit_factor: number
  max_drawdown: number
  sharpe_ratio: number
  total_return: number
}

export interface Signal {
  type: 'trade' | 'risk' | 'info' | 'decision'
  action: string
  symbol: string | null
  confidence: number
  reason: string
  from_role: RoleType
  timestamp: string
}

// --- API Response ---

export interface ApiResponse<T> {
  ok: boolean
  data: T
  error: string | null
}

// --- WebSocket Events ---

export type WSEvent =
  | { type: 'trade'; data: Trade }
  | { type: 'message'; data: { from: RoleType; to: RoleType; signal: Signal } }
  | { type: 'equity_update'; data: { equity: number; pnl: number } }
  | { type: 'skill_status'; data: { role: RoleType; status: string; last_output: any } }
  | { type: 'log'; data: { role: RoleType; level: string; message: string } }
