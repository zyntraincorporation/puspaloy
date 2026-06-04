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
      body: JSON.stringify({ error: 'Missing OPENROUTER_API_KEY server environment variable.' }) 
    }
  }

  try {
    const { productName, category } = JSON.parse(event.body || '{}')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://puspaloy.com',
        'X-Title': 'PUSPALOY Admin',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Write a compelling, luxury product description for a Bangladeshi e-commerce brand called PUSPALOY. 
Product: "${productName}" (Category: ${category})
Requirements:
- 2-3 paragraphs, professional luxury tone
- Highlight key benefits and quality
- Include a short bullet list of key features
- Keep it under 200 words
- Output clean HTML with <p> and <ul><li> tags only`,
        }],
      }),
    })

    const data = await response.json()
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error(err)
    return { 
      statusCode: 500, 
      headers: CORS, 
      body: JSON.stringify({ error: 'Failed to generate description' }) 
    }
  }
}
