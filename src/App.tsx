import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'
import DashboardLayout from '@/components/DashboardLayout'
import AdminLayout from '@/components/AdminLayout'

// User Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignUpPage from '@/pages/SignUpPage'
import BrowseCarsPage from '@/pages/BrowseCarsPage'
import CarDetailPage from '@/pages/CarDetailPage'
import MyBookingsPage from '@/pages/MyBookingsPage'
import VerificationPage from '@/pages/VerificationPage'
import ProfilePage from '@/pages/ProfilePage'
import MyVehiclesPage from '@/pages/MyVehiclesPage'
import ListerBookingsPage from '@/pages/ListerBookingsPage'
import NotificationsPage from '@/pages/NotificationsPage'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminCarCatalogPage from '@/pages/admin/AdminCarCatalogPage'
import AdminVehicleApprovalPage from '@/pages/admin/AdminVehicleApprovalPage'
import AdminAuditTrailPage from '@/pages/admin/AdminAuditTrailPage'
import AdminPayoutsPage from '@/pages/admin/AdminPayoutsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/browse" element={<BrowseCarsPage />} />
                  <Route path="/cars/:id" element={<CarDetailPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/verify" element={<VerificationPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/my-vehicles" element={<MyVehiclesPage />} />
                  <Route path="/lister-bookings" element={<ListerBookingsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/car-catalog" element={<AdminCarCatalogPage />} />
                    <Route path="/admin/vehicle-approval" element={<AdminVehicleApprovalPage />} />
                    <Route path="/admin/audit-trail" element={<AdminAuditTrailPage />} />
                    <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
