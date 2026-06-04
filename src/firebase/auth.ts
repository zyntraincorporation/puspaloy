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
  try {
    const docRef = doc(db, 'admins', uid)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return snap.data() as AdminUser
  } catch {
    return null
  }
}

export function isSuperAdmin(uid: string): boolean {
  return uid === import.meta.env.VITE_SUPER_ADMIN_UID
}
