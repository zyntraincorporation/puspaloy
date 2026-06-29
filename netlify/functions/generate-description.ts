// netlify/functions/generate-description.ts
// PUSPALOY AI Description Generator — v2 (strict anti-hallucination)
import type { Handler, HandlerEvent } from '@netlify/functions'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing OPENROUTER_API_KEY server environment variable.' }),
    }
  }

  try {
    const { productName, category, tags, shortDescription } = JSON.parse(event.body || '{}')

    if (!productName) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'productName is required.' }),
      }
    }

    // Build the user message from all available admin-provided info
    const userParts: string[] = []
    userParts.push(`Product Name: "${productName}"`)
    if (category) userParts.push(`Category: ${category}`)
    if (tags) userParts.push(`Tags / Keywords: ${tags}`)
    if (shortDescription?.trim()) {
      userParts.push(`Admin's Product Information:\n"""\n${shortDescription.trim()}\n"""`)
    } else {
      userParts.push(`Admin's Product Information: (none provided — use only the product name, category and tags above)`)
    }

    const userMessage = userParts.join('\n\n')

    const systemPrompt = `You are PUSPALOY's expert product content designer. Transform the admin-provided product information into a beautiful, fully styled HTML product description for PUSPALOY's luxury Bangladeshi e-commerce website.

⚠️ ABSOLUTE RULES — NEVER VIOLATE:
1. NEVER invent or hallucinate product information, specs, materials, certifications, or package contents.
2. ONLY use information explicitly provided by the admin.
3. If info is missing, use safe generic language: "premium quality", "beautifully crafted", "carefully selected".
4. If package contents are not listed, write: "Please refer to product images for package details."

BRAND: PUSPALOY — Premium Bangladeshi Jewelry & Gift Brand
TONE: Elegant, romantic, warm, aspirational. Audience: Bangladeshi women aged 18–40.

COLORS (inline CSS only):
- Hero gradient: #2d1b4e → #8b4a7a
- Gold accent: #e8c97a | Table header: #5b2d6e
- Section title: #8b4a7a | Tag bg: #fdf0f4 | Tag border: #e8b4c8
- Body text: #1a1a2e | Muted: #666680

HTML RULES:
- Inline CSS only. No <style> blocks, no class names.
- No <html>, <head>, <body> tags. No markdown fences.
- max-width: 680px; margin: 0 auto; on all containers.
- box-shadow: 0 2px 12px rgba(91,45,110,0.10) on main sections.

REQUIRED SECTIONS (generate all that apply, keep each concise):
1. HERO BANNER — Purple gradient, gold brand label, product name, one-line tagline.
2. PRODUCT STORY — 2–3 sentence romantic paragraph, gold left-border, blush background.
3. PACKAGE CONTENTS TABLE — Only items mentioned by admin. Purple header, alternating rows.
4. KEY HIGHLIGHTS — 3–4 cards with emoji, bold label, short subtitle. Based only on admin info.
5. PERFECT FOR — Rose pill tags with emojis (Birthday, Anniversary, etc.).
6. FOOTER — ✦ PUSPALOY — [short poetic tagline] ✦

OUTPUT: Return ONLY the HTML. No explanation. No markdown. Start directly with a <div>.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://puspaloygiftzone.shop',
        'X-Title': 'PUSPALOY Admin — Description Generator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 900,
        temperature: 0.7,
      }),
    })

    const data = await response.json()

    // Propagate OpenRouter errors clearly so the frontend can show the real reason
    if (!response.ok || (data as Record<string, unknown>).error) {
      const errObj = (data as Record<string, unknown>).error as Record<string, unknown> | undefined
      const errMsg = errObj?.message ?? `OpenRouter API error (HTTP ${response.status})`
      console.error('[generate-description] OpenRouter error:', JSON.stringify(data))
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: errMsg, detail: errObj }),
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error('[generate-description]', err)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to generate description' }),
    }
  }
}
