// src/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { AdminUser } from '@/types'

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  const isSuper = uid === import.meta.env.VITE_SUPER_ADMIN_UID
  try {
    const docRef = doc(db, 'admins', uid)
    const snap = await getDoc(docRef)
    
    if (snap.exists()) {
      const data = snap.data() as AdminUser
      // Upgrade them dynamically if env specifies super admin
      if (isSuper) {
        return { ...data, role: 'super_admin', active: true }
      }
      return data
    }

    // Crucial Fix: If the document doesn't exist but the user is the Super Admin in the env,
    // we must synthesize the admin object so they can access the dashboard.
    if (isSuper) {
      return {
        id: uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'super_admin',
        active: true,
        permissions: {
          products: true,
          orders: true,
          users: true,
          content: true,
          settings: true,
        },
        createdAt: new Date().toISOString(),
      }
    }

    return null
  } catch (err) {
    console.error('getAdminUser error:', err)
    // Even if Firestore fails, grant access if it is the super admin
    if (isSuper) {
      return {
        id: uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'super_admin',
        active: true,
        permissions: { products: true, orders: true, users: true, content: true, settings: true },
        createdAt: new Date().toISOString(),
      }
    }
    return null
  }
}

export function isSuperAdmin(uid: string): boolean {
  return uid === import.meta.env.VITE_SUPER_ADMIN_UID
}
