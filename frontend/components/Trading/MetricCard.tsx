import { cn } from '@/lib/utils'

export function MetricCard({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-xl font-bold text-dark-100', className)}>{value}</p>
      {sub && <p className={cn('text-xs mt-0.5', className || 'text-dark-400')}>{sub}</p>}
    </div>
  )
}
