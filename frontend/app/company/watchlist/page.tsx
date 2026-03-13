'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, addToWatchlist, removeFromWatchlist, batchAddWatchlist } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { getV2Result, type V2CachedSummary } from '@/lib/v2/cache'

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

const ALL_HK_STOCKS = [
  { symbol: '0700.HK', name: 'Tencent', aliases: ['腾讯', '腾讯控股'] },
  { symbol: '9988.HK', name: 'Alibaba', aliases: ['阿里巴巴', '阿里'] },
  { symbol: '9618.HK', name: 'JD.com', aliases: ['京东'] },
  { symbol: '3690.HK', name: 'Meituan', aliases: ['美团'] },
  { symbol: '9888.HK', name: 'Baidu', aliases: ['百度'] },
  { symbol: '1810.HK', name: 'Xiaomi', aliases: ['小米'] },
  { symbol: '9999.HK', name: 'NetEase', aliases: ['网易'] },
  { symbol: '0388.HK', name: 'HKEX', aliases: ['港交所', '香港交易所'] },
  { symbol: '0005.HK', name: 'HSBC', aliases: ['汇丰', '汇丰银行'] },
  { symbol: '0941.HK', name: 'China Mobile', aliases: ['中国移动'] },
  { symbol: '2318.HK', name: 'Ping An Insurance', aliases: ['平安', '中国平安'] },
  { symbol: '0939.HK', name: 'CCB', aliases: ['建设银行', '建行'] },
  { symbol: '1398.HK', name: 'ICBC', aliases: ['工商银行', '工行'] },
  { symbol: '0883.HK', name: 'CNOOC', aliases: ['中海油'] },
  { symbol: '0857.HK', name: 'PetroChina', aliases: ['中石油', '中国石油'] },
  { symbol: '2020.HK', name: 'Anta Sports', aliases: ['安踏'] },
  { symbol: '9961.HK', name: 'Trip.com', aliases: ['携程'] },
  { symbol: '1024.HK', name: 'Kuaishou', aliases: ['快手'] },
  { symbol: '0268.HK', name: 'Kingdee', aliases: ['金蝶'] },
  { symbol: '0175.HK', name: 'Geely Auto', aliases: ['吉利', '吉利汽车'] },
  { symbol: '2331.HK', name: 'Li Ning', aliases: ['李宁'] },
  { symbol: '6618.HK', name: 'JD Health', aliases: ['京东健康'] },
  { symbol: '0981.HK', name: 'SMIC', aliases: ['中芯国际'] },
  { symbol: '2382.HK', name: 'Sunny Optical', aliases: ['舜宇光学'] },
  { symbol: '0027.HK', name: 'Galaxy Entertainment', aliases: ['银河娱乐'] },
  { symbol: '1211.HK', name: 'BYD', aliases: ['比亚迪'] },
  { symbol: '0285.HK', name: 'BYD Electronic', aliases: ['比亚迪电子'] },
  { symbol: '2269.HK', name: 'WuXi Bio', aliases: ['药明生物'] },
  { symbol: '9626.HK', name: 'Bilibili', aliases: ['B站', '哔哩哔哩'] },
  { symbol: '0241.HK', name: 'Alibaba Health', aliases: ['阿里健康'] },
]

