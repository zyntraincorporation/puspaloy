// src/admin/AdminLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/firebase/auth'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Star,
  Ticket, Zap, Image, Users, Settings, LogOut, Menu, X
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
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
