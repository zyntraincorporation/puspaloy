// src/lib/analytics.ts
// Google Analytics 4 + Microsoft Clarity — initialised once in main.tsx
// All functions are safe to call even if scripts haven't loaded yet.

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    clarity: (action: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

// ── GA4 ────────────────────────────────────────────────────
export function initGA4(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
  if (!measurementId || typeof document === 'undefined') return

  // Inject gtag.js script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  // Init dataLayer and gtag function
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    // Don't send page_view automatically — we send it per route change in router
    send_page_view: false,
    // Bangladesh-specific config
    currency: 'BDT',
    country: 'BD',
  })
}

// ── Microsoft Clarity ──────────────────────────────────────
export function initClarity(): void {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined
  if (!projectId || typeof document === 'undefined') return

  // Clarity inline init script
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.innerHTML = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");
  `
  document.head.appendChild(script)
}

// ── Safe gtag wrapper ──────────────────────────────────────
function gtag(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', event, params)
}

// ── Page View ──────────────────────────────────────────────
export function trackPageView(path: string, title?: string): void {
  gtag('page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  })
}

// ── Ecommerce Events ───────────────────────────────────────
export function trackViewItem(
  productId: string,
  productName: string,
  price: number,
  category: string
): void {
  gtag('view_item', {
    currency: 'BDT',
    value: price,
    items: [{
      item_id: productId,
      item_name: productName,
      item_category: category,
      price,
      quantity: 1,
    }],
  })
}

export function trackAddToCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number,
  category?: string
): void {
  gtag('add_to_cart', {
    currency: 'BDT',
    value: price * quantity,
    items: [{
      item_id: productId,
      item_name: productName,
      item_category: category,
      price,
      quantity,
    }],
  })
}

export function trackRemoveFromCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number
): void {
  gtag('remove_from_cart', {
    currency: 'BDT',
    value: price * quantity,
    items: [{ item_id: productId, item_name: productName, price, quantity }],
  })
}

export interface PurchaseItem {
  productId: string
  productName: string
  price: number
  quantity: number
  category?: string
}

export function trackPurchase(
  orderId: string,
  total: number,
  deliveryCharge: number,
  couponCode: string | null,
  couponDiscount: number,
  items: PurchaseItem[]
): void {
  gtag('purchase', {
    transaction_id: orderId,
    currency: 'BDT',
    value: total,
    shipping: deliveryCharge,
    coupon: couponCode ?? undefined,
    discount: couponDiscount || undefined,
    items: items.map((item) => ({
      item_id: item.productId,
      item_name: item.productName,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}

export function trackSearch(searchTerm: string): void {
  gtag('search', { search_term: searchTerm })
}

export function trackAddToWishlist(productId: string, productName: string, price: number): void {
  gtag('add_to_wishlist', {
    currency: 'BDT',
    value: price,
    items: [{ item_id: productId, item_name: productName, price }],
  })
}

export function trackBeginCheckout(total: number, itemCount: number): void {
  gtag('begin_checkout', {
    currency: 'BDT',
    value: total,
    num_items: itemCount,
  })
}

export function trackShare(method: string, contentType: string, itemId: string): void {
  gtag('share', { method, content_type: contentType, item_id: itemId })
}
