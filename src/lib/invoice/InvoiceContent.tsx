// src/lib/invoice/InvoiceContent.tsx
// ── Pure invoice markup — no buttons, no side-effects ──────────────────────
// Consumed by both InvoiceTemplate (visual preview) and generateInvoicePDF
// (off-screen PDF capture). ALL styles are inline so html2canvas captures
// them correctly regardless of dark/light theme or missing CSS variables.
import { formatPrice, formatDate } from '@/utils/formatters'
import type { Order } from '@/types'

interface InvoiceContentProps {
  order: Order
}

// ── Logo — fixed alignment between image and brand name ────────────────────
function LogoMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Image sits directly in the flex row — no extra wrapper div */}
      <img
        src="/favicon.ico"
        alt="Puspaloy Logo"
        style={{
          width: '36px',
          height: '36px',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
          // Nudge image so its optical centre lines up with PUSPALOY text
          marginTop: '2px',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '21px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            color: '#be185d',
            margin: 0,
            lineHeight: 1,
          }}
        >
          PUSPALOY
        </p>
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px',
            color: '#6b7280',
            letterSpacing: '0.14em',
            margin: 0,
            lineHeight: 1,
          }}
        >
          PREMIUM LUXURY BRAND
        </p>
      </div>
    </div>
  )
}

// ── Invoice printable content ───────────────────────────────────────────────
export default function InvoiceContent({ order }: InvoiceContentProps) {
  const subtotal = order.subtotal
  const deliveryCharge = order.deliveryCharge
  const couponDiscount = order.couponDiscount ?? 0
  const total = order.total

  return (
    <div
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid #fce7f3',
        }}
      >
        <LogoMark />
        <div style={{ textAlign: 'right' }}>
          <p
            className="inv-rose"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              fontWeight: '700',
              color: '#be185d',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            INVOICE
          </p>
          <p
            className="inv-gray"
            style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '600', margin: '4px 0 0' }}
          >
            {order.id}
          </p>
          <p
            className="inv-light-gray"
            style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', margin: '2px 0 0' }}
          >
            {order.createdAt ? formatDate(order.createdAt) : new Date().toLocaleDateString('en-BD')}
          </p>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* From */}
        <div>
          <p
            className="inv-light-gray"
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#9ca3af',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              margin: '0 0 8px',
            }}
          >
            From
          </p>
          <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827', margin: 0 }}>PUSPALOY</p>
          <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', margin: '2px 0 0' }}>
            Dhaka, Bangladesh
          </p>
          <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            info@puspaloy.com
          </p>
        </div>
        {/* To */}
        <div>
          <p
            className="inv-light-gray"
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#9ca3af',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              margin: '0 0 8px',
            }}
          >
            Bill To
          </p>
          <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827', margin: 0 }}>
            {order.customerName}
          </p>
          <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', margin: '2px 0 0' }}>
            {order.phone}
          </p>
          {order.email && (
            <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              {order.email}
            </p>
          )}
          <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', margin: '2px 0 0' }}>
            {order.district}
          </p>
          <p className="inv-gray" style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            {order.address}
          </p>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#fdf2f8' }}>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: '700',
                color: '#9ca3af',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Product
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '700',
                color: '#9ca3af',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Qty
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'right',
                fontSize: '11px',
                fontWeight: '700',
                color: '#9ca3af',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Unit Price
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'right',
                fontSize: '11px',
                fontWeight: '700',
                color: '#9ca3af',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
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
          <div
            className="inv-total-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              marginTop: '8px',
              backgroundColor: '#fdf2f8',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
            }}
          >
            <span style={{ color: '#111827' }}>Total</span>
            <span className="inv-rose" style={{ color: '#be185d' }}>
              {formatPrice(total)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#6b7280', marginTop: '6px' }}>
            <span className="inv-gray">Payment Method</span>
            <span style={{ fontWeight: '600', color: '#111827' }}>Cash on Delivery</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #f3f4f6',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p className="inv-light-gray" style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            Thank you for shopping with PUSPALOY!
          </p>
          <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px', margin: '2px 0 0' }}>
            puspaloy.com · info@puspaloy.com
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="inv-light-gray" style={{ fontSize: '11px', color: '#d1d5db', margin: 0 }}>
            Order ID
          </p>
          <p className="inv-rose" style={{ fontSize: '13px', fontWeight: '700', color: '#be185d', fontFamily: 'monospace', margin: 0 }}>
            {order.id}
          </p>
        </div>
      </div>
    </div>
  )
}
