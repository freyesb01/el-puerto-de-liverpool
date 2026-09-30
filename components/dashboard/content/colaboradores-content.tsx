'use client'

import { SalesLeadsTable } from '@/components/dashboard/content/sales-leads-table'


export function ColaboradoresContent() {
  return (
    <div className="flex flex-col gap-[5px] pb-[5px]">
      <div className="grid grid-cols-1 gap-[5px] lg:grid-cols-2">
        <SalesLeadsTable data={[]} />
      </div>
    </div>
  )
}
