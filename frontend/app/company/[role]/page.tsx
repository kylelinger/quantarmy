'use client'

import { use } from 'react'
import { RolePanel } from '@/components/RolePanel'
import { SkillMarket } from '@/components/SkillMarket'
import { ROLES, type RoleType } from '@/lib/types'

export default function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params)
  const roleType = role as RoleType
  const roleMeta = ROLES.find((r) => r.type === roleType)

  if (!roleMeta) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-dark-500">未知角色: {role}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Role Detail Panel */}
      <RolePanel
        roleType={roleType}
        activeSkill={null}
        onChangeSkill={() => {
          // TODO: open skill market modal or scroll to market
        }}
      />

      {/* Skill Market */}
      <SkillMarket
        roleType={roleType}
        onSelect={(skill) => {
          // TODO: equip skill via API
          console.log('Selected skill:', skill)
        }}
        onImport={(url) => {
          // TODO: import skill via API
          console.log('Import URL:', url)
        }}
      />
    </div>
  )
}
