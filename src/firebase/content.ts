// src/firebase/content.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { HomepageContent, BrandStory, GeneralSettings } from '@/types'

// ── Homepage ──────────────────────────────────────────────
export async function getHomepageContent(): Promise<HomepageContent | null> {
  const snap = await getDoc(doc(db, 'content', 'homepage'))
  if (!snap.exists()) return null
  return snap.data() as HomepageContent
}

export async function updateHomepageContent(data: Partial<HomepageContent>): Promise<void> {
  await setDoc(
    doc(db, 'content', 'homepage'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── Brand Story ───────────────────────────────────────────
export async function getBrandStory(): Promise<BrandStory | null> {
  const snap = await getDoc(doc(db, 'content', 'brandstory'))
  if (!snap.exists()) return null
  return snap.data() as BrandStory
}

export async function updateBrandStory(data: Partial<BrandStory>): Promise<void> {
  await setDoc(
    doc(db, 'content', 'brandstory'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── General Settings ──────────────────────────────────────
export async function getGeneralSettings(): Promise<GeneralSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'general'))
  if (!snap.exists()) return null
  return snap.data() as GeneralSettings
}

export async function updateGeneralSettings(data: Partial<GeneralSettings>): Promise<void> {
  await setDoc(
    doc(db, 'settings', 'general'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── Payment Settings ──────────────────────────────────────
export async function getPaymentSettings() {
  const snap = await getDoc(doc(db, 'settings', 'payments'))
  if (!snap.exists()) return null
  return snap.data()
}

export async function updatePaymentSettings(data: object): Promise<void> {
  await setDoc(
    doc(db, 'settings', 'payments'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

// ── AI Settings ───────────────────────────────────────────
export async function getAISettings() {
  const snap = await getDoc(doc(db, 'settings', 'ai'))
  if (!snap.exists()) return null
  return snap.data()
}

export async function updateAISettings(data: object): Promise<void> {
  await setDoc(
    doc(db, 'settings', 'ai'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
