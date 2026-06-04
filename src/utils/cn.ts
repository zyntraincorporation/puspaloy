// src/utils/cn.ts
// Utility for merging Tailwind classes (shadcn/ui pattern)
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
