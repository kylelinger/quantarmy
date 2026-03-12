'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistItem, requestAnalysis, batchAddWatchlist } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { ROLES } from '@/lib/types'

// Full searchable symbol database
const ALL_CRYPTO = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', aliases: ['BTC', '比特币'] },
  { symbol: 'ETHUSDT', name: 'Ethereum', aliases: ['ETH', '以太坊'] },
  { symbol: 'SOLUSDT', name: 'Solana', aliases: ['SOL'] },
  { symbol: 'BNBUSDT', name: 'BNB', aliases: ['币安币'] },
  { symbol: 'XRPUSDT', name: 'XRP', aliases: ['瑞波'] },
  { symbol: 'ADAUSDT', name: 'Cardano', aliases: ['ADA'] },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', aliases: ['DOGE', '狗狗币'] },
  { symbol: 'AVAXUSDT', name: 'Avalanche', aliases: ['AVAX'] },
  { symbol: 'DOTUSDT', name: 'Polkadot', aliases: ['DOT', '波卡'] },
  { symbol: 'LINKUSDT', name: 'Chainlink', aliases: ['LINK'] },
  { symbol: 'MATICUSDT', name: 'Polygon', aliases: ['MATIC', 'POL'] },
  { symbol: 'NEARUSDT', name: 'NEAR Protocol', aliases: ['NEAR'] },
  { symbol: 'UNIUSDT', name: 'Uniswap', aliases: ['UNI'] },
  { symbol: 'ATOMUSDT', name: 'Cosmos', aliases: ['ATOM'] },
  { symbol: 'LTCUSDT', name: 'Litecoin', aliases: ['LTC', '莱特币'] },
  { symbol: 'APTUSDT', name: 'Aptos', aliases: ['APT'] },
  { symbol: 'ARBUSDT', name: 'Arbitrum', aliases: ['ARB'] },
  { symbol: 'OPUSDT', name: 'Optimism', aliases: ['OP'] },
  { symbol: 'FILUSDT', name: 'Filecoin', aliases: ['FIL'] },
  { symbol: 'AAVEUSDT', name: 'Aave', aliases: ['AAVE'] },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', aliases: ['SHIB', '柴犬币'] },
  { symbol: 'TRXUSDT', name: 'TRON', aliases: ['TRX', '波场'] },
  { symbol: 'ICPUSDT', name: 'Internet Computer', aliases: ['ICP'] },
  { symbol: 'MKRUSDT', name: 'Maker', aliases: ['MKR'] },
  { symbol: 'INJUSDT', name: 'Injective', aliases: ['INJ'] },
  { symbol: 'SUIUSDT', name: 'Sui', aliases: ['SUI'] },
  { symbol: 'SEIUSDT', name: 'Sei', aliases: ['SEI'] },
  { symbol: 'TIAUSDT', name: 'Celestia', aliases: ['TIA'] },
  { symbol: 'JUPUSDT', name: 'Jupiter', aliases: ['JUP'] },
  { symbol: 'WIFUSDT', name: 'dogwifhat', aliases: ['WIF'] },
  { symbol: 'PEPEUSDT', name: 'Pepe', aliases: ['PEPE'] },
  { symbol: 'RENDERUSDT', name: 'Render', aliases: ['RNDR', 'RENDER'] },
  { symbol: 'FETUSDT', name: 'Fetch.ai', aliases: ['FET'] },
  { symbol: 'RUNEUSDT', name: 'THORChain', aliases: ['RUNE'] },
  { symbol: 'PENDLEUSDT', name: 'Pendle', aliases: ['PENDLE'] },
  { symbol: 'ENAUSDT', name: 'Ethena', aliases: ['ENA'] },
  { symbol: 'ONDOUSDT', name: 'Ondo', aliases: ['ONDO'] },
  { symbol: 'STXUSDT', name: 'Stacks', aliases: ['STX'] },
]

const ALL_STOCKS = [
  { symbol: 'AAPL', name: 'Apple', aliases: ['苹果'] },
  { symbol: 'MSFT', name: 'Microsoft', aliases: ['微软'] },
  { symbol: 'GOOGL', name: 'Google / Alphabet', aliases: ['谷歌', 'GOOG'] },
  { symbol: 'AMZN', name: 'Amazon', aliases: ['亚马逊'] },
  { symbol: 'NVDA', name: 'NVIDIA', aliases: ['英伟达'] },
  { symbol: 'TSLA', name: 'Tesla', aliases: ['特斯拉'] },
  { symbol: 'META', name: 'Meta Platforms', aliases: ['Facebook', 'FB', '脸书'] },
  { symbol: 'AMD', name: 'AMD', aliases: ['超威半导体'] },
  { symbol: 'NFLX', name: 'Netflix', aliases: ['奈飞'] },
  { symbol: 'AVGO', name: 'Broadcom', aliases: ['博通'] },
  { symbol: 'CRM', name: 'Salesforce', aliases: [] },
  { symbol: 'ORCL', name: 'Oracle', aliases: ['甲骨文'] },
  { symbol: 'INTC', name: 'Intel', aliases: ['英特尔'] },
  { symbol: 'PLTR', name: 'Palantir', aliases: [] },
  { symbol: 'COIN', name: 'Coinbase', aliases: [] },
  { symbol: 'MSTR', name: 'MicroStrategy', aliases: [] },
  { symbol: 'ARM', name: 'ARM Holdings', aliases: [] },
  { symbol: 'SMCI', name: 'Super Micro Computer', aliases: [] },
  { symbol: 'SNOW', name: 'Snowflake', aliases: [] },
  { symbol: 'SQ', name: 'Block (Square)', aliases: [] },
  { symbol: 'SHOP', name: 'Shopify', aliases: [] },
  { symbol: 'JPM', name: 'JPMorgan Chase', aliases: ['摩根大通'] },
  { symbol: 'V', name: 'Visa', aliases: [] },
  { symbol: 'MA', name: 'Mastercard', aliases: ['万事达'] },
  { symbol: 'BAC', name: 'Bank of America', aliases: ['美国银行'] },
  { symbol: 'WMT', name: 'Walmart', aliases: ['沃尔玛'] },
  { symbol: 'DIS', name: 'Walt Disney', aliases: ['迪士尼'] },
  { symbol: 'BABA', name: 'Alibaba', aliases: ['阿里巴巴'] },
  { symbol: 'PDD', name: 'PDD Holdings', aliases: ['拼多多'] },
  { symbol: 'JD', name: 'JD.com', aliases: ['京东'] },
  { symbol: 'BIDU', name: 'Baidu', aliases: ['百度'] },
  { symbol: 'NIO', name: 'NIO', aliases: ['蔚来'] },
  { symbol: 'LI', name: 'Li Auto', aliases: ['理想汽车'] },
  { symbol: 'XPEV', name: 'XPeng', aliases: ['小鹏汽车'] },
]

