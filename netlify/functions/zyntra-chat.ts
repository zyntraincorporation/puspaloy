// netlify/functions/zyntra-chat.ts
// Serverless AI proxy — API key NEVER exposed to browser
// Deploy to Netlify → set OPENROUTER_API_KEY in environment variables

import type { Handler, HandlerEvent } from '@netlify/functions'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ── Rate limiting (simple in-memory per cold start) ──────
const ipCounts = new Map<string, { count: number; reset: number }>()
const MAX_PER_MINUTE = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= MAX_PER_MINUTE) return true
  entry.count++
  return false
}

// ── CORS headers ──────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }
  }

  // Rate limit
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: CORS,
      body: JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
    }
  }

  // API key — MUST be set in Netlify environment variables
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('[Zyntra] OPENROUTER_API_KEY not configured in environment')
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'AI service not configured. Contact support.' }),
    }
  }

  let body: {
    messages: { role: 'user' | 'assistant'; content: string }[]
    systemContext: string
    model?: string
  }

  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const { messages, systemContext, model = 'openai/gpt-4o-mini' } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'messages array required' }),
    }
  }

  // Build the full payload for OpenRouter
  const payload = {
    model,
    messages: [
      { role: 'system', content: systemContext },
      ...messages.slice(-12), // last 12 messages for context window efficiency
    ],
    max_tokens: 600,
    temperature: 0.7,
    stream: false,
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://puspaloy.com',
        'X-Title': 'PUSPALOY Zyntra Assistant',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Zyntra] OpenRouter error:', response.status, err)
      return {
        statusCode: response.status,
        headers: CORS,
        body: JSON.stringify({ error: 'AI service error. Please try again.' }),
      }
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? ''

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    }
  } catch (err) {
    console.error('[Zyntra] Network error:', err)
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to reach AI service. Please try again.' }),
    }
  }
}
