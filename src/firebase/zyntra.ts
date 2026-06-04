// src/firebase/zyntra.ts
// Zyntra AI context builder — fetches live product & settings data from Firestore
// and builds the system prompt that powers the AI's accurate answers.

import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { ProductLite } from '@/types'
import { getEffectivePrice } from '@/utils/formatters'
import { getDeliverySettings } from './settings'

// ── Lightweight product fetch for AI context ─────────────
export async function fetchProductCatalogForAI(): Promise<ProductLite[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      orderBy('salesCount', 'desc'),
      limit(80) // top 80 products by sales — keeps context lean
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        slug: data.slug,
        category: data.category,
        subcategory: data.subcategory ?? '',
        tags: data.tags ?? [],
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        flashSalePrice: data.flashSalePrice ?? null,
        featuredImage: data.featuredImage ?? '',
        avgRating: data.avgRating ?? 0,
        reviewCount: data.reviewCount ?? 0,
        salesCount: data.salesCount ?? 0,
        bestSeller: data.bestSeller ?? false,
        trending: data.trending ?? false,
        featured: data.featured ?? false,
        status: data.status,
        stock: data.stock ?? 0,
      } as ProductLite
    })
  } catch (err) {
    console.warn('[Zyntra] Failed to fetch product catalog:', err)
    return []
  }
}

// ── General store settings for AI context ───────────────
interface StoreInfo {
  phone: string
  whatsappNumber: string
  address: string
  insideDhaka: number
  outsideDhaka: number
  freeShippingThreshold: number
}

export async function fetchStoreInfoForAI(): Promise<StoreInfo> {
  const defaults: StoreInfo = {
    phone: '+880-1700-000000',
    whatsappNumber: '8801700000000',
    address: 'Dhaka, Bangladesh',
    insideDhaka: 60,
    outsideDhaka: 120,
    freeShippingThreshold: 2000,
  }
  try {
    const [generalSnap, delivery] = await Promise.all([
      getDoc(doc(db, 'settings', 'general')),
      getDeliverySettings(),
    ])
    const general = generalSnap.exists() ? generalSnap.data() : {}
    return {
      phone: general.phone ?? defaults.phone,
      whatsappNumber: general.whatsappNumber ?? defaults.whatsappNumber,
      address: general.address ?? defaults.address,
      insideDhaka: delivery.insideDhaka,
      outsideDhaka: delivery.outsideDhaka,
      freeShippingThreshold: delivery.freeShippingThreshold,
    }
  } catch {
    return defaults
  }
}

// ── Fetch AI model settings from Firestore ───────────────
export async function fetchAISettings(): Promise<{ model: string; enabled: boolean; systemPromptAddition: string }> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'ai'))
    if (!snap.exists()) return { model: 'google/gemini-2.0-flash-001', enabled: true, systemPromptAddition: '' }
    const d = snap.data()
    return {
      model: d.model ?? 'google/gemini-2.0-flash-001',
      enabled: d.enabled ?? true,
      systemPromptAddition: d.systemPromptAddition ?? '',
    }
  } catch {
    return { model: 'google/gemini-2.0-flash-001', enabled: true, systemPromptAddition: '' }
  }
}

