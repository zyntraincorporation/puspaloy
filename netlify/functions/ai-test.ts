// netlify/functions/ai-test.ts
// PUSPALOY AI Diagnostic — visit /.netlify/functions/ai-test to debug
import type { Handler } from '@netlify/functions'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export const handler: Handler = async () => {
  const apiKey = process.env.OPENROUTER_API_KEY

  // Step 1: Check if env var is set
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '❌ FAIL',
        step: 'Environment Variable',
        problem: 'OPENROUTER_API_KEY is NOT set in Netlify environment variables.',
        fix: 'Netlify Dashboard → Site configuration → Environment variables → Add variable → Key: OPENROUTER_API_KEY',
      }, null, 2),
    }
  }

  // Step 2: Make a minimal test call to OpenRouter
  let openRouterStatus = 0
  let openRouterBody: unknown = null

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://puspaloygiftzone.shop',
        'X-Title': 'PUSPALOY AI Diagnostic',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply with the word OK only.' }],
        max_tokens: 5,
      }),
    })

    openRouterStatus = response.status
    openRouterBody = await response.json()

    // Step 3: Check for API errors
    const body = openRouterBody as Record<string, unknown>

    if (body.error) {
      const err = body.error as Record<string, unknown>
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: '❌ FAIL',
          step: 'OpenRouter API Call',
          http_status: openRouterStatus,
          problem: err.message || 'OpenRouter returned an error',
          error_code: err.code,
          error_type: err.type,
          api_key_preview: apiKey.slice(0, 12) + '...' + apiKey.slice(-4),
          full_error: body.error,
          common_fixes: [
            'Wrong API key → Go to openrouter.ai/keys and copy the correct key',
            'No credits → Go to openrouter.ai/credits and add balance',
            'Key has no model access → Check openrouter.ai/models for gpt-4o-mini access',
          ],
        }, null, 2),
      }
    }

    // Step 4: Extract AI response
    const choices = body.choices as Array<{ message: { content: string } }> | undefined
    const aiReply = choices?.[0]?.message?.content ?? '(empty)'

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '✅ SUCCESS',
        message: 'AI is working correctly! Both functions should work.',
        api_key_preview: apiKey.slice(0, 12) + '...' + apiKey.slice(-4),
        model: 'openai/gpt-4o-mini',
        ai_reply: aiReply,
        http_status: openRouterStatus,
      }, null, 2),
    }
  } catch (err: unknown) {
    const e = err as Error
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '❌ FAIL',
        step: 'Network / Fetch Error',
        problem: e.message,
        http_status: openRouterStatus,
        raw_response: openRouterBody,
        fix: 'Netlify may be blocking outbound connections, or OpenRouter is down.',
      }, null, 2),
    }
  }
}
