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

    const systemPrompt = `You are an expert SEO specialist and e-commerce strategist specializing in the Bangladesh market.

Your task: Generate comprehensive SEO metadata for a product on PUSPALOY, a premium Bangladeshi e-commerce brand selling gifts, cosmetics, jewelry, and fashion accessories.

═══════════════════════════════════════════════════════════
⚠️  ABSOLUTE RULES — NEVER VIOLATE
═══════════════════════════════════════════════════════════

1. ❌ NEVER invent product features, materials, or specs
2. ❌ NEVER fabricate certifications, awards, or claims
3. ❌ NEVER hallucinate package contents or dimensions
4. ✅ ONLY base SEO on information explicitly provided
5. ✅ Use generic safe language when info is limited (e.g., "premium gift", "quality product")
6. ✅ Think like a CUSTOMER searching for this product on Google Bangladesh

═══════════════════════════════════════════════════════════
BANGLADESH E-COMMERCE SEO CONTEXT
═══════════════════════════════════════════════════════════

Target markets:
- Google Bangladesh (google.com.bd + google.com searches from Bangladesh)
- Bangla-language search queries
- English-language search queries from Bangladeshi users
- Mixed Bangla-English queries (very common in Bangladesh)

Customer search behaviors:
- Customers often search in Bangla script: "জন্মদিনের গিফট", "মেয়েদের উপহার"
- Customers also search in English: "birthday gift bangladesh", "gift for girlfriend bd"
- Mixed queries are very common: "birthday gift বাংলাদেশ", "গিফট box price"
- "bd" and "bangladesh" suffixes are common in product searches
- Price-conscious searches: "দাম", "price", "কত টাকা"
- Occasion-based searches are very high-volume in BD market
- Gift category is extremely popular around Eid, Pohela Boishakh, Valentine's, birthdays

═══════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON
═══════════════════════════════════════════════════════════

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must have EXACTLY these fields:

{
  "seoTitle": "string — 50 to 60 characters, Google-optimized, includes product name",
  "seoDescription": "string — 140 to 160 characters, compelling for CTR, includes a call to action",
  "seoKeywords": "string — comma-separated English keywords, 8-15 keywords",
  "ogTitle": "string — Open Graph title, slightly more creative than seoTitle, max 60 chars",
  "ogDescription": "string — Open Graph description, engaging, max 155 chars",
  "banglaKeywords": "string — comma-separated Bangla script keywords, 8-12 terms",
  "englishKeywords": "string — comma-separated English keywords optimized for BD market, 10-15 terms",
  "mixedKeywords": "string — comma-separated mixed Bangla-English keywords as BD customers actually search, 5-8 terms",
  "commercialKeywords": "string — comma-separated buying-intent keywords, 6-10 terms (e.g. 'buy gift box online', 'gift box price bd', 'order gift online bangladesh')",
  "informationalKeywords": "string — comma-separated research/discovery keywords, 6-10 terms (e.g. 'best gift for girlfriend', 'birthday gift ideas', 'unique gift ideas bangladesh')",
  "seoTags": ["array", "of", "strings", "all", "relevant", "tags"],
  "searchIntentNotes": "string — brief note about primary customer search intent (for admin reference)"
}

═══════════════════════════════════════════════════════════
SEO TITLE RULES
═══════════════════════════════════════════════════════════

- Must be 50–60 characters (count carefully)
- Include product name + 1-2 key benefits or occasion
- End with brand or location context when space allows
- Format example: "Premium Birthday Gift Box for Girls | PUSPALOY"
- Never exceed 60 characters

═══════════════════════════════════════════════════════════
META DESCRIPTION RULES
═══════════════════════════════════════════════════════════

- Must be 140–160 characters (count carefully)
- Include: what the product is + why buy + call to action
- Use emotional/occasion language appropriate for BD market
- Include "Bangladesh" or "BD" delivery mention when natural
- End with a soft CTA: "Order now", "Shop now", "Gift today"

═══════════════════════════════════════════════════════════
KEYWORD STRATEGY
═══════════════════════════════════════════════════════════

English Keywords (for seoKeywords and englishKeywords):
- Include commercial intent: "buy [product]", "[product] price"
- Include occasion intent: "birthday gift", "anniversary gift"
- Include location: "bangladesh", "bd", "dhaka"
- Include long-tail: "premium gift for girlfriend bangladesh"
- Include category: use the product category provided

Bangla Keywords (for banglaKeywords):
- জন্মদিনের গিফট / উপহার
- মেয়েদের গিফট / ছেলেদের গিফট (as appropriate)
- প্রিয়জনের জন্য উপহার
- বাংলাদেশে ডেলিভারি
- অনলাইন শপিং বাংলাদেশ
- ইউনিক গিফট আইডিয়া
- Category-specific Bangla terms
- Occasion-specific Bangla terms

Mixed Keywords:
- Real examples: "birthday gift বাংলাদেশ", "গিফট box price bd", "premium উপহার dhaka"
- These reflect how Bangladeshi customers actually type in search bars

SEO Tags:
- Generate 15–25 short, specific tags
- Mix: product type, occasion, recipient, category, brand
- Examples: "gift box", "birthday gift", "anniversary gift", "gift for girlfriend", "premium gift bangladesh"

═══════════════════════════════════════════════════════════
FINAL REMINDER
═══════════════════════════════════════════════════════════

Output ONLY valid JSON. No markdown. No code fences. No explanation.
Start your response with { and end with }.
Every field must be present even if information is limited.`

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
        max_tokens: 2500,
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
