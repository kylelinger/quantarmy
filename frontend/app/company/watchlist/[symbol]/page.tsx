'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, useTicker24h, addToWatchlist, removeFromWatchlist } from '@/lib/hooks'
import { ROLES } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'
import { TradingViewChart } from '@/components/Market/TradingViewChart'
import { openPosition } from '@/lib/paper-trading'

export default function SymbolDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase()
  const { companyId } = useCompanyContext()
  const { items, loading, refresh } = useWatchlist(companyId)
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [showQuickOrder, setShowQuickOrder] = useState(false)
  const [orderNotional, setOrderNotional] = useState('')
  const [orderSide, setOrderSide] = useState<'long' | 'short'>('long')
  const [orderMsg, setOrderMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const item = items.find((x: any) => x.symbol === decodedSymbol)
  const isWatchlisted = !!item
  const analysis = item?.last_analysis || {}
  const isCrypto = decodedSymbol.endsWith('USDT')
  const { ticker } = useTicker24h(isCrypto ? decodedSymbol : null)

  const toggleWatchlist = async () => {
    if (!companyId || toggling) return
    setToggling(true)
    try {
      if (isWatchlisted) {
        await removeFromWatchlist(companyId, item.id)
      } else {
        await addToWatchlist(companyId, decodedSymbol, decodedSymbol, isCrypto ? 'crypto' : 'stock')
      }
      await refresh()
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-dark-500">加载标的详情中...</div>
  }

  const roleOrder = ['collector', 'researcher', 'strategist', 'analyst', 'risk_officer', 'executor', 'cto', 'ceo']

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-dark-100">{decodedSymbol}</h1>
            <button
              onClick={toggleWatchlist}
              disabled={toggling}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isWatchlisted
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-dark-600 hover:text-yellow-400'
              )}
              title={isWatchlisted ? '取消自选' : '添加自选'}
            >
              <svg className="w-6 h-6" fill={isWatchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isWatchlisted ? 0 : 1.5} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            {item && <span className="text-dark-500">{item.display_name}</span>}
            {item && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs border',
                item.priority === 2 ? 'bg-red-900/20 border-red-900/40 text-red-400' :
                item.priority === 1 ? 'bg-yellow-900/20 border-yellow-900/40 text-yellow-400' :
                'bg-dark-800 border-dark-700 text-dark-400'
              )}>
                {item.priority === 2 ? '🔥 核心跟踪' : item.priority === 1 ? '⭐ 重点跟踪' : '普通跟踪'}
              </span>
            )}
          </div>
          <p className="text-dark-400 mt-2 max-w-3xl">
            {isWatchlisted ? 'V1 单标的作战页：8 个角色独立输出，CEO 汇总不覆盖。' : '点击星星添加到自选列表，获取团队分析。'}
          </p>
        </div>
        <div className="text-right">
          {ticker ? (
            <div>
              <p className="text-2xl font-bold text-dark-100">{formatCurrency(ticker.price)}</p>
              <p className={cn('text-sm font-medium', ticker.change_pct_24h >= 0 ? 'text-army-400' : 'text-red-400')}>
                {ticker.change_pct_24h >= 0 ? '+' : ''}{ticker.change_pct_24h.toFixed(2)}%
                <span className="text-dark-500 ml-1">24h</span>
              </p>
              <p className="text-xs text-dark-500 mt-1">
                H {formatCurrency(ticker.high_24h)} · L {formatCurrency(ticker.low_24h)}
              </p>
            </div>
          ) : (
            <div className="text-sm text-dark-500">
              <p>免费实时图表</p>
              <p className="text-dark-400">TradingView Widget</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Order Bar */}
      {ticker && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-dark-400 text-sm">当前价: <span className="text-dark-100 font-bold">{formatCurrency(ticker.price)}</span></span>
              <span className={cn('text-sm font-medium', ticker.change_pct_24h >= 0 ? 'text-army-400' : 'text-red-400')}>
                {ticker.change_pct_24h >= 0 ? '+' : ''}{ticker.change_pct_24h.toFixed(2)}% 24h
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!showQuickOrder ? (
                <button
                  onClick={() => setShowQuickOrder(true)}
                  className="px-4 py-2 bg-army-600 hover:bg-army-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  📝 一键下单
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setOrderSide('long')}
                      className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', orderSide === 'long' ? 'bg-army-900/40 border-army-700 text-army-400' : 'border-dark-700 text-dark-400')}
                    >做多</button>
                    <button
                      onClick={() => setOrderSide('short')}
                      className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', orderSide === 'short' ? 'bg-red-900/40 border-red-700 text-red-400' : 'border-dark-700 text-dark-400')}
                    >做空</button>
                  </div>
                  {[1000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setOrderNotional(String(amt))}
                      className={cn('px-2.5 py-1.5 text-xs rounded-lg border transition-colors', orderNotional === String(amt) ? 'border-army-600 text-army-400' : 'border-dark-700 text-dark-400 hover:border-dark-600')}
                    >${amt.toLocaleString()}</button>
                  ))}
                  <input
                    type="number"
                    value={orderNotional}
                    onChange={(e) => setOrderNotional(e.target.value)}
                    placeholder="金额"
                    className="w-24 bg-dark-800 text-dark-200 rounded-lg px-3 py-1.5 text-xs border border-dark-700 focus:border-army-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!orderNotional || !ticker) return
                      try {
                        openPosition({
                          symbol: decodedSymbol,
                          side: orderSide,
                          notional: parseFloat(orderNotional),
                          price: ticker.price,
                          strategy: 'team-signal',
                          reason: `从${decodedSymbol}详情页下单 | ${orderSide === 'long' ? '做多' : '做空'} @ ${formatCurrency(ticker.price)}`,
                        })
                        setOrderMsg({ type: 'success', text: `✅ ${orderSide === 'long' ? '做多' : '做空'} ${decodedSymbol} $${orderNotional} @ ${formatCurrency(ticker.price)}` })
                        setOrderNotional('')
                        setTimeout(() => setOrderMsg(null), 3000)
                      } catch (e: any) {
                        setOrderMsg({ type: 'error', text: e.message })
                        setTimeout(() => setOrderMsg(null), 3000)
                      }
                    }}
                    disabled={!orderNotional}
                    className="px-4 py-1.5 bg-army-600 hover:bg-army-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                  >
                    确认
                  </button>
                  <button onClick={() => { setShowQuickOrder(false); setOrderNotional('') }} className="text-dark-500 hover:text-dark-300 text-sm px-1">✕</button>
                </div>
              )}
            </div>
          </div>
          {orderMsg && (
            <p className={cn('text-xs mt-2', orderMsg.type === 'success' ? 'text-army-400' : 'text-red-400')}>{orderMsg.text}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-dark-100">实时行情 / K线</h2>
                <p className="text-dark-500 text-sm">可直接用于实战盯盘，不需要付费 API key</p>
              </div>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(decodedSymbol.endsWith('USDT') ? `BINANCE:${decodedSymbol}` : `NASDAQ:${decodedSymbol}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-army-400 hover:text-army-300"
              >
                在 TradingView 打开 ↗
              </a>
            </div>
            <div className="h-[560px]">
              <TradingViewChart symbol={decodedSymbol} interval="60" />
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          {isWatchlisted ? (
            <>
              <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                <h3 className="text-lg font-semibold text-dark-100 mb-3">CEO 摘要</h3>
                <div className="space-y-3 text-sm">
                  <SummaryRow label="团队状态" value={analysis.ceo?.verdict || '等待 CEO 汇总'} />
                  <SummaryRow label="主要分歧" value={analysis.ceo?.debate || '当前分歧主要集中在追高风险与持续性'} />
                  <SummaryRow label="失效条件" value={analysis.ceo?.invalidation || '跌破关键支撑 / 数据质量异常 / 情绪反转'} />
                </div>
              </div>

              <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                <h3 className="text-lg font-semibold text-dark-100 mb-3">用户备注</h3>
                <p className="text-dark-400 text-sm">{item.notes || '暂无备注'}</p>
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 rounded bg-dark-800 text-dark-400 text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-8 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-dark-200 font-medium mb-2">添加到自选</p>
              <p className="text-dark-500 text-sm mb-4">点击标题旁的星星，将 {decodedSymbol} 加入自选列表</p>
              <button
                onClick={toggleWatchlist}
                disabled={toggling}
                className="px-6 py-2.5 bg-army-600 hover:bg-army-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                ⭐ 添加到自选
              </button>
            </div>
          )}
        </div>
      </div>

      {isWatchlisted && <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-dark-100">8 个独立角色输出</h2>
          <p className="text-dark-500 text-sm mt-1">V1 不强行统一口径，先保留不同视角，后续 V2 再引入 battle 机制。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleOrder.map((roleType) => {
            const role = ROLES.find((r) => r.type === roleType as any)
            if (!role) return null
            const data = analysis[roleType]
            return (
              <div key={roleType} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${role.color}20` }}>
                    {role.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">{role.label}</p>
                    <p className="text-xs text-dark-500">独立 Agent 视角</p>
                  </div>
                </div>
                {data ? (
                  <div className="space-y-2 text-sm">
                    {data.signal && <SummaryRow label="信号" value={`${data.signal}${data.confidence !== undefined ? ` · ${(data.confidence * 100).toFixed(0)}%` : ''}`} />}
                    {data.trend && <SummaryRow label="趋势" value={data.trend} />}
                    {data.risk_score !== undefined && <SummaryRow label="风险分" value={`${data.risk_score}/10`} />}
                    {data.sentiment !== undefined && <SummaryRow label="情绪" value={`${(data.sentiment * 100).toFixed(0)}%`} />}
                    {(data.reason || data.notes || data.summary) && <p className="text-dark-400">{data.reason || data.notes || data.summary}</p>}
                    {data.headlines?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {data.headlines.slice(0, 3).map((h: string, i: number) => (
                          <p key={i} className="text-dark-500 text-xs">• {h}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-dark-500 text-sm">该角色尚未生成分析。</p>
                )}
              </div>
            )
          })}
        </div>
      </div>}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-dark-500 min-w-[72px]">{label}</span>
      <span className="text-dark-200 text-right">{value}</span>
    </div>
  )
}
