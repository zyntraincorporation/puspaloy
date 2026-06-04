// netlify/functions/send-notification.ts
// Sends Telegram notification when a new PUSPALOY order is placed.
// Env vars (set in Netlify Dashboard → Site settings → Environment variables):
//   TELEGRAM_BOT_TOKEN  — from @BotFather
//   TELEGRAM_CHAT_ID    — your channel/group/personal chat ID

import type { Handler, HandlerEvent } from '@netlify/functions'

// ── CORS ─────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Rate limiting (in-memory per cold start) ─────────────
const callCounts = new Map<string, { count: number; reset: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = callCounts.get(ip)
  if (!entry || now > entry.reset) {
    callCounts.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 100) return true
  entry.count++
  return false
}

// ── Bangladesh Time formatter ─────────────────────────────
function formatBDTime(): string {
  return new Intl.DateTimeFormat('en-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}

// ── Build Telegram message ────────────────────────────────
interface OrderItem {
  productName: string
  quantity: number
  price: number
  discountPrice?: number | null
  flashSalePrice?: number | null
}

interface NotificationPayload {
  id: string
  customerName: string
  phone: string
  email?: string | null
  district: string
  address?: string
  subtotal: number
  deliveryCharge: number
  couponCode?: string | null
  couponDiscount?: number
  total: number
  paymentMethod: string
  notes?: string | null
  items: OrderItem[]
}

function getEffectivePrice(price: number, discountPrice?: number | null, flashSalePrice?: number | null): number {
  if (flashSalePrice && flashSalePrice > 0 && flashSalePrice < price) return flashSalePrice
  if (discountPrice && discountPrice > 0 && discountPrice < price) return discountPrice
  return price
}

function buildTelegramMessage(order: NotificationPayload): string {
  const itemLines = order.items
    .map((item) => {
      const price = getEffectivePrice(item.price, item.discountPrice, item.flashSalePrice)
      return `  • ${item.productName} x${item.quantity} — ৳${(price * item.quantity).toLocaleString()}`
    })
    .join('\n')

  const couponLine = order.couponCode && order.couponDiscount && order.couponDiscount > 0
    ? `\n🏷️ Coupon: <b>${order.couponCode}</b> (-৳${order.couponDiscount.toLocaleString()})`
    : ''

  const notesLine = order.notes
    ? `\n📝 Notes: ${order.notes}`
    : ''

  const emailLine = order.email
    ? `\n📧 Email: ${order.email}`
    : ''

  return `🛍️ <b>New Order! ${order.id}</b>

👤 <b>Customer:</b> ${order.customerName} | ${order.phone}${emailLine}
📍 <b>District:</b> ${order.district}
🏠 <b>Address:</b> ${order.address || 'Not provided'}
💳 <b>Payment:</b> Cash on Delivery${notesLine}

📦 <b>Items (${order.items.length}):</b>
${itemLines}
${couponLine}
🚚 Delivery: ৳${order.deliveryCharge.toLocaleString()}
💰 <b>Total: ৳${order.total.toLocaleString()}</b>

⏰ ${formatBDTime()}`
}

// ── Handler ───────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }
  }

  // Rate limit
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limited' }) }
  }

  // Env vars
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('[Notification] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    // Return 200 so the checkout doesn't fail — notification is non-critical
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: false, reason: 'Telegram not configured' }),
    }
  }

  // Parse body
  let payload: { order: NotificationPayload }
  try {
    payload = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { order } = payload
  if (!order?.id || !order?.customerName) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing order data' }) }
  }

  // Build and send Telegram message
  const text = buildTelegramMessage(order)
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Notification] Telegram API error:', res.status, err)
      // Non-critical failure — return 200 to not block checkout
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: false, reason: 'Telegram API error' }),
      }
    }

    console.log('[Notification] Telegram message sent for order:', order.id)
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('[Notification] Network error:', err)
    return {
      statusCode: 200, // Non-critical — don't fail checkout
      headers: CORS,
      body: JSON.stringify({ success: false, reason: 'Network error' }),
    }
  }
}
