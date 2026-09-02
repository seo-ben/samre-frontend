import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { UsersPage } from './pages/Users'
import { CompanyManagement } from './pages/CompanyManagement'
import { LocationsPage } from './pages/Locations'
import { LanguagesPage } from './pages/Languages'
import { StaticContentsPage } from './pages/StaticContents'
import { CategoriesPage } from './pages/Categories'
import { QuotasPage } from './pages/Quotas'
import { BlurFieldsPage } from './pages/BlurFields'
import { SubscriptionPlansPage } from './pages/SubscriptionPlans'
import { ActiveSubscriptionsPage } from './pages/ActiveSubscriptions'
import { SubscriptionHistoryPage } from './pages/SubscriptionHistory'
import { ComingSoon } from './pages/ComingSoon'
import { OffersPage } from './pages/Offers'
import { EventsPage } from './pages/Events'
import { EventCategoriesPage } from './pages/EventCategories'
import { ApplicationsPage } from './pages/Applications'
import { HiringDeclarationsPage } from './pages/HiringDeclarations'
import ModerationReportsPage from './pages/ModerationReports'
import { PendingBadges } from './pages/PendingBadges'
import { VerifiedProfiles } from './pages/VerifiedProfiles'
import { AdPages } from './pages/AdPages'
import { CompanyBanners } from './pages/CompanyBanners'
import { SystemSettings } from './pages/SystemSettings'
import { FinanceDashboard } from './pages/Payments/FinanceDashboard'
import { WalletsPage } from './pages/Payments/Wallets'
import { TransactionsPage } from './pages/Payments/Transactions'
import { SpecialRequestsPage } from './pages/SpecialRequests'
import { SurveysManagementPage } from './pages/SurveysManagement'
import { ServiceExchangesManagement } from './pages/ServiceExchangesManagement'
import { SuggestedLocationsPage } from './pages/SuggestedLocations'
import ProtectedRoute from './components/ProtectedRoute'

import { SubscriptionControlCenterPage } from './pages/SubscriptionControlCenter'
import { AuditLogsPage } from './pages/AuditLogs'
import { NotificationsCenter } from './pages/NotificationsCenter'
import { AnalyticsPage } from './pages/Analytics'
import { StaffManagementPage } from './pages/StaffManagement'
import { AdminProfilePage } from './pages/AdminProfile'
import { AdminPasswordPage } from './pages/AdminPassword'
import { DynamicPagesManagementPage } from './pages/DynamicPagesManagement'
import { PublicPageViewer } from './pages/PublicPageViewer'

// ─── Guard partagé ─────────────────────────────────────────────────────────────
const Protected = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
)

