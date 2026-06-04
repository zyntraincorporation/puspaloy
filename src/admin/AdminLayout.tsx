// src/admin/AdminLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/firebase/auth'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Star,
  Ticket, Zap, Image, Users, Settings, LogOut, Menu, X, AlertOctagon, Copy
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', permission: null },
  { icon: Package, label: 'Products', href: '/admin/products', permission: 'addProducts' },
  { icon: Tag, label: 'Categories', href: '/admin/categories', permission: 'manageCategories' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', permission: 'viewOrders' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews', permission: 'manageReviews' },
  { icon: Ticket, label: 'Coupons', href: '/admin/coupons', permission: 'manageCoupons' },
  { icon: Zap, label: 'Flash Sales', href: '/admin/flash-sales', permission: 'manageFlashSales' },
  { icon: Image, label: 'Content', href: '/admin/content', permission: 'manageHomepageContent' },
  { icon: Users, label: 'Moderators', href: '/admin/moderators', permission: 'manageModerators' },
  { icon: Settings, label: 'Settings', href: '/admin/settings', permission: 'manageSettings' },
]

export default function AdminLayout() {
  const { adminUser, hasPermission } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  if (adminUser?.isSynthesized) {
    const payload = JSON.stringify({
      uid: adminUser.uid,
      email: adminUser.email,
      name: "Super Admin",
      role: "super_admin",
      active: true
    }, null, 2)

    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-luxury-lg border border-red-100 p-8 space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <AlertOctagon className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-serif font-bold text-red-900">CRITICAL SETUP REQUIRED</h1>
              <p className="text-red-700">Firestore is blocking your write access because your Admin Document does not exist in the live database.</p>
            </div>
          </div>
          
          <div className="space-y-4 text-slate-700">
            <p>Because you are the very first user, your Firestore Rules are completely locked down. To fix this, you must manually create your user document in the Firebase Console.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-slate-900 mb-2">Step-by-Step Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Open the <strong>Firebase Console</strong> and go to the <strong>Firestore Database</strong>.</li>
                <li>Click <strong>Start Collection</strong> and name it exactly: <code className="bg-slate-200 px-1 rounded text-red-600">admins</code></li>
                <li>For the <strong>Document ID</strong>, paste your exact UID: <code className="bg-slate-200 px-1 rounded text-red-600">{adminUser.uid}</code></li>
                <li>Add the fields below exactly as shown. (You can also copy the JSON below and use the "Edit as JSON" feature if your browser extension supports it, or just add them manually.)</li>
                <li>Click <strong>Save</strong>.</li>
                <li>Refresh this page.</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto">
                {payload}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(payload)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                {copied ? <span className="text-xs">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button onClick={handleSignOut} className="btn-luxury w-full flex justify-center items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    )
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.permission === null || hasPermission(item.permission as never)
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-luxury flex items-center justify-center">
            <span className="font-display text-white text-sm font-bold">P</span>
          </div>
          <div>
            <p className="font-serif text-base font-semibold text-[var(--text-primary)]">PUSPALOY</p>
            <p className="font-sans text-xs text-[var(--color-gold)] capitalize">{adminUser?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map(({ icon: Icon, label, href }) => (
          <NavLink
            key={href}
            to={href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-luxury text-sm font-sans font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-luxury text-white shadow-gold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-rose)]'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin info + sign out */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-rose flex items-center justify-center">
            <span className="font-sans text-xs font-bold text-white">
              {adminUser?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-sans text-sm font-medium text-[var(--text-primary)] truncate">{adminUser?.name}</p>
            <p className="font-sans text-xs text-[var(--text-muted)] truncate">{adminUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-luxury text-sm font-sans text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 xl:w-64 border-r border-[var(--border)] fixed inset-y-0 left-0 z-30"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-[var(--border)] lg:hidden"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 xl:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-2 rounded-full"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-lg font-semibold text-[var(--text-primary)]">Admin Panel</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
