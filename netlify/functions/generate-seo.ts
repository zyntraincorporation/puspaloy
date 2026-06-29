// netlify/functions/generate-seo.ts
// PUSPALOY AI SEO Generator — Bangladesh e-commerce optimized
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
    const { productName, category, tags, shortDescription, htmlDescription } = JSON.parse(
      event.body || '{}'
    )

    if (!productName) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'productName is required.' }),
      }
    }

    // Build a clean context from all available information
    const contextParts: string[] = []
    contextParts.push(`Product Name: "${productName}"`)
    if (category) contextParts.push(`Category: ${category}`)
    if (tags) contextParts.push(`Product Tags: ${tags}`)
    if (shortDescription?.trim()) {
      contextParts.push(`Admin Product Info:\n"""\n${shortDescription.trim()}\n"""`)
    }
    if (htmlDescription?.trim()) {
      // Strip HTML tags for clean text context
      const plainText = htmlDescription
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000)
      contextParts.push(`Product Description Summary:\n"""\n${plainText}\n"""`)
    }

    const context = contextParts.join('\n\n')

    const systemPrompt = `You are an SEO specialist for PUSPALOY, a premium Bangladeshi e-commerce brand (gifts, cosmetics, jewelry, fashion).

Your task: Generate SEO metadata for a product.

RULES:
- NEVER invent features, specs, certifications, or claims not provided.
- ONLY use information explicitly given. Use safe generic language when info is limited.
- Think like a Bangladeshi customer searching Google Bangladesh.

BD MARKET CONTEXT:
- Target: Google BD (google.com.bd), Bangla speakers, English BD searches, mixed Bangla-English queries.
- Common Bangla searches: "জন্মদিনের গিফট", "মেয়েদের উপহার", "প্রিয়জনের জন্য উপহার"
- Common English BD searches: "birthday gift bangladesh", "gift for girlfriend bd", "buy online dhaka"
- Mixed queries are very common: "birthday gift বাংলাদেশ", "গিফট box price bd"
- Gift category peaks around Eid, Pohela Boishakh, Valentine's Day, birthdays.

OUTPUT: Return ONLY valid JSON — no markdown, no code fences, no explanation. Start with { and end with }.

JSON SCHEMA (all fields required):
{
  "seoTitle": "50-60 chars, includes product name + 1-2 benefits, e.g. 'Premium Birthday Gift Box for Girls | PUSPALOY'",
  "seoDescription": "140-160 chars, what+why+CTA, mention Bangladesh/BD delivery, end with 'Order now' or similar",
  "seoKeywords": "8-12 comma-separated English keywords",
  "ogTitle": "60 chars max, slightly more creative than seoTitle",
  "ogDescription": "155 chars max, engaging social media description",
  "banglaKeywords": "8-10 comma-separated Bangla script keywords",
  "englishKeywords": "8-12 comma-separated English keywords for BD market (include bd, bangladesh, dhaka)",
  "mixedKeywords": "5-8 comma-separated mixed Bangla-English keywords as BD customers actually search",
  "commercialKeywords": "6-8 comma-separated buying-intent keywords (buy, price, order, shop)",
  "informationalKeywords": "6-8 comma-separated research/discovery keywords (best, ideas, guide, tips)",
  "seoTags": ["12-18 short specific tags", "mix product type", "occasion", "recipient", "category"],
  "searchIntentNotes": "1-2 sentence note about primary customer search intent for admin reference"
}`, 

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://puspaloygiftzone.shop',
        'X-Title': 'PUSPALOY Admin — SEO Generator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate SEO for this product:\n\n${context}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()

    // Log OpenRouter errors so they're visible in Netlify function logs
    if (!response.ok || data.error) {
      console.error('[generate-seo] OpenRouter error:', JSON.stringify(data))
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: data.error?.message || 'OpenRouter API error', detail: data }),
      }
    }

    const content = data.choices?.[0]?.message?.content ?? '{}'

    // Parse and validate JSON — double-safe parse
    let seoData: Record<string, unknown> = {}
    try {
      seoData = JSON.parse(content)
    } catch {
      // First fallback: try extracting JSON block from the content
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) seoData = JSON.parse(jsonMatch[0])
      } catch {
        // Content was too malformed to recover — return empty object
        // The UI handles missing fields gracefully
        console.warn('[generate-seo] Could not parse AI response as JSON:', content.slice(0, 300))
        seoData = {}
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, seo: seoData }),
    }
  } catch (err) {
    console.error('[generate-seo]', err)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to generate SEO content' }),
    }
  }
}
