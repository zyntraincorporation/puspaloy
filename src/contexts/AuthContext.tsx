// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, getAdminUser } from '@/firebase/auth'
import type { AdminUser } from '@/types'

interface AuthContextValue {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  isSuperAdmin: boolean
  hasPermission: (perm: keyof AdminUser['permissions']) => boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  adminUser: null,
  loading: true,
  isSuperAdmin: false,
  hasPermission: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const admin = await getAdminUser(firebaseUser.uid)
        setAdminUser(admin)
      } else {
        setAdminUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const isSuperAdmin = adminUser?.role === 'super_admin'

  const hasPermission = (perm: keyof AdminUser['permissions']): boolean => {
    if (!adminUser) return false
    if (adminUser.role === 'super_admin') return true
    return adminUser.permissions[perm] === true
  }

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, isSuperAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
