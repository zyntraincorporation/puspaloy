// src/components/order/InvoiceTemplate.tsx
// Print-ready invoice with jsPDF download + @media print CSS styling
// Two modes: screen preview (rendered HTML) + print/PDF (same markup, print CSS handles the rest)
import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Printer, CheckCircle } from 'lucide-react'
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
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
        <img src="/favicon.ico" alt="Puspaloy Logo" className="w-full h-full object-contain" />
      </div>
      <div>
        <p className="font-serif text-xl font-bold tracking-widest" style={{ color: '#be185d' }}>PUSPALOY</p>
        <p className="text-xs text-gray-500" style={{ fontFamily: 'sans-serif', letterSpacing: '0.12em' }}>
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

      // Temporarily set a white background for the element itself just in case
      const originalBg = element.style.backgroundColor
      element.style.backgroundColor = '#ffffff'

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      
      element.style.backgroundColor = originalBg

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
  const handlePrint = () => {
    const content = invoiceRef.current?.innerHTML
    if (!content) return
    const printWindow = window.open('', '', 'width=800,height=900')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              body { 
                margin: 0; 
                padding: 40px; 
                background: #ffffff !important; 
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const subtotal = order.subtotal
  const deliveryCharge = order.deliveryCharge
  const couponDiscount = order.couponDiscount ?? 0
  const total = order.total

  return (
    <div>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
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
          AND is what @media print renders directly.
          Keep styles inline-friendly (no CSS vars) for html2canvas. */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #fce7f3' }}>
          <LogoMark />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: '700', color: '#be185d', letterSpacing: '0.05em' }}>
              INVOICE
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>{order.id}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {order.createdAt ? formatDate(order.createdAt) : new Date().toLocaleDateString('en-BD')}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* From */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              From
            </p>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>PUSPALOY</p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Dhaka, Bangladesh</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>info@puspaloy.com</p>
          </div>
          {/* To */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Bill To
            </p>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{order.customerName}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{order.phone}</p>
            {order.email && <p style={{ fontSize: '12px', color: '#6b7280' }}>{order.email}</p>}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{order.district}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{order.address}</p>
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
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#6b7280' }}>
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
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280' }}>
              <span>Delivery</span>
              <span>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669' }}>
                <span>Coupon ({order.couponCode})</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', marginTop: '8px', backgroundColor: '#fdf2f8', borderRadius: '8px', fontWeight: '700', fontSize: '15px' }}>
              <span style={{ color: '#111827' }}>Total</span>
              <span style={{ color: '#be185d' }}>{formatPrice(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280', marginTop: '6px' }}>
              <span>Payment Method</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Thank you for shopping with PUSPALOY!</p>
            <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px' }}>puspaloy.com · info@puspaloy.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#d1d5db' }}>Order ID</p>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#be185d', fontFamily: 'monospace' }}>{order.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