const ALL_A_SHARES = [
  { symbol: '600519.SS', name: 'Kweichow Moutai', aliases: ['茅台', '贵州茅台'] },
  { symbol: '000001.SZ', name: 'Ping An Bank', aliases: ['平安银行'] },
  { symbol: '600036.SS', name: 'China Merchants Bank', aliases: ['招商银行', '招行'] },
  { symbol: '601318.SS', name: 'Ping An Insurance', aliases: ['中国平安', '平安'] },
  { symbol: '000858.SZ', name: 'Wuliangye', aliases: ['五粮液'] },
  { symbol: '002594.SZ', name: 'BYD', aliases: ['比亚迪'] },
  { symbol: '300750.SZ', name: 'CATL', aliases: ['宁德时代'] },
  { symbol: '601012.SS', name: 'LONGi Green Energy', aliases: ['隆基绿能', '隆基'] },
  { symbol: '600900.SS', name: 'CYPC', aliases: ['长江电力'] },
  { symbol: '002415.SZ', name: 'Hikvision', aliases: ['海康威视'] },
  { symbol: '600276.SS', name: 'Hengrui Medicine', aliases: ['恒瑞医药'] },
  { symbol: '601888.SS', name: 'China Tourism Group', aliases: ['中国中免'] },
  { symbol: '000333.SZ', name: 'Midea', aliases: ['美的', '美的集团'] },
  { symbol: '000651.SZ', name: 'Gree Electric', aliases: ['格力', '格力电器'] },
  { symbol: '600030.SS', name: 'CITIC Securities', aliases: ['中信证券'] },
  { symbol: '601166.SS', name: 'Industrial Bank', aliases: ['兴业银行'] },
  { symbol: '600887.SS', name: 'Yili Group', aliases: ['伊利', '伊利股份'] },
  { symbol: '002230.SZ', name: 'iFlytek', aliases: ['科大讯飞'] },
  { symbol: '300059.SZ', name: 'East Money', aliases: ['东方财富'] },
  { symbol: '601899.SS', name: 'Zijin Mining', aliases: ['紫金矿业'] },
  { symbol: '600809.SS', name: 'Shanxi Fenjiu', aliases: ['山西汾酒'] },
  { symbol: '002475.SZ', name: 'Luxshare', aliases: ['立讯精密'] },
  { symbol: '300760.SZ', name: 'Mindray', aliases: ['迈瑞医疗'] },
  { symbol: '601138.SS', name: 'WSTONE', aliases: ['工业富联'] },
  { symbol: '002714.SZ', name: 'Muyuan Foods', aliases: ['牧原股份'] },
  { symbol: '600104.SS', name: 'SAIC Motor', aliases: ['上汽集团', '上汽'] },
  { symbol: '601668.SS', name: 'CSCEC', aliases: ['中国建筑'] },
  { symbol: '000725.SZ', name: 'BOE Technology', aliases: ['京东方'] },
  { symbol: '601633.SS', name: 'Great Wall Motor', aliases: ['长城汽车'] },
  { symbol: '002049.SZ', name: 'Unigroup Guoxin', aliases: ['紫光国微'] },
]

const CRYPTO_POPULAR = ALL_CRYPTO.slice(0, 5)
const HK_POPULAR = ALL_HK_STOCKS.slice(0, 5)
const A_POPULAR = ALL_A_SHARES.slice(0, 5)

