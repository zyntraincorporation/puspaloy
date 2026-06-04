import React, { useMemo } from 'react'

interface SafeHtmlRendererProps {
  html: string
  className?: string
}

// Strip out scripts and iframes to prevent UI thread hanging and XSS
function sanitizeHtml(html: string): string {
  if (!html) return ''
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  // Remove heavy inline styles that could cause reflows
  clean = clean.replace(/style="[^"]*"/gi, '')
  return clean
}

const SafeHtmlRenderer = React.memo(({ html, className = '' }: SafeHtmlRendererProps) => {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
})

SafeHtmlRenderer.displayName = 'SafeHtmlRenderer'
export default SafeHtmlRenderer
