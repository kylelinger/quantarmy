'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { AgentOutput, RoleType } from '@/lib/v2/types'

interface AgentQAProps {
  agent: AgentOutput
}

interface Question {
  text: string
  answerTemplate: (agent: AgentOutput) => string
}

const QUESTIONS_BY_ROLE: Record<RoleType, Question[]> = {
  collector: [
    {
      text: '数据质量如何？',
      answerTemplate: (agent) => {
        const dataSkills = agent.skillResults.filter(s => 
          s.skillId.includes('quote') || s.skillId.includes('depth') || s.skillId.includes('kline')
        )
        const quality = agent.confidence > 0.7 ? '优秀' : agent.confidence > 0.4 ? '良好' : '一般'
        return `数据质量${quality}（信心${(agent.confidence * 100).toFixed(0)}%）。${dataSkills[0]?.summary || agent.reasoning[0] || '数据采集完成。'}`
      }
    },
    {
      text: '成交量异常吗？',
      answerTemplate: (agent) => {
        const volumeData = agent.skillResults.find(s => s.summary.includes('成交量') || s.summary.includes('交易量'))
        return volumeData?.summary || `根据分析，成交量处于${agent.stance === 'bullish' ? '活跃' : agent.stance === 'bearish' ? '低迷' : '正常'}状态。${agent.reasoning[0] || ''}`
      }
    },
    {
      text: '市场深度怎样？',
      answerTemplate: (agent) => {
        const depthData = agent.skillResults.find(s => s.summary.includes('深度') || s.summary.includes('流动性'))
        return depthData?.summary || `市场流动性${agent.confidence > 0.6 ? '充足' : '一般'}，${agent.summary}`
      }
    }
  ],
  strategist: [
    {
      text: '趋势持续性如何？',
      answerTemplate: (agent) => {
        const trendInfo = agent.skillResults.find(s => 
          s.summary.includes('趋势') || s.summary.includes('方向')
        )
        return `当前趋势方向为${agent.direction}，信心${(agent.confidence * 100).toFixed(0)}%。${trendInfo?.summary || agent.reasoning[0] || '趋势分析完成。'}`
      }
    },
    {
      text: '入场时机好吗？',
      answerTemplate: (agent) => {
        const timing = agent.confidence > 0.7 ? '优秀' : agent.confidence > 0.5 ? '良好' : agent.confidence > 0.3 ? '一般' : '不佳'
        return `入场时机${timing}。${agent.reasoning[1] || agent.reasoning[0] || agent.summary}`
      }
    },
    {
      text: '有什么风险？',
      answerTemplate: (agent) => {
        const riskSkill = agent.skillResults.find(s => s.summary.includes('风险') || s.summary.includes('回撤'))
        return riskSkill?.summary || `主要风险：${agent.stance === 'bullish' ? '上方压力位突破失败' : agent.stance === 'bearish' ? '下方支撑位反弹' : '方向不明确'}。${agent.reasoning[agent.reasoning.length - 1] || ''}`
      }
    }
  ],
  risk_officer: [
    {
      text: '最大风险是什么？',
      answerTemplate: (agent) => {
        const riskScore = agent.riskScore || 5
        return `风险等级 ${riskScore}/10。${agent.reasoning[0] || agent.summary}`
      }
    },
    {
      text: '止损建议？',
      answerTemplate: (agent) => {
        const slSkill = agent.skillResults.find(s => s.summary.includes('止损') || s.summary.includes('SL'))
        return slSkill?.summary || `建议严格执行止损，${agent.direction === 'LONG' ? '下破关键支撑立即离场' : agent.direction === 'SHORT' ? '上破关键阻力立即离场' : '等待明确信号'}。`
      }
    },
    {
      text: '仓位建议？',
      answerTemplate: (agent) => {
        const positionPct = agent.confidence > 0.7 ? '50-70%' : agent.confidence > 0.5 ? '30-50%' : agent.confidence > 0.3 ? '10-30%' : '5-10%'
        return `根据信心度${(agent.confidence * 100).toFixed(0)}%，建议仓位${positionPct}。${agent.reasoning[1] || ''}`
      }
    }
  ],
  analyst: [
    {
      text: '技术面怎么看？',
      answerTemplate: (agent) => {
        return `技术面${agent.stance === 'bullish' ? '偏多' : agent.stance === 'bearish' ? '偏空' : '中性'}。${agent.reasoning[0] || agent.summary}`
      }
    },
    {
      text: '支撑阻力在哪？',
      answerTemplate: (agent) => {
        const srSkill = agent.skillResults.find(s => 
          s.summary.includes('支撑') || s.summary.includes('阻力') || s.summary.includes('关键位')
        )
        return srSkill?.summary || `关键位置需结合K线分析，${agent.reasoning[1] || agent.summary}`
      }
    },
    {
      text: '指标矛盾吗？',
      answerTemplate: (agent) => {
        const indicatorSkills = agent.skillResults.filter(s => 
          s.summary.includes('RSI') || s.summary.includes('MACD') || s.summary.includes('均线')
        )
        const contradictory = agent.confidence < 0.5
        return contradictory 
          ? `指标存在分歧，${indicatorSkills.map(s => s.summary).join('；')}`
          : `指标较一致，${indicatorSkills[0]?.summary || agent.summary}`
      }
    }
  ],
  researcher: [
    {
      text: '宏观环境如何？',
      answerTemplate: (agent) => {
        const macroSkill = agent.skillResults.find(s => s.summary.includes('宏观') || s.summary.includes('市场'))
        return macroSkill?.summary || `宏观环境${agent.stance === 'bullish' ? '支持' : agent.stance === 'bearish' ? '不利' : '中性'}，${agent.reasoning[0] || agent.summary}`
      }
    },
    {
      text: '板块轮动怎样？',
      answerTemplate: (agent) => {
        return `当前市场${agent.stance === 'bullish' ? '风险偏好上升' : agent.stance === 'bearish' ? '避险情绪升温' : '观望情绪浓厚'}。${agent.reasoning[1] || agent.summary}`
      }
    },
    {
      text: '相关性分析？',
      answerTemplate: (agent) => {
        const corrSkill = agent.skillResults.find(s => s.summary.includes('相关') || s.summary.includes('联动'))
        return corrSkill?.summary || `与大盘相关性分析：${agent.reasoning[0] || agent.summary}`
      }
    }
  ],
  executor: [
    {
      text: '流动性够吗？',
      answerTemplate: (agent) => {
        const liquiditySkill = agent.skillResults.find(s => 
          s.summary.includes('流动性') || s.summary.includes('深度') || s.summary.includes('成交量')
        )
        return liquiditySkill?.summary || `流动性${agent.confidence > 0.6 ? '充足' : '一般'}，${agent.summary}`
      }
    },
    {
      text: '滑点预估？',
      answerTemplate: (agent) => {
        const slippage = agent.confidence > 0.7 ? '0.1-0.2%' : agent.confidence > 0.4 ? '0.2-0.5%' : '0.5-1%'
        return `预估滑点${slippage}。${agent.reasoning[0] || '建议分批建仓降低冲击成本。'}`
      }
    },
    {
      text: '最佳下单策略？',
      answerTemplate: (agent) => {
        const strategy = agent.confidence > 0.7 ? '市价单快速建仓' : agent.confidence > 0.5 ? '限价单分批进场' : 'TWAP算法单降低冲击'
        return `推荐${strategy}。${agent.reasoning[1] || agent.summary}`
      }
    }
  ],
  cto: [
    {
      text: '数据可靠吗？',
      answerTemplate: (agent) => {
        const reliability = agent.confidence > 0.8 ? '非常可靠' : agent.confidence > 0.5 ? '可靠' : '需要验证'
        return `数据源${reliability}（置信度${(agent.confidence * 100).toFixed(0)}%）。${agent.reasoning[0] || agent.summary}`
      }
    },
    {
      text: '系统负载如何？',
      answerTemplate: (agent) => {
        return `系统运行${agent.confidence > 0.7 ? '稳定' : '正常'}，所有组件健康。${agent.reasoning[1] || ''}`
      }
    },
    {
      text: '需要注意什么？',
      answerTemplate: (agent) => {
        return `技术层面：${agent.reasoning[agent.reasoning.length - 1] || agent.summary}`
      }
    }
  ],
  ceo: [] // CEO doesn't have Q&A
}

export function AgentQA({ agent }: AgentQAProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)
  const questions = QUESTIONS_BY_ROLE[agent.role] || []

  if (questions.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-dark-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-dark-500 text-xs">💬</span>
        <span className="text-dark-400 text-xs">快速提问</span>
      </div>

      {/* Questions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setSelectedQuestion(selectedQuestion === i ? null : i)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs transition-all',
              selectedQuestion === i
                ? 'bg-army-900/50 text-army-400 border border-army-700'
                : 'bg-dark-850 text-dark-400 border border-dark-700 hover:border-dark-600'
            )}
          >
            {q.text}
          </button>
        ))}
      </div>

      {/* Answer */}
      {selectedQuestion !== null && (
        <div className="bg-dark-850 rounded-lg p-4 border border-dark-800 animate-in slide-in-from-top-2 duration-200">
          <p className="text-dark-300 text-sm leading-relaxed">
            {questions[selectedQuestion].answerTemplate(agent)}
          </p>
        </div>
      )}
    </div>
  )
}
