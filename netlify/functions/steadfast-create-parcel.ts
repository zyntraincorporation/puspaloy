// netlify/functions/steadfast-create-parcel.ts
// Secure server-side proxy for the Steadfast Courier API.
//
// The frontend NEVER sees STEADFAST_API_KEY or STEADFAST_SECRET_KEY.
// Both credentials live exclusively in this Netlify Function.
//
// Environment variables (set in Netlify Dashboard → Site settings → Environment variables):
//   STEADFAST_API_KEY    — your Steadfast merchant API key
//   STEADFAST_SECRET_KEY — your Steadfast merchant Secret key

import type { Handler, HandlerEvent } from '@netlify/functions'

// ── Config ────────────────────────────────────────────────────────────────────
const STEADFAST_BASE_URL = 'https://portal.steadfast.com.bd/api/v1'
const STEADFAST_CREATE_URL = `${STEADFAST_BASE_URL}/create_order`

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_CORS = { ...CORS, 'Content-Type': 'application/json' }

// ── Rate limiting (in-memory per cold start) ──────────────────────────────────
const callCounts = new Map<string, { count: number; reset: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = callCounts.get(ip)
  if (!entry || now > entry.reset) {
    callCounts.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 30) return true
  entry.count++
  return false
}

// ── Validation ────────────────────────────────────────────────────────────────
interface SteadfastPayload {
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_city?: string
  recipient_zone?: string
  cod_amount: number
  note?: string
  item_description?: string
}

function validatePayload(p: unknown): p is SteadfastPayload {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  return (
    typeof o.invoice === 'string' && o.invoice.length > 0 &&
    typeof o.recipient_name === 'string' && o.recipient_name.length > 0 &&
    typeof o.recipient_phone === 'string' && o.recipient_phone.length >= 10 &&
    typeof o.recipient_address === 'string' && o.recipient_address.length > 0 &&
    typeof o.cod_amount === 'number' && o.cod_amount >= 0
  )
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_CORS, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  // Rate limit
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    console.warn('[Steadfast] Rate limited IP:', ip)
    return {
      statusCode: 429,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Too many requests. Please wait before retrying.' }),
    }
  }

  // ── Read env vars (server-side only) ────────────────────────────────────────
  const apiKey = process.env.STEADFAST_API_KEY
  const secretKey = process.env.STEADFAST_SECRET_KEY

  if (!apiKey || !secretKey) {
    console.error('[Steadfast] Missing STEADFAST_API_KEY or STEADFAST_SECRET_KEY env vars.')
    return {
      statusCode: 503,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Courier service is not configured. Contact the store admin.' }),
    }
  }

  // ── Parse request body ───────────────────────────────────────────────────────
  let body: { orderId: string; payload: unknown }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return {
      statusCode: 400,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Invalid request body — expected JSON.' }),
    }
  }

  if (!body.orderId || !body.payload) {
    return {
      statusCode: 400,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Missing orderId or payload in request.' }),
    }
  }

  // ── Validate payload fields ──────────────────────────────────────────────────
  if (!validatePayload(body.payload)) {
    return {
      statusCode: 400,
      headers: JSON_CORS,
      body: JSON.stringify({
        message: 'Invalid Steadfast payload. Required: invoice, recipient_name, recipient_phone, recipient_address, cod_amount.',
      }),
    }
  }

  const payload = body.payload as SteadfastPayload

  console.log(`[Steadfast] Creating parcel for order: ${body.orderId} | invoice: ${payload.invoice}`)

  // ── Call Steadfast API ───────────────────────────────────────────────────────
  let steadfastRes: Response
  try {
    steadfastRes = await fetch(STEADFAST_CREATE_URL, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    console.error('[Steadfast] Network error calling Steadfast API:', networkError)
    return {
      statusCode: 502,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Could not reach Steadfast API. Please try again later.' }),
    }
  }

  // ── Parse Steadfast response ─────────────────────────────────────────────────
  let steadfastBody: unknown
  try {
    steadfastBody = await steadfastRes.json()
  } catch {
    console.error('[Steadfast] Non-JSON response from Steadfast:', steadfastRes.status)
    return {
      statusCode: 502,
      headers: JSON_CORS,
      body: JSON.stringify({ message: 'Steadfast API returned an unexpected response.' }),
    }
  }

  // ── Log result ───────────────────────────────────────────────────────────────
  if (steadfastRes.ok) {
    console.log(`[Steadfast] Parcel created for order ${body.orderId}:`, JSON.stringify(steadfastBody))
  } else {
    console.error(`[Steadfast] API error (${steadfastRes.status}) for order ${body.orderId}:`, JSON.stringify(steadfastBody))
  }

  // ── Forward Steadfast response to frontend ───────────────────────────────────
  // We return the raw Steadfast body so the frontend can read consignment data.
  // Status code mirrors Steadfast's response for correct error handling on the client.
  return {
    statusCode: steadfastRes.ok ? 200 : steadfastRes.status,
    headers: JSON_CORS,
    body: JSON.stringify(steadfastBody),
  }
}
