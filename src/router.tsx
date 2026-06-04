// src/router.tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import AdminLayout from '@/admin/AdminLayout'
import AdminRoute from '@/components/auth/AdminRoute'
import PermissionRoute from '@/components/auth/PermissionRoute'
import PageLoader from '@/components/shared/PageLoader'

// ── Public pages (lazy loaded) ───────────────────────────
const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// ── Admin pages (lazy loaded, auth-gated) ───────────────
const AdminLogin = lazy(() => import('@/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('@/admin/pages/Dashboard'))
const AdminProducts = lazy(() => import('@/admin/pages/Products/ProductList'))
const AdminProductForm = lazy(() => import('@/admin/pages/Products/ProductForm'))
const AdminCategories = lazy(() => import('@/admin/pages/Categories'))
const AdminOrders = lazy(() => import('@/admin/pages/Orders'))
const AdminReviews = lazy(() => import('@/admin/pages/Reviews'))
const AdminCoupons = lazy(() => import('@/admin/pages/Coupons'))
const AdminFlashSales = lazy(() => import('@/admin/pages/FlashSales'))
const AdminContent = lazy(() => import('@/admin/pages/Content'))
const AdminModerators = lazy(() => import('@/admin/pages/Moderators'))
const AdminSettings = lazy(() => import('@/admin/pages/Settings'))

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes ─────────────────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Admin Login (no layout) ──────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin Routes (auth gated) ────────────────── */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route
            path="products"
            element={
              <PermissionRoute permission="addProducts">
                <AdminProducts />
              </PermissionRoute>
            }
          />
          <Route
            path="products/new"
            element={
              <PermissionRoute permission="addProducts">
                <AdminProductForm />
              </PermissionRoute>
            }
          />
          <Route
            path="products/edit/:id"
            element={
              <PermissionRoute permission="editProducts">
                <AdminProductForm />
              </PermissionRoute>
            }
          />

          <Route
            path="categories"
            element={
              <PermissionRoute permission="manageCategories">
                <AdminCategories />
              </PermissionRoute>
            }
          />

          <Route
            path="orders"
            element={
              <PermissionRoute permission="viewOrders">
                <AdminOrders />
              </PermissionRoute>
            }
          />

          <Route
            path="reviews"
            element={
              <PermissionRoute permission="manageReviews">
                <AdminReviews />
              </PermissionRoute>
            }
          />

          <Route
            path="coupons"
            element={
              <PermissionRoute permission="manageCoupons">
                <AdminCoupons />
              </PermissionRoute>
            }
          />

          <Route
            path="flash-sales"
            element={
              <PermissionRoute permission="manageFlashSales">
                <AdminFlashSales />
              </PermissionRoute>
            }
          />

          <Route
            path="content"
            element={
              <PermissionRoute permission="manageHomepageContent">
                <AdminContent />
              </PermissionRoute>
            }
          />

          {/* Super Admin only routes */}
          <Route
            path="moderators"
            element={
              <PermissionRoute permission="manageModerators">
                <AdminModerators />
              </PermissionRoute>
            }
          />

          <Route
            path="settings"
            element={
              <PermissionRoute permission="manageSettings">
                <AdminSettings />
              </PermissionRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
