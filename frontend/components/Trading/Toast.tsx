'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastContextValue {
  toast: (type: ToastItem['type'], message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let _nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((type: ToastItem['type'], message: string) => {
    const id = ++_nextId
    setItems(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[60] space-y-2 pointer-events-none">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm flex items-center gap-2 animate-in slide-in-from-right',
              item.type === 'success' && 'bg-army-900/90 text-army-200 border border-army-800',
              item.type === 'error' && 'bg-red-900/90 text-red-200 border border-red-800',
              item.type === 'info' && 'bg-dark-800/90 text-dark-200 border border-dark-700',
            )}
          >
            <span>{item.type === 'success' ? '✅' : item.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{item.message}</span>
            <button
              onClick={() => setItems(prev => prev.filter(t => t.id !== item.id))}
              className="ml-2 opacity-60 hover:opacity-100 text-xs"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
