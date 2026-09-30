import React from "react"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardClientWrapper } from '@/components/dashboard/dashboard-client-wrapper'
import { AuthenticatedAppHeader } from '@/components/layout/authenticated-app-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')
  const userName = cookieStore.get('user-name')?.value || 'Test User'

  // TEMP: bypass auth for Google Sheets debugging
  // if (!authToken) {
  //   redirect('/login')
  // }

  return (
    <DashboardClientWrapper userName={userName}>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <AuthenticatedAppHeader userName={userName} />
        <div className="flex flex-1 min-h-0 overflow-hidden p-[5px] gap-[5px]">
          <AppSidebar />
          {children}
        </div>
      </div>
    </DashboardClientWrapper>
  )
}
