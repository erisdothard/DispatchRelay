import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { PageSkeleton } from '@/shared/components/PageSkeleton';
import { ErrorBoundary } from '@/shared/components/error-boundary';

// Auto-retry lazy imports once on chunk-load failure (stale deploy cache)
function lazyRetry(fn: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    fn().catch(() => {
      window.location.reload();
      return new Promise<{ default: ComponentType }>(() => {});
    }),
  );
}

// Public pages — small, load eagerly
import SplashPage from '@/pages/splash';
import LoginPage from '@/pages/login';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import OnboardingPage from '@/pages/onboarding';

// Lazy-loaded — only downloaded when the user navigates to that role
const CarrierDashboard = lazyRetry(() => import('@/pages/carrier/dashboard'));
const CarrierLoadsPage = lazyRetry(() => import('@/pages/carrier/loads'));
const CarrierFleetPage = lazyRetry(() => import('@/pages/carrier/fleet'));
const CarrierTeamPage = lazyRetry(() => import('@/pages/carrier/team'));
const CarrierTeamSettingsPage = lazyRetry(() => import('@/pages/carrier/team-settings'));

const BrokerDashboard = lazyRetry(() => import('@/pages/broker/dashboard'));
const BrokerLoadsPage = lazyRetry(() => import('@/pages/broker/loads'));

const DriverDashboard = lazyRetry(() => import('@/pages/driver/dashboard'));
const DriverLoadsPage = lazyRetry(() => import('@/pages/driver/loads'));
const DriverDocumentsPage = lazyRetry(() => import('@/pages/driver/documents'));
const DriverTeamPage = lazyRetry(() => import('@/pages/driver/team'));
const DriverTireLogPage = lazyRetry(() => import('@/pages/driver/tire-log'));
const DriverReceiptsPage = lazyRetry(() => import('@/pages/driver/receipts'));
const DriverExpensesPage = lazyRetry(() => import('@/pages/driver/expenses'));

const TrackingPage = lazyRetry(() => import('@/pages/tracking'));
const PublicTrackingPage = lazyRetry(() => import('@/pages/public-tracking'));
const MessagesPage = lazyRetry(() => import('@/pages/messages'));
const ProfilePage = lazyRetry(() => import('@/pages/profile'));
const HelpCenterPage = lazyRetry(() => import('@/pages/profile/help-center'));
const NotificationsPage = lazyRetry(() => import('@/pages/profile/notifications'));
const DocumentsPage = lazyRetry(() => import('@/pages/profile/documents'));
const PrivacyPage = lazyRetry(() => import('@/pages/legal/privacy'));
const TermsPage = lazyRetry(() => import('@/pages/legal/terms'));
const AdminDashboard = lazyRetry(() => import('@/pages/admin/dashboard'));
const AuditLogPage = lazyRetry(() => import('@/pages/admin/audit-log'));
const LaneIntelligencePage = lazyRetry(() => import('@/pages/lane-intelligence'));
const CarrierPaymentsPage = lazyRetry(() => import('@/pages/carrier-payments'));
const NotificationHealthPage = lazyRetry(() => import('@/pages/admin/notification-health'));
const NotFound = lazyRetry(() => import('@/pages/not-found'));

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
          <Route path="/t/:token" element={<PublicTrackingPage />} />

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
              <ProtectedRoute requiredRole={['carrier', 'broker']}>
                <CarrierFleetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrier/team"
            element={
              <ProtectedRoute requiredRole={['carrier', 'broker']}>
                <CarrierTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carrier/team-settings"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierTeamSettingsPage />
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
          <Route
            path="/driver/documents"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/team"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/tire-log"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverTireLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/receipts"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverReceiptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/expenses"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverExpensesPage />
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

          {/* Lane Intelligence — carrier + broker */}
          <Route
            path="/lane-intelligence"
            element={
              <ProtectedRoute>
                <LaneIntelligencePage />
              </ProtectedRoute>
            }
          />

          {/* Carrier Payments */}
          <Route
            path="/carrier/payments"
            element={
              <ProtectedRoute requiredRole="carrier">
                <CarrierPaymentsPage />
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
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requiredRole="admin">
                <NotificationHealthPage />
              </ProtectedRoute>
            }
          />

          {/* Profile sub-pages */}

          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