// ── Build the AI system prompt ────────────────────────────
export function buildSystemPrompt(
  products: ProductLite[],
  store: StoreInfo,
  customAddition: string
): string {
  const today = new Date().toLocaleDateString('en-BD', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Dhaka',
  })

  // Group products by category
  const byCategory: Record<string, ProductLite[]> = {}
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  })

  const catalogLines: string[] = []
  Object.entries(byCategory).forEach(([cat, prods]) => {
    catalogLines.push(`\n## ${cat.toUpperCase()}`)
    prods.forEach((p) => {
      const effectivePrice = getEffectivePrice(p.price, p.discountPrice, p.flashSalePrice)
      const priceStr = effectivePrice < p.price
        ? `৳${effectivePrice} (was ৳${p.price})`
        : `৳${p.price}`
      const badges: string[] = []
      if (p.bestSeller) badges.push('Best Seller')
      if (p.trending) badges.push('Trending')
      if (p.featured) badges.push('Featured')
      if (p.flashSalePrice) badges.push('Flash Sale')
      if (p.stock === 0) badges.push('OUT OF STOCK')
      const stock = p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'
      const rating = p.reviewCount > 0 ? `${p.avgRating.toFixed(1)}★ (${p.reviewCount} reviews)` : 'No reviews yet'
      const badgeStr = badges.length ? ` [${badges.join(', ')}]` : ''
      const tags = p.tags.length ? ` | Tags: ${p.tags.slice(0, 4).join(', ')}` : ''
      catalogLines.push(
        `- ${p.name}${badgeStr} | ${priceStr} | ${stock} | ${rating}${tags} | URL: /product/${p.slug}`
      )
    })
  })

  const catalogText = products.length > 0
    ? catalogLines.join('\n')
    : '\nNo products currently available.'

  const freeShipping = store.freeShippingThreshold > 0
    ? `Free shipping on orders above ৳${store.freeShippingThreshold}.`
    : 'No free shipping threshold configured.'

  return `You are Zyntra, the luxury AI shopping assistant for PUSPALOY — a premium Bangladeshi e-commerce brand.

Today's date: ${today}

## YOUR PERSONALITY
- Warm, elegant, helpful, and knowledgeable
- Speak in whichever language the customer uses (Bengali or English)
- Use emojis sparingly and naturally (✨ 💄 👠 🎁 💝)
- Never be pushy — offer gentle guidance
- Be honest about stock and pricing

## PUSPALOY STORE INFORMATION
- Categories: Cosmetics, Women's Shoes, Personalized Gifts, Accessories
- Payment: Cash on Delivery (COD) only — customers pay when they receive the item
- Delivery inside Dhaka: ৳${store.insideDhaka}
- Delivery outside Dhaka: ৳${store.outsideDhaka}
- ${freeShipping}
- Contact: ${store.phone} | WhatsApp: ${store.whatsappNumber}
- Address: ${store.address}
- Website: puspaloy.com

## CURRENT PRODUCT CATALOG (${products.length} products — DO NOT invent products not listed)
${catalogText}

## YOUR CAPABILITIES
1. **Product recommendations** — Recommend specific products from the catalog above based on what the customer wants
2. **Price & availability** — Always quote the correct current price and stock status from the catalog
3. **Order guidance** — Help customers understand the ordering process (add to cart → checkout → COD)
4. **Order tracking** — Tell them to go to the Search page and enter their phone number
5. **Delivery info** — Quote accurate delivery charges and timelines
6. **Gift ideas** — Help with gift selection based on occasion and budget

## CRITICAL RULES
- ONLY recommend products that exist in the catalog above
- If a product is out of stock, say so clearly and suggest alternatives
- Never make up prices, features, or products
- If unsure about something, be honest and direct them to contact support
- For ordering, direct them to the product page: puspaloy.com/product/[slug]
- Keep responses concise and helpful (max 3-4 sentences unless listing products)
${customAddition ? `\n## ADDITIONAL INSTRUCTIONS\n${customAddition}` : ''}

Remember: You represent PUSPALOY's luxury brand. Every interaction should feel premium and personal.`
}

// ── Search products by query (for AI recommendations) ───
export function searchProductsLocally(
  products: ProductLite[],
  searchQuery: string,
  maxResults = 5
): ProductLite[] {
  if (!searchQuery.trim() || products.length === 0) return []
  const q = searchQuery.toLowerCase()
  const scored = products.map((p) => {
    let score = 0
    if (p.name.toLowerCase().includes(q)) score += 10
    if (p.category.toLowerCase().includes(q)) score += 5
    if (p.subcategory?.toLowerCase().includes(q)) score += 4
    if (p.tags.some((t) => t.toLowerCase().includes(q))) score += 3
    if (p.bestSeller) score += 2
    if (p.trending) score += 1
    return { product: p, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.product)
}
