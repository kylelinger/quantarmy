'use client'

import { cn } from '@/lib/utils'
import type { AnalysisPhase } from '@/lib/v2/types'

interface PipelineStep {
  id: AnalysisPhase
  label: string
  icon: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'collecting', label: '数据采集', icon: '📡' },
  { id: 'analyzing', label: '角色分析', icon: '🧠' },
  { id: 'debating', label: '辩论挑战', icon: '⚔️' },
  { id: 'deciding', label: 'CEO决策', icon: '👔' },
  { id: 'storing', label: '存储记忆', icon: '💾' },
]

interface PipelineProgressProps {
  currentPhase: AnalysisPhase
  completedAgents?: number
  totalAgents?: number
}

export function PipelineProgress({ 
  currentPhase, 
  completedAgents = 0, 
  totalAgents = 7 
}: PipelineProgressProps) {
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.id === currentPhase)

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
      {/* Pipeline Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {PIPELINE_STEPS.map((step, index) => {
            const isComplete = index < currentIndex || currentPhase === 'complete'
            const isActive = index === currentIndex && currentPhase !== 'complete'
            const isPending = index > currentIndex && currentPhase !== 'complete'

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-300',
                      isComplete && 'bg-army-900/50 border-2 border-army-500',
                      isActive && 'bg-army-900/30 border-2 border-army-500 animate-pulse',
                      isPending && 'bg-dark-850 border-2 border-dark-700'
                    )}
                  >
                    {isComplete ? (
                      <span className="text-army-400">✓</span>
                    ) : (
                      <span className={cn(
                        isActive ? 'text-army-400' : 'text-dark-600'
                      )}>
                        {step.icon}
                      </span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <p className={cn(
                    'mt-2 text-xs font-medium whitespace-nowrap',
                    isComplete && 'text-army-400',
                    isActive && 'text-army-300',
                    isPending && 'text-dark-600'
                  )}>
                    {step.label}
                  </p>
                </div>

                {/* Connector Line */}
                {index < PIPELINE_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative -mt-8">
                    <div className="absolute inset-0 bg-dark-700" />
                    <div 
                      className={cn(
                        'absolute inset-0 bg-army-500 transition-all duration-500',
                        index < currentIndex ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent Progress (during analyzing phase) */}
      {currentPhase === 'analyzing' && totalAgents > 0 && (
        <div className="mt-6 pt-4 border-t border-dark-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-dark-400 text-sm">
              角色分析进度
            </p>
            <p className="text-dark-300 text-sm font-medium">
              {completedAgents} / {totalAgents}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-army-500 transition-all duration-300 rounded-full"
              style={{ width: `${(completedAgents / totalAgents) * 100}%` }}
            />
          </div>

          {/* Agent Icons */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: totalAgents }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  i < completedAgents ? 'bg-army-500' : 'bg-dark-700'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Status Message */}
      <div className="mt-4 flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          currentPhase === 'complete' ? 'bg-army-500' : 'bg-army-500 animate-pulse'
        )} />
        <p className="text-dark-300 text-sm">
          {currentPhase === 'collecting' && '正在采集市场数据...'}
          {currentPhase === 'analyzing' && '8角色独立分析中...'}
          {currentPhase === 'debating' && '角色辩论挑战中...'}
          {currentPhase === 'deciding' && 'CEO综合决策中...'}
          {currentPhase === 'storing' && '存储分析记忆...'}
          {currentPhase === 'complete' && '✅ 分析完成'}
        </p>
      </div>
    </div>
  )
}
