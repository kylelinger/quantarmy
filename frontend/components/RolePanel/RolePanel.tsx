'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { ROLES, type RoleType, type Skill, type SkillParameter } from '@/lib/types'

interface RolePanelProps {
  roleType: RoleType
  activeSkill: Skill | null
  onChangeSkill?: () => void
  onConfigChange?: (config: Record<string, any>) => void
}

export function RolePanel({ roleType, activeSkill, onChangeSkill, onConfigChange }: RolePanelProps) {
  const role = ROLES.find((r) => r.type === roleType)
  if (!role) return null

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${role.color}20` }}
        >
          {role.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-dark-100">{role.label}</h2>
          <p className="text-dark-400">{role.description}</p>
        </div>
      </div>

      {/* Current Skill */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-200">当前装备</h3>
          <button
            onClick={onChangeSkill}
            className="px-4 py-2 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors"
          >
            更换技能
          </button>
        </div>

        {activeSkill ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-army-900/30 text-army-400 text-xs rounded-full border border-army-800">
                {activeSkill.source}
              </div>
              <span className="text-dark-100 font-medium">{activeSkill.name}</span>
              <span className="text-dark-500 text-sm">v{activeSkill.version}</span>
            </div>
            <p className="text-dark-400 text-sm">{activeSkill.description}</p>

            {/* Backtest Result */}
            {activeSkill.backtest_result && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                <StatCard label="胜率" value={`${(activeSkill.backtest_result.win_rate * 100).toFixed(1)}%`} />
                <StatCard label="盈亏比" value={activeSkill.backtest_result.profit_factor.toFixed(2)} />
                <StatCard label="最大回撤" value={`${(activeSkill.backtest_result.max_drawdown * 100).toFixed(1)}%`} negative />
                <StatCard label="交易次数" value={String(activeSkill.backtest_result.trades)} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-500">
            <p className="text-4xl mb-3">🎯</p>
            <p>尚未装备技能</p>
            <button
              onClick={onChangeSkill}
              className="mt-4 px-6 py-2 bg-army-600 hover:bg-army-500 text-white rounded-lg transition-colors text-sm"
            >
              浏览技能市场
            </button>
          </div>
        )}
      </div>

      {/* Parameters */}
      {activeSkill && activeSkill.parameters.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">参数调整</h3>
          <div className="space-y-4">
            {activeSkill.parameters.map((param) => (
              <ParameterControl key={param.name} param={param} />
            ))}
          </div>
        </div>
      )}

      {/* Skill Output / Logs */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">运行日志</h3>
        <div className="font-mono text-xs text-dark-400 space-y-1 max-h-60 overflow-y-auto">
          <p className="text-dark-500">等待技能运行...</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="bg-dark-850 rounded-lg p-3 text-center">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-lg font-semibold', negative ? 'text-red-400' : 'text-dark-100')}>{value}</p>
    </div>
  )
}

function ParameterControl({ param }: { param: SkillParameter }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-dark-200">{param.name}</p>
        <p className="text-xs text-dark-500">{param.description}</p>
      </div>
      <div className="w-32">
        {param.type === 'bool' ? (
          <input type="checkbox" defaultChecked={param.default as boolean} className="accent-army-500" />
        ) : param.type === 'select' ? (
          <select
            defaultValue={param.default as string}
            className="w-full bg-dark-800 text-dark-200 text-sm rounded px-2 py-1 border border-dark-700"
          >
            {param.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            defaultValue={param.default as number}
            min={param.min_value}
            max={param.max_value}
            step={param.type === 'float' ? 0.01 : 1}
            className="w-full bg-dark-800 text-dark-200 text-sm rounded px-2 py-1 border border-dark-700"
          />
        )}
      </div>
    </div>
  )
}