// For backward compat with hot-tags
const CRYPTO_POPULAR = ALL_CRYPTO.slice(0, 12)
const STOCK_POPULAR = ALL_STOCKS.slice(0, 8)

const PRIORITY_LABELS: Record<number, { label: string; color: string; icon: string }> = {
  0: { label: '普通', color: 'text-dark-500', icon: '' },
  1: { label: '重点', color: 'text-yellow-500', icon: '⭐' },
  2: { label: '核心', color: 'text-red-400', icon: '🔥' },
}

export default function WatchlistPage() {
  const router = useRouter()
  const { companyId, company } = useCompanyContext()
  const { items, loading, refresh } = useWatchlist(companyId)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [selectedMarket, setSelectedMarket] = useState<'crypto' | 'stock'>(
    (company?.market as 'crypto' | 'stock') || 'crypto'
  )
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const existingSymbols = new Set(items.map((i: any) => i.symbol))
  const allSymbols = selectedMarket === 'crypto' ? ALL_CRYPTO : ALL_STOCKS
  const suggestions = selectedMarket === 'crypto' ? CRYPTO_POPULAR : STOCK_POPULAR

  // Filter search results
  const searchResults = searchQuery.trim().length > 0
    ? allSymbols.filter(s => {
        const q = searchQuery.toUpperCase()
        return s.symbol.includes(q) ||
               s.name.toUpperCase().includes(q) ||
               s.aliases.some(a => a.toUpperCase().includes(q))
      }).slice(0, 10)
    : []

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async (symbol: string, displayName: string) => {
    if (!companyId) return
    try {
      await addToWatchlist(companyId, symbol, displayName, selectedMarket)
      await refresh()
    } catch (e: any) {
      console.error('Add failed:', e.message)
    }
  }

  const handleSelectResult = async (item: typeof allSymbols[0]) => {
    if (existingSymbols.has(item.symbol)) {
      // Already added — navigate to detail
      router.push(`/company/watchlist/${encodeURIComponent(item.symbol)}`)
    } else {
      // Add then navigate
      await handleAdd(item.symbol, item.name)
      router.push(`/company/watchlist/${encodeURIComponent(item.symbol)}`)
    }
    setSearchQuery('')
    setShowDropdown(false)
    setHighlightIdx(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        // Direct add if no results match
        handleAdd(searchQuery.trim().toUpperCase(), searchQuery.trim().toUpperCase())
        setSearchQuery('')
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(prev => Math.min(prev + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = highlightIdx >= 0 ? highlightIdx : 0
      handleSelectResult(searchResults[idx])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
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

        {/* Search with autocomplete dropdown */}
        <div ref={searchRef} className="relative mb-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder={selectedMarket === 'crypto' ? '搜索加密货币... BTC、比特币、Ethereum' : '搜索股票... AAPL、苹果、Tesla'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
                setHighlightIdx(-1)
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className="w-full bg-dark-800 text-dark-200 rounded-lg pl-10 pr-4 py-3.5 text-sm border border-dark-700 focus:border-army-600 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowDropdown(false); inputRef.current?.focus() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
              >✕</button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-dark-850 border border-dark-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => {
                  const added = existingSymbols.has(item.symbol)
                  return (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelectResult(item)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-dark-800 last:border-0',
                        idx === highlightIdx ? 'bg-dark-700' : 'hover:bg-dark-800'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-dark-100 text-sm">{item.symbol}</span>
                          <span className="text-dark-400 text-sm">{item.name}</span>
                        </div>
                      </div>
                      {added ? (
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          ✓ 已添加 <span className="text-army-500">→ 查看</span>
                        </span>
                      ) : (
                        <span className="text-xs text-army-400 px-2 py-1 bg-army-900/30 rounded">
                          + 添加并查看
                        </span>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-6 text-center text-dark-500 text-sm">
                  <p>没有找到 "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      handleAdd(searchQuery.trim().toUpperCase(), searchQuery.trim().toUpperCase())
                      setSearchQuery('')
                      setShowDropdown(false)
                    }}
                    className="mt-2 text-army-400 hover:text-army-300"
                  >
                    手动添加 {searchQuery.trim().toUpperCase()} →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hot tags (only when not searching) */}
        {!searchQuery && (
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
                    onClick={() => added
                      ? router.push(`/company/watchlist/${encodeURIComponent(s.symbol)}`)
                      : handleAdd(s.symbol, s.name)
                    }
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-colors',
                      added
                        ? 'bg-dark-800 border-dark-700 text-dark-500 hover:border-dark-600 cursor-pointer'
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
        )}
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
