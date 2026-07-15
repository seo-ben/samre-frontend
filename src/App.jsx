import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { UsersPage } from './pages/Users'
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
import { PendingBadges } from './pages/PendingBadges'
import { VerifiedProfiles } from './pages/VerifiedProfiles'
import { AdPages } from './pages/AdPages'
import { SystemSettings } from './pages/SystemSettings'
import { SuggestedLocationsPage } from './pages/SuggestedLocations'
import { WalletsPage } from './pages/Payments/Wallets'
import { TransactionsPage } from './pages/Payments/Transactions'
import ProtectedRoute from './components/ProtectedRoute'

// ─── Guard partagé ─────────────────────────────────────────────────────────────
const Protected = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
)

function App() {
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/" element={<Login />} />

      {/* ── Dashboard ─────────────────────────── */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

      {/* ── Utilisateurs ──────────────────────── */}
      <Route path="/users"             element={<Protected><UsersPage /></Protected>} />

      {/* ── Offres ────────────────────────────── */}
      <Route path="/offers"            element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/pending"    element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/approved"   element={<Protected><OffersPage /></Protected>} />
      <Route path="/offers/expired"    element={<Protected><OffersPage /></Protected>} />

      {/* ── Événements ────────────────────────── */}
      <Route path="/events"            element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/pending"    element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/approved"   element={<Protected><EventsPage /></Protected>} />
      <Route path="/events/categories" element={<Protected><EventCategoriesPage /></Protected>} />

      {/* ── Candidatures ──────────────────────── */}
      <Route path="/applications"            element={<Protected><ApplicationsPage /></Protected>} />
      <Route path="/applications/by-status"  element={<Protected><ApplicationsPage /></Protected>} />
      <Route path="/applications/by-offer"   element={<Protected><ApplicationsPage /></Protected>} />

      {/* ── Badges ────────────────────────────── */}
      <Route path="/badges/pending"    element={<Protected><PendingBadges /></Protected>} />
      <Route path="/badges/candidates" element={<Protected><VerifiedProfiles userType="candidate" /></Protected>} />
      <Route path="/badges/companies"  element={<Protected><VerifiedProfiles userType="company" /></Protected>} />

      {/* ── Paiements ─────────────────────────── */}
      <Route path="/payments/transactions" element={<Protected><TransactionsPage /></Protected>} />
      <Route path="/payments/wallets"      element={<Protected><WalletsPage /></Protected>} />
      <Route path="/payments/revenue"      element={<Protected><ComingSoon title="Revenus" /></Protected>} />
      <Route path="/payments/conversion"   element={<Protected><ComingSoon title="Taux de conversion" /></Protected>} />

      {/* ── Abonnements ───────────────────────── */}
      <Route path="/subscriptions/plans"   element={<Protected><SubscriptionPlansPage /></Protected>} />
      <Route path="/subscriptions/active"  element={<Protected><ActiveSubscriptionsPage /></Protected>} />
      <Route path="/subscriptions/history" element={<Protected><SubscriptionHistoryPage /></Protected>} />

      {/* ── Notifications ─────────────────────── */}
      <Route path="/notifications/send"    element={<Protected><ComingSoon title="Envoyer une notification" /></Protected>} />
      <Route path="/notifications/history" element={<Protected><ComingSoon title="Historique notifications" /></Protected>} />
      <Route path="/notifications/target"  element={<Protected><ComingSoon title="Ciblage notifications" /></Protected>} />

      {/* ── CMS & Contenu ───────────────────────── */}
      <Route path="/cms/ads"          element={<Protected><AdPages /></Protected>} />
      <Route path="/cms/pages"        element={<Protected><ComingSoon title="Pages dynamiques" /></Protected>} />
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

      {/* ── Statistiques ──────────────────────── */}
      <Route path="/stats/users"        element={<Protected><ComingSoon title="Stats utilisateurs" /></Protected>} />
      <Route path="/stats/companies"    element={<Protected><ComingSoon title="Stats entreprises" /></Protected>} />
      <Route path="/stats/offers"       element={<Protected><ComingSoon title="Stats offres" /></Protected>} />
      <Route path="/stats/applications" element={<Protected><ComingSoon title="Stats candidatures" /></Protected>} />
      <Route path="/stats/events"       element={<Protected><ComingSoon title="Stats événements" /></Protected>} />
      <Route path="/stats/revenue"      element={<Protected><ComingSoon title="Stats revenus" /></Protected>} />
      <Route path="/stats/exports"      element={<Protected><ComingSoon title="Exports de rapports" /></Protected>} />

      {/* ── Paramètres ────────────────────────── */}
      <Route path="/settings/language" element={<Protected><ComingSoon title="Langue du panel" /></Protected>} />
      <Route path="/settings/system"   element={<Protected><SystemSettings /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
