// src/components/order/InvoiceTemplate.tsx
// Print-ready invoice with jsPDF download + @media print CSS styling
// Two modes: screen preview (rendered HTML) + print/PDF (same markup, print CSS handles the rest)
import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Printer } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { formatPrice, formatDate } from '@/utils/formatters'
import type { Order } from '@/types'

interface InvoiceTemplateProps {
  order: Order
}

// ── Logo mark (inline SVG, no external image needed) ──────
function LogoMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/favicon.ico" alt="Puspaloy Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '21px', fontWeight: '700', letterSpacing: '0.08em', color: '#be185d', margin: 0 }}>PUSPALOY</p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#6b7280', letterSpacing: '0.12em', margin: 0 }}>
          PREMIUM LUXURY BRAND
        </p>
      </div>
    </div>
  )
}

export default function InvoiceTemplate({ order }: InvoiceTemplateProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  // ── jsPDF Download ────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    try {
      const element = invoiceRef.current
      if (!element) return

      // Force white background temporarily so html2canvas captures correctly
      // regardless of current dark/light theme
      const allEls = element.querySelectorAll<HTMLElement>('*')
      const savedStyles: { el: HTMLElement; bg: string; color: string }[] = []

      // Snapshot & override computed styles for every child element
      allEls.forEach((el) => {
        const computed = window.getComputedStyle(el)
        const bg = computed.backgroundColor
        const color = computed.color
        savedStyles.push({ el, bg: el.style.backgroundColor, color: el.style.color })

        // Only override elements that have dark backgrounds (luminance heuristic)
        // Parse rgb and check brightness
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (match) {
          const [, r, g, b] = match.map(Number)
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          if (luminance < 100) {
            el.style.backgroundColor = '#ffffff'
            el.style.color = '#111827'
          }
        }
      })

      const savedBg = element.style.backgroundColor
      const savedColor = element.style.color
      element.style.backgroundColor = '#ffffff'
      element.style.color = '#111827'

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force all elements in the clone to use print-safe colors
          const clonedEl = clonedDoc.querySelector<HTMLElement>('#invoice-printable')
          if (clonedEl) {
            clonedEl.style.backgroundColor = '#ffffff'
            clonedEl.style.color = '#111827'
            // Inject a blanket style override into the clone
            const style = clonedDoc.createElement('style')
            style.textContent = `
              #invoice-printable, #invoice-printable * {
                background-color: transparent !important;
                color: #111827 !important;
                border-color: #e5e7eb !important;
              }
              #invoice-printable {
                background-color: #ffffff !important;
              }
              #invoice-printable thead tr {
                background-color: #fdf2f8 !important;
              }
              #invoice-printable .inv-total-row {
                background-color: #fdf2f8 !important;
              }
              #invoice-printable .inv-rose {
                color: #be185d !important;
              }
              #invoice-printable .inv-gray {
                color: #6b7280 !important;
              }
              #invoice-printable .inv-light-gray {
                color: #9ca3af !important;
              }
              #invoice-printable .inv-green {
                color: #059669 !important;
              }
            `
            clonedDoc.head.appendChild(style)
          }
        },
      })

      // Restore original styles
      element.style.backgroundColor = savedBg
      element.style.color = savedColor
      savedStyles.forEach(({ el, bg, color }) => {
        el.style.backgroundColor = bg
        el.style.color = color
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width

      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
        y += pageH
      }

      pdf.save(`PUSPALOY-Invoice-${order.id}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF. Please try the Print option instead.')
    }
  }, [order.id])

  // ── Native Print ──────────────────────────────────────────
  // We use direct window.print() which triggers the @media print rules
  // already defined in index.css. Those rules:
  //   - hide everything except .print-scope
  //   - force #invoice-printable to white background + black text
  //   - hide .no-print elements
  // This is FAR more reliable than opening a new blank window whose
  // body has no stylesheet to resolve CSS variables or Tailwind classes.
  const handlePrint = useCallback(() => {
    // Inject a temporary <style> that will ONLY apply during printing.
    // This blanket override defeats any dark-mode CSS variable inheritance.
    const styleId = '__puspaloy_print_fix__'
    let style = document.getElementById(styleId) as HTMLStyleElement | null

    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }

    style.textContent = `
      @media print {
        /* Nuclear reset: force white page */
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Hide everything outside the print scope */
        body > *,
        #root > * {
          display: none !important;
        }

        /* Show only the order confirmation page wrapper */
        #root .print-scope {
          display: block !important;
          background: #ffffff !important;
          color: #000000 !important;
        }

        /* Hide non-invoice UI */
        .no-print {
          display: none !important;
        }

        /* The invoice document itself */
        #invoice-printable {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 15mm 12mm !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          color: #111827 !important;
          font-size: 11pt !important;
        }

        /* Force every descendant to safe print colors */
        #invoice-printable * {
          color: inherit !important;
          background-color: transparent !important;
          border-color: #e5e7eb !important;
          box-shadow: none !important;
        }

        /* Restore specific colored elements */
        #invoice-printable .inv-rose {
          color: #be185d !important;
        }
        #invoice-printable .inv-gray {
          color: #6b7280 !important;
        }
        #invoice-printable .inv-light-gray {
          color: #9ca3af !important;
        }
        #invoice-printable .inv-green {
          color: #059669 !important;
        }
        #invoice-printable thead tr {
          background-color: #fdf2f8 !important;
        }
        #invoice-printable thead th {
          color: #9ca3af !important;
        }
        #invoice-printable .inv-total-row {
          background-color: #fdf2f8 !important;
        }
        #invoice-printable .inv-section-divider {
          background-color: #fce7f3 !important;
        }

        /* Table rows don't break across pages */
        tr { page-break-inside: avoid; }

        @page {
          size: A4 portrait;
          margin: 8mm;
        }
      }
    `

    // Small delay lets the browser parse the injected stylesheet
    setTimeout(() => {
      window.print()
      // Clean up the injected style after printing dialog closes
      setTimeout(() => {
        const s = document.getElementById(styleId)
        if (s) s.remove()
      }, 1000)
    }, 100)
  }, [])

  const subtotal = order.subtotal
  const deliveryCharge = order.deliveryCharge
  const couponDiscount = order.couponDiscount ?? 0
  const total = order.total

  return (
    <div>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6 no-print">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-luxury bg-gradient-luxury text-white font-sans text-sm font-semibold shadow-gold hover:shadow-luxury-md transition-all"
        >
          <Download size={15} />
          Download PDF
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-luxury border border-[var(--border)] text-[var(--text-primary)] font-sans text-sm font-semibold hover:bg-[var(--bg-muted)] transition-colors"
        >
          <Printer size={15} />
          Print / Save as PDF
        </motion.button>
      </div>

      {/* ── Invoice Document ─────────────────────────────────
          This div is captured by html2canvas for jsPDF
          AND rendered via @media print.
          ALL styles are inline (no CSS vars) so both paths work correctly.
          Color helper classes (inv-rose, inv-gray, etc.) are used for
          the print stylesheet to re-apply brand colors. */}
      <div
        ref={invoiceRef}
        id="invoice-printable"
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#ffffff',
          color: '#111827',
          maxWidth: '794px',
          margin: '0 auto',
          padding: '40px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #fce7f3' }} className="inv-section-divider-border">
          <LogoMark />
          <div style={{ textAlign: 'right' }}>
            <p className="inv-rose" style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#be185d', letterSpacing: '0.05em' }}>
              INVOICE
            </p>
            <p className="inv-gray" style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>{order.id}</p>
            <p className="inv-light-gray" style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {order.createdAt ? formatDate(order.createdAt) : new Date().toLocaleDateString('en-BD')}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* From */}
          <div>
            <p className="inv-light-gray" style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              From
            </p>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>PUSPALOY</p>
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Dhaka, Bangladesh</p>
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280' }}>info@puspaloy.com</p>
          </div>
          {/* To */}
          <div>
            <p className="inv-light-gray" style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Bill To
            </p>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{order.customerName}</p>
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{order.phone}</p>
            {order.email && <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280' }}>{order.email}</p>}
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{order.district}</p>
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280' }}>{order.address}</p>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fdf2f8' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Product
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Qty
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Unit Price
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const unitPrice = item.flashSalePrice ?? item.discountPrice ?? item.price
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#111827', fontWeight: '500' }}>
                    {item.productName}
                  </td>
                  <td className="inv-gray" style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                    {item.quantity}
                  </td>
                  <td className="inv-gray" style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#6b7280' }}>
                    {formatPrice(unitPrice)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                    {formatPrice(unitPrice * item.quantity)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '220px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280' }}>
              <span className="inv-gray">Subtotal</span>
              <span className="inv-gray">{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280' }}>
              <span className="inv-gray">Delivery</span>
              <span className="inv-gray">{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669' }}>
                <span className="inv-green">Coupon ({order.couponCode})</span>
                <span className="inv-green">-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="inv-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', marginTop: '8px', backgroundColor: '#fdf2f8', borderRadius: '8px', fontWeight: '700', fontSize: '15px' }}>
              <span style={{ color: '#111827' }}>Total</span>
              <span className="inv-rose" style={{ color: '#be185d' }}>{formatPrice(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280', marginTop: '6px' }}>
              <span className="inv-gray">Payment Method</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="inv-light-gray" style={{ fontSize: '12px', color: '#9ca3af' }}>Thank you for shopping with PUSPALOY!</p>
            <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px' }}>puspaloy.com · info@puspaloy.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="inv-light-gray" style={{ fontSize: '11px', color: '#d1d5db' }}>Order ID</p>
            <p className="inv-rose" style={{ fontSize: '13px', fontWeight: '700', color: '#be185d', fontFamily: 'monospace' }}>{order.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
