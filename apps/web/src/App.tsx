import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { PageSkeleton } from '@/shared/components/PageSkeleton';
import { ErrorBoundary } from '@/shared/components/error-boundary';

// Public pages — small, load eagerly
import SplashPage from '@/pages/splash';
import LoginPage from '@/pages/login';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import OnboardingPage from '@/pages/onboarding';

// Lazy-loaded — only downloaded when the user navigates to that role
const CarrierDashboard = lazy(() => import('@/pages/carrier/dashboard'));
const CarrierLoadsPage = lazy(() => import('@/pages/carrier/loads'));
const CarrierFleetPage = lazy(() => import('@/pages/carrier/fleet'));
const CarrierTeamPage = lazy(() => import('@/pages/carrier/team'));

const BrokerDashboard = lazy(() => import('@/pages/broker/dashboard'));
const BrokerLoadsPage = lazy(() => import('@/pages/broker/loads'));

const DriverDashboard = lazy(() => import('@/pages/driver/dashboard'));
const DriverLoadsPage = lazy(() => import('@/pages/driver/loads'));

const TrackingPage = lazy(() => import('@/pages/tracking'));
const MessagesPage = lazy(() => import('@/pages/messages'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const HelpCenterPage = lazy(() => import('@/pages/profile/help-center'));
const NotificationsPage = lazy(() => import('@/pages/profile/notifications'));
const DocumentsPage = lazy(() => import('@/pages/profile/documents'));
const PrivacyPage = lazy(() => import('@/pages/legal/privacy'));
const TermsPage = lazy(() => import('@/pages/legal/terms'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AuditLogPage = lazy(() => import('@/pages/admin/audit-log'));
const TeamPage = lazy(() => import('@/pages/profile/team'));
const NotFound = lazy(() => import('@/pages/not-found'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/invite/:token" element={<OnboardingPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Carrier */}
          <Route
            path="/carrier"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrier/loads"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierLoadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrier/fleet"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierFleetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrier/team"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierTeamPage />
              </ProtectedRoute>
            }
          />

          {/* Broker */}
          <Route path="/broker/post" element={<Navigate to="/broker/loads" replace />} />
          <Route
            path="/broker"
            element={
              <ProtectedRoute requiredRole="broker">
                <BrokerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker/loads"
            element={
              <ProtectedRoute requiredRole="broker">
                <BrokerLoadsPage />
              </ProtectedRoute>
            }
          />

          {/* Shipper → Driver redirects */}
          <Route path="/shipper" element={<Navigate to="/driver" replace />} />
          <Route path="/shipper/*" element={<Navigate to="/driver" replace />} />

          {/* Driver */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/loads"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverLoadsPage />
              </ProtectedRoute>
            }
          />

          {/* Shared */}
          <Route
            path="/track/:loadId?"
            element={
              <ProtectedRoute>
                <TrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/help"
            element={
              <ProtectedRoute>
                <HelpCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute requiredRole="admin">
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Profile sub-pages */}
          <Route
            path="/profile/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
