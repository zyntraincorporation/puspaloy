// src/lib/invoice/generateInvoicePDF.ts
// ── Shared PDF generator ────────────────────────────────────────────────────
// Renders InvoiceContent into a temporary off-screen DOM node, captures it
// with html2canvas, and saves as a jsPDF A4 document.
// Used by both the customer Thank You page (via InvoiceTemplate) and the
// Admin Orders panel — both always produce identical PDFs.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import InvoiceContent from './InvoiceContent'
import type { Order } from '@/types'

// Styles injected into the html2canvas clone to force print-safe colours
const CLONE_STYLE = `
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
  #invoice-printable .inv-rose  { color: #be185d !important; }
  #invoice-printable .inv-gray  { color: #6b7280 !important; }
  #invoice-printable .inv-light-gray { color: #9ca3af !important; }
  #invoice-printable .inv-green { color: #059669 !important; }
`

export async function generateInvoicePDF(order: Order): Promise<void> {
  // ── 1. Mount InvoiceContent into a hidden off-screen container ────────────
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:794px;background:#ffffff;z-index:-1;pointer-events:none;'
  document.body.appendChild(wrapper)

  const root = createRoot(wrapper)
  root.render(createElement(InvoiceContent, { order }))

  // Give React one frame to paint the component
  await new Promise<void>((resolve) => setTimeout(resolve, 150))

  const element = wrapper.firstElementChild as HTMLElement | null

  if (!element) {
    root.unmount()
    document.body.removeChild(wrapper)
    throw new Error('InvoiceContent did not render')
  }

  try {
    // ── 2. Capture with html2canvas ─────────────────────────────────────────
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.querySelector<HTMLElement>('#invoice-printable')
        if (clonedEl) {
          const style = clonedDoc.createElement('style')
          style.textContent = CLONE_STYLE
          clonedDoc.head.appendChild(style)
        }
      },
    })

    // ── 3. Build PDF ────────────────────────────────────────────────────────
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
  } finally {
    // ── 4. Clean up regardless of success or error ──────────────────────────
    root.unmount()
    document.body.removeChild(wrapper)
  }
}
