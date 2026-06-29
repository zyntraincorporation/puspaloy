// src/components/order/InvoiceTemplate.tsx
// Customer-facing invoice preview + PDF download button.
// Print button has been removed — PDF download is the only export path.
// PDF generation is delegated to the shared generateInvoicePDF utility so
// both customer and admin always receive identical invoices.
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2 } from 'lucide-react'
import { generateInvoicePDF } from '@/lib/invoice/generateInvoicePDF'
import InvoiceContent from '@/lib/invoice/InvoiceContent'
import type { Order } from '@/types'

interface InvoiceTemplateProps {
  order: Order
}

export default function InvoiceTemplate({ order }: InvoiceTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      await generateInvoicePDF(order)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [order, isGenerating])

  return (
    <div>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6 no-print">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-luxury bg-gradient-luxury text-white font-sans text-sm font-semibold shadow-gold hover:shadow-luxury-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Download size={15} />
              Download Invoice PDF
            </>
          )}
        </motion.button>
      </div>

      {/* Invoice preview — same markup that gets rendered into the PDF */}
      <InvoiceContent order={order} />
    </div>
  )
}
