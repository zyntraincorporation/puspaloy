// src/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
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
        uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'super_admin',
        avatar: null,
        active: true,
        createdBy: 'system',
        permissions: {
          viewOrders: true,
          updateOrderStatus: true,
          addProducts: true,
          editProducts: true,
          deleteProducts: true,
          manageReviews: true,
          manageInventory: true,
          viewAnalytics: true,
          manageCoupons: true,
          manageFlashSales: true,
          manageCategories: true,
          manageHomepageContent: true,
          manageBanners: true,
          manageSettings: true,
          manageAI: true,
          managePayments: true,
          manageModerators: true,
        },
        createdAt: Timestamp.now(),
        isSynthesized: true,
      }
    }

    return null
  } catch (err) {
    console.error('getAdminUser error:', err)
    if (isSuper) {
      return {
        uid,
        email: auth.currentUser?.email || '',
        name: 'Super Admin',
        role: 'super_admin',
        avatar: null,
        active: true,
        createdBy: 'system',
        permissions: {
          viewOrders: true,
          updateOrderStatus: true,
          addProducts: true,
          editProducts: true,
          deleteProducts: true,
          manageReviews: true,
          manageInventory: true,
          viewAnalytics: true,
          manageCoupons: true,
          manageFlashSales: true,
          manageCategories: true,
          manageHomepageContent: true,
          manageBanners: true,
          manageSettings: true,
          manageAI: true,
          managePayments: true,
          manageModerators: true,
        },
        createdAt: Timestamp.now(),
        isSynthesized: true,
      }
    }
    return null
  }
}

export function isSuperAdmin(uid: string): boolean {
  return uid === import.meta.env.VITE_SUPER_ADMIN_UID
}
