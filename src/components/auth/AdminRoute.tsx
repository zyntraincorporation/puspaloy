// src/components/auth/AdminRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PageLoader from '@/components/shared/PageLoader'
import type { ReactNode } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, adminUser, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user || !adminUser || !adminUser.active) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