function App() {
  return (
    <Routes>
      {/* ── Pages Publiques Légales & Institutionnelles (Accessibles sans login) ── */}
      <Route path="/" element={<Login />} />
      <Route path="/p/:slug" element={<PublicPageViewer />} />
      <Route path="/cgu" element={<PublicPageViewer forcedSlug="cgu" />} />
      <Route path="/privacy" element={<PublicPageViewer forcedSlug="privacy-policy" />} />
      <Route path="/politique-de-confidentialite" element={<PublicPageViewer forcedSlug="privacy-policy" />} />
      <Route path="/mentions-legales" element={<PublicPageViewer forcedSlug="mentions-legales" />} />
      <Route path="/a-propos" element={<PublicPageViewer forcedSlug="about-us" />} />

      {/* ── Dashboard ─────────────────────────── */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

      {/* ── Journal d'Audit & Logs ──────────────── */}
      <Route path="/audit-logs" element={<Protected><AuditLogsPage /></Protected>} />
      <Route path="/logs"       element={<Protected><AuditLogsPage /></Protected>} />

      {/* ── Utilisateurs & Entreprises ──────────────────────── */}
      <Route path="/users"             element={<Protected><UsersPage /></Protected>} />
      <Route path="/companies"         element={<Protected><CompanyManagement /></Protected>} />

      {/* ── Offres ────────────────────────────── */}
      <Route path="/offers"            element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/pending"    element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/approved"   element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/expired"    element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/deleted"    element={<Protected><OffersPage /></Protected>} />

      {/* ── Événements ────────────────────────── */}
      <Route path="/events"            element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/pending"    element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/approved"   element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/expired"    element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/deleted"    element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/categories" element={<Protected><EventCategoriesPage /></Protected>} />

      {/* ── Candidatures & Déclarations d'embauche ──────────────── */}
      <Route path="/applications"            element={<Protected><ApplicationsPage /></Protected>} />
      <Route path="/applications/by-status"  element={<Protected><ApplicationsPage /></Protected>} />
      <Route path="/applications/by-offer"   element={<Protected><ApplicationsPage /></Protected>} />
      <Route path="/hiring-declarations"     element={<Protected><HiringDeclarationsPage /></Protected>} />
      <Route path="/declarations-embauche"   element={<Protected><HiringDeclarationsPage /></Protected>} />

      {/* ── Badges ────────────────────────────── */}
      <Route path="/badges/pending"    element={<Protected><PendingBadges /></Protected>} />
      <Route path="/badges/candidates" element={<Protected><VerifiedProfiles userType="candidate" /></Protected>} />
      <Route path="/badges/companies"  element={<Protected><VerifiedProfiles userType="company" /></Protected>} />

      {/* ── Modération & Signalements ───────────── */}
      <Route path="/moderation/reports" element={<Protected><ModerationReportsPage /></Protected>} />
      <Route path="/signalements"       element={<Protected><ModerationReportsPage /></Protected>} />

      {/* ── Demandes Spéciales ──────────────────── */}
      <Route path="/special-requests"   element={<Protected><SpecialRequestsPage /></Protected>} />
      <Route path="/demandes-speciales" element={<Protected><SpecialRequestsPage /></Protected>} />

      {/* ── Sondages & Enquêtes ─────────────────── */}
      <Route path="/surveys"            element={<Protected><SurveysManagementPage /></Protected>} />
      <Route path="/sondages"           element={<Protected><SurveysManagementPage /></Protected>} />

      {/* ── Partenariats B2B & Inter-Entreprises ─────────────────── */}
      <Route path="/service-exchanges"  element={<Protected><ServiceExchangesManagement /></Protected>} />
      <Route path="/partenariats-b2b"   element={<Protected><ServiceExchangesManagement /></Protected>} />
      <Route path="/partenariats"       element={<Protected><ServiceExchangesManagement /></Protected>} />
      <Route path="/troc-b2b"           element={<Protected><ServiceExchangesManagement /></Protected>} />

      {/* ── Paiements & Finances ─────────────────────────── */}
      <Route path="/finances" element={<Protected><FinanceDashboard /></Protected>} />
      <Route path="/wallets" element={<Protected><WalletsPage /></Protected>} />
      <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
      <Route path="/payments/wallets" element={<Protected><WalletsPage /></Protected>} />
      <Route path="/payments/transactions" element={<Protected><TransactionsPage /></Protected>} />

      {/* ── Abonnements ───────────────────────── */}
      <Route path="/subscriptions/control-center" element={<Protected><SubscriptionControlCenterPage /></Protected>} />
      <Route path="/subscriptions/plans"   element={<Protected><SubscriptionPlansPage /></Protected>} />
      <Route path="/subscriptions/active"  element={<Protected><ActiveSubscriptionsPage /></Protected>} />
      <Route path="/subscriptions/history" element={<Protected><SubscriptionHistoryPage /></Protected>} />

      {/* ── Notifications ─────────────────────── */}
      <Route path="/notifications"         element={<Protected><NotificationsCenter /></Protected>} />
      <Route path="/notifications/send"    element={<Protected><NotificationsCenter /></Protected>} />
      <Route path="/notifications/history" element={<Protected><NotificationsCenter /></Protected>} />
      <Route path="/notifications/target"  element={<Protected><NotificationsCenter /></Protected>} />

      {/* ── CMS & Contenu ───────────────────────── */}
      <Route path="/cms/ads"          element={<Protected><AdPages /></Protected>} />
      <Route path="/cms/company-banners" element={<Protected><CompanyBanners /></Protected>} />
      <Route path="/cms/pages"        element={<Protected><DynamicPagesManagementPage /></Protected>} />
      <Route path="/cms/languages"    element={<Protected><LanguagesPage /></Protected>} />
      <Route path="/cms/translations" element={<Protected><StaticContentsPage /></Protected>} />
      <Route path="/cms/locations"    element={<Protected><LocationsPage /></Protected>} />
      <Route path="/cms/suggested-locations" element={<Protected><SuggestedLocationsPage /></Protected>} />
      <Route path="/cms/categories"   element={<Protected><CategoriesPage /></Protected>} />
      <Route path="/cms/quotas"       element={<Protected><QuotasPage /></Protected>} />
      <Route path="/cms/blur"         element={<Protected><BlurFieldsPage /></Protected>} />

      {/* ── Facturation ───────────────────────── */}
      <Route path="/payments/history"    element={<Protected><ComingSoon title="Historique paiements" /></Protected>} />
      <Route path="/payments/invoices"   element={<Protected><ComingSoon title="Factures" /></Protected>} />
      <Route path="/payments/payouts"    element={<Protected><ComingSoon title="Payouts" /></Protected>} />
      <Route path="/payments/conversion" element={<Protected><ComingSoon title="Taux de conversion" /></Protected>} />

      {/* ── Statistiques & Suite Analytique (Unifiée) ─────────── */}
      <Route path="/stats"             element={<Protected><AnalyticsPage defaultTab="overview" /></Protected>} />
      <Route path="/stats/users"        element={<Protected><AnalyticsPage defaultTab="users" /></Protected>} />
      <Route path="/stats/companies"    element={<Protected><AnalyticsPage defaultTab="users" /></Protected>} />
      <Route path="/stats/offers"       element={<Protected><AnalyticsPage defaultTab="jobs" /></Protected>} />
      <Route path="/stats/applications" element={<Protected><AnalyticsPage defaultTab="jobs" /></Protected>} />
      <Route path="/stats/events"       element={<Protected><AnalyticsPage defaultTab="events" /></Protected>} />
      <Route path="/stats/revenue"      element={<Protected><AnalyticsPage defaultTab="revenue" /></Protected>} />
      <Route path="/stats/exports"      element={<Protected><AnalyticsPage defaultTab="exports" /></Protected>} />

      {/* ── Paramètres ────────────────────────── */}
      <Route path="/settings/staff"    element={<Protected><StaffManagementPage /></Protected>} />
      <Route path="/settings/profile"  element={<Protected><AdminProfilePage /></Protected>} />
      <Route path="/settings/password" element={<Protected><AdminPasswordPage /></Protected>} />
      <Route path="/settings/system"   element={<Protected><SystemSettings /></Protected>} />
      <Route path="/settings/language" element={<Protected><ComingSoon title="Langue du panel" /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