export default function WatchlistPage() {
  const router = useRouter()
  const { companyId } = useCompanyContext()
  const { items, loading, refresh } = useWatchlist(companyId)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [selectedMarket, setSelectedMarket] = useState<'crypto' | 'hk_stock' | 'a_share'>('crypto')
  const [mounted, setMounted] = useState(false)
  const [v2Cache, setV2Cache] = useState<Record<string, V2CachedSummary>>({})
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    // Load V2 cached results for all watchlist items
    const cache: Record<string, V2CachedSummary> = {}
    for (const item of items) {
      const c = getV2Result(item.symbol)
      if (c) cache[item.symbol] = c
    }
    setV2Cache(cache)
  }, [items])

  const existingSymbols = new Set(items.map((i: any) => i.symbol))
  const allSymbols = selectedMarket === 'crypto' ? ALL_CRYPTO
    : selectedMarket === 'hk_stock' ? ALL_HK_STOCKS
    : ALL_A_SHARES
  const suggestions = selectedMarket === 'crypto' ? CRYPTO_POPULAR
    : selectedMarket === 'hk_stock' ? HK_POPULAR
    : A_POPULAR
  const marketLabel = selectedMarket === 'crypto' ? '加密货币'
    : selectedMarket === 'hk_stock' ? '港股'
    : 'A股'

  const searchResults = searchQuery.trim().length > 0
    ? allSymbols.filter(s => {
        const q = searchQuery.toUpperCase()
        return s.symbol.includes(q) ||
               s.name.toUpperCase().includes(q) ||
               s.aliases.some(a => a.toUpperCase().includes(q))
      }).slice(0, 10)
    : []

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
      router.push(`/company/watchlist/${encodeURIComponent(item.symbol)}`)
    } else {
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

  const verdictColors: Record<string, string> = {
    LONG: 'bg-army-900/30 text-army-400 border-army-800/30',
    SHORT: 'bg-red-900/30 text-red-400 border-red-800/30',
    HOLD: 'bg-dark-800 text-dark-400 border-dark-700',
    WAIT: 'bg-dark-800 text-dark-500 border-dark-700',
  }
  const verdictLabels: Record<string, string> = {
    LONG: '🟢 做多',
    SHORT: '🔴 做空',
    HOLD: '⚪ 持有',
    WAIT: '⏸️ 等待',
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
            {([
              { key: 'crypto' as const, label: '₿ 加密货币' },
              { key: 'hk_stock' as const, label: '🇭🇰 港股' },
              { key: 'a_share' as const, label: '🇨🇳 A股' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedMarket(tab.key)}
                className={cn('px-3 py-1.5 text-sm rounded-md transition-colors',
                  selectedMarket === tab.key ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200')}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative mb-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder={`搜索${marketLabel}... ${selectedMarket === 'crypto' ? 'BTC、比特币' : selectedMarket === 'hk_stock' ? '0700、腾讯' : '600519、茅台'}`}
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

          {/* Dropdown */}
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
                        <span className="font-bold text-dark-100 text-sm">{item.symbol}</span>
                        <span className="text-dark-400 text-sm ml-2">{item.name}</span>
                      </div>
                      <span className={cn('text-xs', added ? 'text-dark-500' : 'text-army-400')}>
                        {added ? '已自选 → 查看' : '+ 添加'}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-6 text-center text-dark-500 text-sm">
                  <p>没有找到 &quot;{searchQuery}&quot;</p>
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

        {/* Hot tags */}
        {!searchQuery && (
          <div>
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-2">热门推荐</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => {
                const added = existingSymbols.has(s.symbol)
                return (
                  <div
                    key={s.symbol}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
                      added
                        ? 'bg-dark-800 border-dark-700 text-dark-400'
                        : 'bg-dark-850 border-dark-700 text-dark-300'
                    )}
                  >
                    <button
                      onClick={() => added ? handleRemove(items.find((x: any) => x.symbol === s.symbol)?.id) : handleAdd(s.symbol, s.name)}
                      className={cn('transition-colors', added ? 'text-yellow-400 hover:text-yellow-500' : 'text-dark-600 hover:text-yellow-400')}
                    >
                      <svg className="w-4 h-4" fill={added ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={added ? 0 : 1.5} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <Link href={`/company/watchlist/${encodeURIComponent(s.symbol)}`} className="hover:text-army-400 transition-colors">
                      <span className="font-medium">{s.symbol}</span>
                      <span className="text-dark-500 ml-1 text-xs">{s.name}</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Cards */}
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
          {items.map((item: any) => {
            const cached = mounted ? v2Cache[item.symbol] : null
            return (
              <Link
                key={item.id}
                href={`/company/watchlist/${encodeURIComponent(item.symbol)}`}
                className="flex items-center gap-4 p-5 bg-dark-900 rounded-xl border border-dark-800 hover:border-dark-700 hover:bg-dark-850 transition-all group"
              >
                {/* Priority bar */}
                <div className="w-1 h-12 rounded-full flex-shrink-0" style={{
                  backgroundColor: item.priority === 2 ? '#ef4444' : item.priority === 1 ? '#eab308' : '#334155'
                }} />

                {/* Symbol + Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-dark-100 group-hover:text-army-400 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-dark-500 text-sm">{item.display_name}</span>
                  </div>
                  {/* V2 verdict summary or "未分析" */}
                  {cached ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-dark-500 text-xs">
                        {cached.bullishCount}多 {cached.bearishCount}空 {cached.neutralCount}中
                      </span>
                      <span className="text-dark-600 text-xs">·</span>
                      <span className="text-dark-500 text-xs">
                        信心 {(cached.confidence * 100).toFixed(0)}%
                      </span>
                      <span className="text-dark-600 text-xs">·</span>
                      <span className="text-dark-600 text-xs">
                        {(() => {
                          const age = Date.now() - new Date(cached.at).getTime()
                          const min = Math.floor(age / 60000)
                          return min < 60 ? `${min}分钟前` : min < 1440 ? `${Math.floor(min / 60)}小时前` : `${Math.floor(min / 1440)}天前`
                        })()}
                      </span>
                    </div>
                  ) : (
                    <p className="text-dark-600 text-xs mt-1">未分析 — 点击进入分析</p>
                  )}
                </div>

                {/* V2 Verdict Badge */}
                {cached ? (
                  <span className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border flex-shrink-0', verdictColors[cached.verdict] || verdictColors.HOLD)}>
                    {verdictLabels[cached.verdict] || cached.verdict}
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-dark-600 border border-dark-800 flex-shrink-0">
                    待分析
                  </span>
                )}

                {/* Remove star */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(item.id) }}
                  className="p-1.5 text-yellow-400 hover:text-yellow-500 transition-colors flex-shrink-0"
                  title="取消自选"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
