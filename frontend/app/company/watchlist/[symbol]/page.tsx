'use client'

import Link from 'next/link'
import { use } from 'react'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist } from '@/lib/hooks'
import { ROLES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TradingViewChart } from '@/components/Market/TradingViewChart'

export default function SymbolDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase()
  const { companyId } = useCompanyContext()
  const { items, loading } = useWatchlist(companyId)

  const item = items.find((x: any) => x.symbol === decodedSymbol)
  const analysis = item?.last_analysis || {}

  if (loading) {
    return <div className="py-16 text-center text-dark-500">加载标的详情中...</div>
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
          <p className="text-dark-300 text-lg">未找到标的：{decodedSymbol}</p>
        </div>
      </div>
    )
  }

  const roleOrder = ['collector', 'researcher', 'strategist', 'analyst', 'risk_officer', 'executor', 'cto', 'ceo']

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-dark-100">{item.symbol}</h1>
            <span className="text-dark-500">{item.display_name}</span>
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs border',
              item.priority === 2 ? 'bg-red-900/20 border-red-900/40 text-red-400' :
              item.priority === 1 ? 'bg-yellow-900/20 border-yellow-900/40 text-yellow-400' :
              'bg-dark-800 border-dark-700 text-dark-400'
            )}>
              {item.priority === 2 ? '🔥 核心跟踪' : item.priority === 1 ? '⭐ 重点跟踪' : '普通跟踪'}
            </span>
          </div>
          <p className="text-dark-400 mt-2 max-w-3xl">
            这是当前 V1 的单标的作战页：用户自己选标的，8 个角色各自独立输出分析，CEO 负责摘要而不是覆盖其他角色。
          </p>
        </div>
        <div className="text-right text-sm text-dark-500">
          <p>免费实时图表</p>
          <p className="text-dark-400">TradingView Embedded Widget</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-dark-100">实时行情 / K线</h2>
                <p className="text-dark-500 text-sm">可直接用于实战盯盘，不需要付费 API key</p>
              </div>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(item.symbol.endsWith('USDT') ? `BINANCE:${item.symbol}` : `NASDAQ:${item.symbol}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-army-400 hover:text-army-300"
              >
                在 TradingView 打开 ↗
              </a>
            </div>
            <div className="h-[560px]">
              <TradingViewChart symbol={item.symbol} interval="60" />
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
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
        </div>
      </div>

      <div className="space-y-3">
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
      </div>
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
