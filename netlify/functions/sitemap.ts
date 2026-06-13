import type { Handler, HandlerEvent } from '@netlify/functions'

export const handler: Handler = async (event: HandlerEvent) => {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  const baseUrl = process.env.VITE_APP_URL || 'https://puspaloygiftzone.shop'

  if (!projectId || projectId === 'your_project_id') {
    return {
      statusCode: 500,
      body: 'Firebase project ID not configured',
    }
  }

  try {
    // Fetch products from Firestore REST API
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`
    )
    
    let productUrls = ''
    if (response.ok) {
      const data = await response.json()
      if (data.documents) {
        productUrls = data.documents.map((doc: any) => {
          // Document name is like: projects/YOUR_PROJECT/databases/(default)/documents/products/SLUG
          const id = doc.name.split('/').pop()
          const updateTime = doc.updateTime || new Date().toISOString()
          return `
  <url>
    <loc>${baseUrl}/product/${id}</loc>
    <lastmod>${updateTime}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        }).join('')
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/cosmetics</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/shoes</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/gifts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/personalized-gifts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/category/accessories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>${productUrls}
</urlset>`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
      body: sitemap.trim(),
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    }
  }
}
