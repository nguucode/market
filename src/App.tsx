// Routes mirror spec/ia/sitemap.yaml; each screen lives in its Epic's folder.
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Shell } from '@/app/Shell'
import { GridSkeleton } from '@/components/ui'
import { ErrorBoundary } from '@/features/demo/ErrorBoundary'
import NotFound from '@/features/demo/NotFound'

const HomePage = lazy(() => import('@/features/hom/HomePage'))
const CategoriesPage = lazy(() => import('@/features/dsc/CategoriesPage'))
const CategoryPage = lazy(() => import('@/features/dsc/CategoryPage'))
const SearchPage = lazy(() => import('@/features/dsc/SearchPage'))
const ProductPage = lazy(() => import('@/features/pdp/ProductPage'))
const ReviewsPage = lazy(() => import('@/features/pdp/ReviewsPage'))
const ShopPage = lazy(() => import('@/features/shp/ShopPage'))
const CartPage = lazy(() => import('@/features/crt/CartPage'))
const CheckoutPage = lazy(() => import('@/features/chk/CheckoutPage'))
const PaymentPage = lazy(() => import('@/features/chk/PaymentPage'))
const ResultPage = lazy(() => import('@/features/chk/ResultPage'))
const OrdersPage = lazy(() => import('@/features/ord/OrdersPage'))
const OrderPage = lazy(() => import('@/features/ord/OrderPage'))
const ReturnFlow = lazy(() => import('@/features/ret/ReturnFlow'))
const InvoicePage = lazy(() => import('@/features/ord/InvoicePage'))
const ReturnPage = lazy(() => import('@/features/ret/ReturnPage'))
const ReviewFlow = lazy(() => import('@/features/rev/ReviewFlow'))
const FlashSalePage = lazy(() => import('@/features/prm/FlashSalePage'))
const VouchersPage = lazy(() => import('@/features/prm/VouchersPage'))
const MePage = lazy(() => import('@/features/acc/MePage'))
const AddressesPage = lazy(() => import('@/features/acc/AddressesPage'))
const FavoritesPage = lazy(() => import('@/features/acc/FavoritesPage'))
const NotificationsPage = lazy(() => import('@/features/ntf/NotificationsPage'))
const PolicyPage = lazy(() => import('@/features/fnd/PolicyPage'))
const DevicePage = lazy(() => import('@/features/demo/DevicePage'))

export default function App() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 pt-24 lg:px-8"><GridSkeleton n={10} /></div>}>
        <Routes>
          <Route path="device" element={<DevicePage />} />
          <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="c/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="p/:slug" element={<ProductPage />} />
          <Route path="p/:slug/reviews" element={<ReviewsPage />} />
          <Route path="s/:handle" element={<ShopPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/pay/:paymentId" element={<PaymentPage />} />
          <Route path="checkout/result/:paymentId" element={<ResultPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderPage />} />
          <Route path="orders/:id/return" element={<ReturnFlow />} />
          <Route path="orders/:id/invoice" element={<InvoicePage />} />
          <Route path="returns/:id" element={<ReturnPage />} />
          <Route path="orders/:id/review" element={<ReviewFlow />} />
          <Route path="flash-sale" element={<FlashSalePage />} />
          <Route path="vouchers" element={<VouchersPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="me/addresses" element={<AddressesPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="policies/:slug" element={<PolicyPage />} />
          <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
