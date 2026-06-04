import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'product' | 'article'
  url?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>
  children?: React.ReactNode
}

const DEFAULTS = {
  title: 'PUSPALOY – Luxury Beauty & Gifts | Bangladesh',
  description: 'Premium cosmetics, shoes, and personalized gifts from Bangladesh. Shop luxury beauty products, fragrances, and unique gift sets online.',
  image: 'https://puspaloy.netlify.app/og-image.jpg',
  type: 'website' as const,
  siteUrl: 'https://puspaloy.netlify.app'
}

export default function SEO({
  title,
  description,
  image,
  type = 'website',
  url,
  noindex = false,
  jsonLd,
  children
}: SEOProps) {
  const resolvedTitle = title ? `${title} | PUSPALOY` : DEFAULTS.title
  const resolvedDesc = description ?? DEFAULTS.description
  const resolvedImage = image ?? DEFAULTS.image
  const resolvedUrl = url ?? DEFAULTS.siteUrl

  // Default JSON-LD for Organization
  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PUSPALOY',
    url: DEFAULTS.siteUrl,
    logo: `${DEFAULTS.siteUrl}/icon-512.png`,
    description: DEFAULTS.description,
  }

  const finalJsonLd = jsonLd ?? defaultJsonLd

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDesc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={resolvedUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:site_name" content="PUSPALOY" />
      <meta property="og:locale" content="en_BD" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDesc} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* JSON-LD Structured Data */}
      {finalJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(finalJsonLd)}
        </script>
      )}

      {/* Additional specific tags passed from page */}
      {children}
    </Helmet>
  )
}
