'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Company, Role, RoleType } from './types'

interface CompanyContextValue {
  companyId: string | null
  setCompanyId: (id: string) => void
  company: Company | null
  roles: Role[]
  loading: boolean
  refresh: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextValue>({
  companyId: null,
  setCompanyId: () => {},
  company: null,
  roles: [],
  loading: true,
  refresh: async () => {},
})

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // Load company ID from localStorage (default to demo)
  useEffect(() => {
    const stored = localStorage.getItem('quantarmy_company_id')
    setCompanyId(stored || 'demo-001')
    setLoading(false)
  }, [])

  // Persist company ID
  useEffect(() => {
    if (companyId) {
      localStorage.setItem('quantarmy_company_id', companyId)
    }
  }, [companyId])

  const refresh = async () => {
    if (!companyId) return
    try {
      const [compRes, rolesRes] = await Promise.all([
        fetch(`/api/company/${companyId}`).then(r => r.json()),
        fetch(`/api/company/${companyId}/roles`).then(r => r.json()),
      ])
      if (compRes.ok) setCompany(compRes.data)
      if (rolesRes.ok) setRoles(rolesRes.data)
    } catch (e) {
      console.error('Failed to refresh company:', e)
    }
  }

  useEffect(() => {
    if (companyId) refresh()
  }, [companyId])

  return (
    <CompanyContext.Provider value={{ companyId, setCompanyId, company, roles, loading, refresh }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompanyContext() {
  return useContext(CompanyContext)
}
