'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistItem, requestAnalysis, batchAddWatchlist } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ROLES } from '@/lib/types'

// Popular symbol suggestions
const CRYPTO_POPULAR = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'XRPUSDT', name: 'XRP' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'DOTUSDT', name: 'Polkadot' },
  { symbol: 'LINKUSDT', name: 'Chainlink' },
  { symbol: 'MATICUSDT', name: 'Polygon' },
  { symbol: 'NEARUSDT', name: 'NEAR Protocol' },
]

const STOCK_POPULAR = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AMD', name: 'AMD' },
]

const PRIORITY_LABELS: Record<number, { label: string; color: string; icon: string }> = {
  0: { label: '普通', color: 'text-dark-500', icon: '' },
  1: { label: '重点', color: 'text-yellow-500', icon: '⭐' },
  2: { label: '核心', color: 'text-red-400', icon: '🔥' },
}

export default function WatchlistPage() {
  const { companyId, company } = useCompanyContext()
  const { items, loading, refresh } = useWatchlist(companyId)
  const [adding, setAdding] = useState(false)
  const [customSymbol, setCustomSymbol] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<'crypto' | 'stock'>(
    (company?.market as 'crypto' | 'stock') || 'crypto'
  )
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  const existingSymbols = new Set(items.map((i: any) => i.symbol))
  const suggestions = selectedMarket === 'crypto' ? CRYPTO_POPULAR : STOCK_POPULAR

  const handleAdd = async (symbol: string, displayName: string) => {
    if (!companyId) return
    try {
      await addToWatchlist(companyId, symbol, displayName, selectedMarket)
      await refresh()
    } catch (e: any) {
      console.error('Add failed:', e.message)
    }
  }

  const handleAddCustom = async () => {
    if (!customSymbol.trim() || !companyId) return
    await handleAdd(customSymbol.trim().toUpperCase(), customSymbol.trim().toUpperCase())
    setCustomSymbol('')
  }

  const handleRemove = async (itemId: string) => {
    if (!companyId) return
    await removeFromWatchlist(companyId, itemId)
    await refresh()
  }

  const handlePriority = async (itemId: string, priority: number) => {
    if (!companyId) return
    await updateWatchlistItem(companyId, itemId, { priority })
    await refresh()
  }

  const handleAnalyze = async (itemId: string) => {
    if (!companyId) return
    setAnalyzing(itemId)
    try {
      await requestAnalysis(companyId, itemId)
      await refresh()
    } finally {
      setAnalyzing(null)
    }
  }

  const handleBatchAdd = async () => {
    if (!companyId) return
    const toAdd = suggestions
      .filter(s => !existingSymbols.has(s.symbol))
      .map(s => ({ symbol: s.symbol, display_name: s.name, market: selectedMarket }))
    if (toAdd.length === 0) return
    await batchAddWatchlist(companyId, toAdd)
    await refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-100">📋 自选标的</h1>
          <p className="text-dark-400 mt-1">添加你关注的标的，团队将为你提供分析和建议</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-500 text-sm">已添加</span>
          <span className="text-2xl font-bold text-army-400">{items.length}</span>
        </div>
      </div>

      {/* Add Symbol Section */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-200">添加标的</h3>
          <div className="flex gap-1 bg-dark-850 rounded-lg p-1">
            <button
              onClick={() => setSelectedMarket('crypto')}
              className={cn('px-4 py-1.5 text-sm rounded-md transition-colors',
                selectedMarket === 'crypto' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200')}
            >₿ 加密货币</button>
            <button
              onClick={() => setSelectedMarket('stock')}
              className={cn('px-4 py-1.5 text-sm rounded-md transition-colors',
                selectedMarket === 'stock' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200')}
            >📈 股票</button>
          </div>
        </div>

        {/* Custom input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={selectedMarket === 'crypto' ? '输入交易对，如 BTCUSDT' : '输入股票代码，如 AAPL'}
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            className="flex-1 bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
          />
          <button
            onClick={handleAddCustom}
            disabled={!customSymbol.trim()}
            className="px-6 py-3 bg-army-600 hover:bg-army-500 disabled:bg-dark-700 disabled:text-dark-500 text-white text-sm rounded-lg transition-colors"
          >
            + 添加
          </button>
        </div>

        {/* Quick suggestions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-dark-500 uppercase tracking-wider">热门推荐</p>
            <button
              onClick={handleBatchAdd}
              className="text-xs text-army-400 hover:text-army-300 transition-colors"
            >
              一键添加全部
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => {
              const added = existingSymbols.has(s.symbol)
              return (
                <button
                  key={s.symbol}
                  onClick={() => !added && handleAdd(s.symbol, s.name)}
                  disabled={added}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm border transition-colors',
                    added
                      ? 'bg-dark-800 border-dark-700 text-dark-500 cursor-default'
                      : 'bg-dark-850 border-dark-700 text-dark-300 hover:border-army-600 hover:text-army-400'
                  )}
                >
                  <span className="font-medium">{s.symbol}</span>
                  <span className="text-dark-500 ml-1 text-xs">{s.name}</span>
                  {added && <span className="ml-1 text-dark-600">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Watchlist */}
      {loading ? (
        <div className="text-center py-12 text-dark-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-dark-300 text-lg mb-2">还没有添加任何标的</p>
          <p className="text-dark-500">从上方添加你关注的标的，团队将开始为你分析</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <WatchlistCard
              key={item.id}
              item={item}
              expanded={expandedItem === item.id}
              analyzing={analyzing === item.id}
              onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              onRemove={() => handleRemove(item.id)}
              onPriority={(p: number) => handlePriority(item.id, p)}
              onAnalyze={() => handleAnalyze(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WatchlistCard({
  item,
  expanded,
  analyzing,
  onToggle,
  onRemove,
  onPriority,
  onAnalyze,
}: {
  item: any
  expanded: boolean
  analyzing: boolean
  onToggle: () => void
  onRemove: () => void
  onPriority: (p: number) => void
  onAnalyze: () => void
}) {
  const analysis = item.last_analysis || {}
  const hasAnalysis = Object.keys(analysis).length > 0
  const priority = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS[0]

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      {/* Main row — clicking navigates to detail page */}
      <Link
        href={`/company/watchlist/${encodeURIComponent(item.symbol)}`}
        className="flex items-center gap-4 p-5 hover:bg-dark-850 transition-colors"
      >
        {/* Priority indicator */}
        <div className="w-1 h-10 rounded-full" style={{
          backgroundColor: item.priority === 2 ? '#ef4444' : item.priority === 1 ? '#eab308' : '#334155'
        }} />

        {/* Symbol info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-dark-100 group-hover:text-army-400 transition-colors">
              {item.symbol}
            </span>
            {priority.icon && <span>{priority.icon}</span>}
            <span className="text-dark-500 text-sm">{item.display_name}</span>
          </div>
          {item.notes && (
            <p className="text-dark-500 text-xs mt-1 truncate">{item.notes}</p>
          )}
          {item.tags?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-2xs px-2 py-0.5 bg-dark-800 text-dark-400 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Role analysis summary (mini) */}
        <div className="flex gap-1">
          {ROLES.slice(2, 6).map(role => {
            const roleAnalysis = analysis[role.type]
            return (
              <div
                key={role.type}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                  roleAnalysis ? 'bg-dark-800' : 'bg-dark-850 opacity-40'
                )}
                title={roleAnalysis ? `${role.label}: 已分析` : `${role.label}: 未分析`}
              >
                {role.icon}
              </div>
            )
          })}
        </div>

        {/* Actions — stop propagation to prevent navigation */}
        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => { e.preventDefault(); onAnalyze() }}
            disabled={analyzing}
            className="px-3 py-1.5 text-xs bg-army-900/30 text-army-400 hover:bg-army-900/50 rounded-lg transition-colors disabled:opacity-50"
          >
            {analyzing ? '🔄' : '🔍'} 分析
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onToggle() }}
            className="px-2 py-1.5 text-xs text-dark-500 hover:text-dark-300 transition-colors"
            title="展开详情"
          >
            <span className={cn('inline-block transition-transform', expanded && 'rotate-180')}>▾</span>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onRemove() }}
            className="px-2 py-1.5 text-xs text-dark-500 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </Link>

      {/* Expanded analysis panel */}
      {expanded && (
        <div className="border-t border-dark-800 p-5">
          {/* Priority selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-dark-500">优先级:</span>
            {[0, 1, 2].map(p => (
              <button
                key={p}
                onClick={() => onPriority(p)}
                className={cn(
                  'px-3 py-1 text-xs rounded-lg border transition-colors',
                  item.priority === p
                    ? 'border-army-600 bg-army-900/30 text-army-400'
                    : 'border-dark-700 text-dark-400 hover:border-dark-600'
                )}
              >
                {PRIORITY_LABELS[p].icon} {PRIORITY_LABELS[p].label}
              </button>
            ))}
          </div>

          {/* Team Analysis Grid */}
          {hasAnalysis ? (
            <div className="grid grid-cols-2 gap-3">
              {ROLES.filter(r => analysis[r.type]).map(role => (
                <AnalysisCard key={role.type} role={role} data={analysis[role.type]} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-dark-500">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">尚未分析 — 点击"分析"让团队开始工作</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnalysisCard({ role, data }: { role: any; data: any }) {
  return (
    <div className="bg-dark-850 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{role.icon}</span>
        <span className="text-sm font-medium" style={{ color: role.color }}>{role.label}</span>
        {data.at && (
          <span className="text-2xs text-dark-600 ml-auto">{new Date(data.at).toLocaleString('zh-CN')}</span>
        )}
      </div>
      <div className="space-y-1 text-sm">
        {data.signal && (
          <div className="flex items-center gap-2">
            <span className="text-dark-500">信号:</span>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              data.signal === 'LONG' ? 'bg-army-900/30 text-army-400' :
              data.signal === 'SHORT' ? 'bg-red-900/30 text-red-400' :
              'bg-dark-800 text-dark-400'
            )}>
              {data.signal}
            </span>
            {data.confidence !== undefined && (
              <span className="text-dark-500 text-xs">置信度 {(data.confidence * 100).toFixed(0)}%</span>
            )}
          </div>
        )}
        {data.risk_score !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-dark-500">风险评分:</span>
            <span className={cn(
              'font-medium',
              data.risk_score <= 3 ? 'text-army-400' : data.risk_score <= 6 ? 'text-yellow-500' : 'text-red-400'
            )}>
              {data.risk_score}/10
            </span>
          </div>
        )}
        {data.sentiment !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-dark-500">市场情绪:</span>
            <span className={cn(
              'font-medium',
              data.sentiment > 0.5 ? 'text-army-400' : data.sentiment < -0.2 ? 'text-red-400' : 'text-dark-300'
            )}>
              {data.sentiment > 0.5 ? '😊 乐观' : data.sentiment < -0.2 ? '😰 悲观' : '😐 中性'}
              ({(data.sentiment * 100).toFixed(0)}%)
            </span>
          </div>
        )}
        {data.trend && (
          <div className="flex items-center gap-2">
            <span className="text-dark-500">趋势:</span>
            <span className="text-dark-300">{data.trend}</span>
          </div>
        )}
        {data.reason && (
          <p className="text-dark-400 text-xs mt-1">{data.reason}</p>
        )}
        {data.notes && (
          <p className="text-dark-400 text-xs mt-1">{data.notes}</p>
        )}
        {data.headlines && data.headlines.length > 0 && (
          <div className="mt-2 space-y-1">
            {data.headlines.slice(0, 3).map((h: string, i: number) => (
              <p key={i} className="text-dark-500 text-xs">📰 {h}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
