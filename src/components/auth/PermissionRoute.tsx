// src/components/auth/PermissionRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { AdminUser } from '@/types'
import type { ReactNode } from 'react'

interface PermissionRouteProps {
  children: ReactNode
  permission: keyof AdminUser['permissions']
}

export default function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
