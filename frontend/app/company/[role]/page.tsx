'use client'

import { use, useState, useCallback, useEffect } from 'react'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useSkills, setRoleSkill, runBacktest, importSkill } from '@/lib/hooks'
import { ROLES, type RoleType, type Skill, type BacktestResult } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'

export default function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params)
  const roleType = role as RoleType
  const roleMeta = ROLES.find((r) => r.type === roleType)
  const { companyId, roles, refresh } = useCompanyContext()
  const { skills, loading: skillsLoading } = useSkills({ role_type: roleType })

  const currentRole = roles.find((r) => r.role_type === roleType)
  const activeSkill = skills.find((s) => s.id === currentRole?.active_skill_id)
  const builtinSkills = skills.filter((s) => s.source === 'builtin')

  const [backtesting, setBacktesting] = useState(false)
  const [btResult, setBtResult] = useState<(BacktestResult & { error?: string }) | null>(null)
  const [tab, setTab] = useState<'browse' | 'import'>('browse')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)

  if (!roleMeta) {
    return <div className="flex items-center justify-center h-full"><p className="text-dark-500">未知角色: {role}</p></div>
  }

  const handleEquip = async (skill: Skill) => {
    if (!companyId) return
    try {
      await setRoleSkill(companyId, roleType, skill.id)
      await refresh()
    } catch (e) {
      console.error('Failed to equip skill:', e)
    }
  }

  const handleBacktest = async (skillId: string) => {
    setBacktesting(true)
    setBtResult(null)
    try {
      const result = await runBacktest(skillId, 'BTCUSDT', '3m')
      setBtResult(result)
    } catch (e: any) {
      setBtResult({ error: e.message } as any)
    } finally {
      setBacktesting(false)
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      await importSkill(importUrl, roleType)
      setImportUrl('')
    } catch (e) {
      console.error('Import error:', e)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Role Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
             style={{ backgroundColor: `${roleMeta.color}20` }}>
          {roleMeta.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-dark-100">{roleMeta.label}</h2>
          <p className="text-dark-400">{roleMeta.description}</p>
        </div>
      </div>

      {/* Role framing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-200 mb-2">角色定位</h3>
          <p className="text-dark-400 text-sm leading-6">
            在 QuantArmy V1 中，{roleMeta.label} 是一个独立 Agent：先给出自己的视角，不强行和其他角色统一结论。
            这能让用户看到团队内部真实的分歧与互补，而不是只有一个被抹平的答案。
          </p>
        </div>
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <h3 className="text-lg font-semibold text-dark-200 mb-2">默认卡组</h3>
          <p className="text-3xl font-bold text-army-400">{builtinSkills.length}</p>
          <p className="text-dark-500 text-sm mt-1">预置技能卡，可直接上手；熟悉后再从 GitHub 扩展。</p>
        </div>
      </div>

      {/* Current Skill */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">当前装备</h3>
        {activeSkill ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-army-900/30 text-army-400 text-xs rounded-full border border-army-800">{activeSkill.source}</span>
              <span className="text-dark-100 font-medium">{activeSkill.name}</span>
              <span className="text-dark-500 text-sm">v{activeSkill.version}</span>
            </div>
            <p className="text-dark-400 text-sm">{activeSkill.description}</p>

            {/* Current viewpoint */}
            {currentRole?.last_output && (
              <div className="bg-dark-850 rounded-lg p-4 border border-dark-800">
                <p className="text-xs uppercase tracking-wider text-dark-500 mb-2">当前观点</p>
                <p className="text-sm text-dark-300 leading-6">{currentRole.last_output}</p>
              </div>
            )}

            {/* Backtest section */}
            {roleType === 'strategist' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBacktest(activeSkill.id)}
                  disabled={backtesting}
                  className="px-4 py-2 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {backtesting ? '🔄 回测中...' : '📊 运行回测'}
                </button>
              </div>
            )}

            {/* Backtest Results */}
            {btResult && !btResult.error && (
              <div className="grid grid-cols-5 gap-3 mt-3">
                <Stat label="交易数" value={String(btResult.trades)} />
                <Stat label="胜率" value={`${((btResult.win_rate ?? 0) * 100).toFixed(1)}%`} />
                <Stat label="盈亏比" value={(btResult.profit_factor ?? 0).toFixed(2)} />
                <Stat label="最大回撤" value={`${((btResult.max_drawdown ?? 0) * 100).toFixed(1)}%`} negative />
                <Stat label="总回报" value={`${((btResult.total_return ?? 0) * 100).toFixed(1)}%`} positive={(btResult.total_return ?? 0) > 0} />
              </div>
            )}
            {btResult?.error && (
              <p className="text-red-400 text-sm">回测错误: {btResult.error}</p>
            )}

            {/* Parameters */}
            {activeSkill.parameters && activeSkill.parameters.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-dark-300">参数</h4>
                {activeSkill.parameters.map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-dark-200">{p.name}</p>
                      <p className="text-xs text-dark-500">{p.description}</p>
                    </div>
                    <span className="text-sm text-dark-400 bg-dark-800 px-3 py-1 rounded">{String(p.default)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-500">
            <p className="text-4xl mb-3">🎯</p>
            <p>尚未装备技能</p>
          </div>
        )}
      </div>

      {/* Skill Market */}
      <div className="bg-dark-900 rounded-xl border border-dark-800">
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <h3 className="text-lg font-semibold text-dark-200">技能市场</h3>
          <div className="flex gap-1 bg-dark-850 rounded-lg p-1">
            <button
              onClick={() => setTab('browse')}
              className={cn('px-4 py-1.5 text-sm rounded-md transition-colors',
                tab === 'browse' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200')}
            >浏览</button>
            <button
              onClick={() => setTab('import')}
              className={cn('px-4 py-1.5 text-sm rounded-md transition-colors',
                tab === 'import' ? 'bg-dark-700 text-dark-100' : 'text-dark-400 hover:text-dark-200')}
            >GitHub导入</button>
          </div>
        </div>

        {tab === 'browse' ? (
          <div className="p-6">
            {skillsLoading ? (
              <p className="text-dark-500 text-center py-8">加载中...</p>
            ) : skills.length > 0 ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-dark-300">默认卡组</h4>
                    <span className="text-xs text-dark-500">每个角色预置 3 张起步卡</span>
                  </div>
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-4 bg-dark-850 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-dark-100 font-medium">{skill.name}</span>
                            <span className="text-dark-500 text-xs">v{skill.version}</span>
                            <span className="text-xs px-2 py-0.5 bg-dark-800 text-dark-400 rounded">{skill.source}</span>
                            {activeSkill?.id === skill.id && (
                              <span className="text-xs px-2 py-0.5 bg-army-900/30 text-army-400 rounded border border-army-800">active</span>
                            )}
                          </div>
                          <p className="text-dark-400 text-xs mt-1">{skill.description}</p>
                        </div>
                        <button
                          onClick={() => handleEquip(skill)}
                          disabled={activeSkill?.id === skill.id}
                          className={cn(
                            'px-4 py-2 text-sm rounded-lg transition-colors',
                            activeSkill?.id === skill.id
                              ? 'bg-army-900/30 text-army-400 cursor-default'
                              : 'bg-army-600 hover:bg-army-500 text-white'
                          )}
                        >
                          {activeSkill?.id === skill.id ? '✅ 已装备' : '装备'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-dark-500 text-center py-8">暂无可用技能</p>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">GitHub仓库URL</label>
              <input
                type="url" placeholder="https://github.com/user/repo" value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>
            <div className="bg-dark-850 rounded-lg p-4 text-sm text-dark-400">
              <p className="font-medium text-dark-300 mb-2">AI自动适配流程：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>克隆并分析仓库代码</li>
                <li>AI识别功能类型和接口</li>
                <li>自动生成适配层代码</li>
                <li>沙箱试运行 + 基础回测</li>
              </ol>
            </div>
            <button
              onClick={handleImport} disabled={!importUrl.trim() || importing}
              className={cn('w-full py-3 rounded-lg text-sm font-medium transition-colors',
                importing ? 'bg-dark-700 text-dark-500' : 'bg-army-600 hover:bg-army-500 text-white')}
            >
              {importing ? '🔄 AI正在分析中...' : '🚀 开始导入并适配'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
  return (
    <div className="bg-dark-850 rounded-lg p-3 text-center">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-lg font-semibold', negative ? 'text-red-400' : positive ? 'text-army-400' : 'text-dark-100')}>{value}</p>
    </div>
  )
}
