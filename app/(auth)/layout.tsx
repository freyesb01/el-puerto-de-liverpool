import React from "react"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')

  if (authToken) {
    redirect('/modulos')
  }

  return <>{children}</>
}
