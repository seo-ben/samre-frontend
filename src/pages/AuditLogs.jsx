import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, History, Search, RefreshCw, Filter, 
  LogIn, UserCheck, Building2, Briefcase, FileText, 
  Wallet, CalendarDays, Eye, X, ChevronLeft, ChevronRight, 
  Globe, Laptop, Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';

// Formatage de la date en français
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Obtenir le label clair, convivial et la couleur selon l'action
const getActionMeta = (action) => {
  if (!action) return { label: 'Action Système', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };

  // Notifications Push & Alertes
  if (action === 'notification.campaign_created' || action.startsWith('notification.created')) {
    return { label: '📢 Diffusion Notification Push', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }
  if (action === 'notification.campaign_scheduled' || action.startsWith('notification.scheduled')) {
    return { label: '⏰ Programmation Notification Push', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }
  if (action === 'notification.campaign_cancelled' || action.startsWith('notification.cancelled')) {
    return { label: '✕ Annulation Notification', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
  }
  if (action === 'notification.campaign_updated' || action.startsWith('notification.updated')) {
    return { label: '✏️ Modification Notification', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };
  }
  if (action === 'notification.campaign_resent' || action.startsWith('notification.resent')) {
    return { label: '🔄 Renvoi Notification Push', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' };
  }
  if (action === 'notification.campaign_dispatched' || action.startsWith('notification.dispatched')) {
    return { label: '🚀 Envoi Automatique Push', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }
  if (action.startsWith('notification.')) {
    return { label: '🔔 Notification Push', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }

  // IA
  if (action.startsWith('ai.cv_enhancement') || action.startsWith('ai.cv')) {
    return { label: '✨ Optimisation de CV par IA', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }
  if (action.startsWith('ai.cover_letter')) {
    return { label: '✨ Lettre de Motivation par IA', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }
  if (action.startsWith('ai.')) {
    return { label: '✨ Traitement IA', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }

  // Sécurité & Alertes Intrusions
  if (action === 'auth.account_locked_temporary') {
    return { label: '🛑 Compte Verrouillé (5 Échecs)', bg: '#FEF2F2', color: '#991B1B', border: '#EF4444' };
  }
  if (action === 'auth.otp_failed') {
    return { label: '⚠️ Échec Code OTP', bg: '#FFFBEB', color: '#B45309', border: '#F59E0B' };
  }
  if (action === 'auth.admin_login_failed') {
    return { label: '🚨 Échec Connexion Admin (Identifiants faux)', bg: '#FEF2F2', color: '#DC2626', border: '#F87171' };
  }
  if (action.includes('remoderation_required')) {
    return { label: '⏳ Contenu Modifié (Re-modération Requise)', bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' };
  }

  // Candidats & Confidentialité
  if (action === 'candidate.profile_viewed') {
    return { label: '👁️ Consultation Profil Candidat', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };
  }
  if (action === 'candidate.profile_unlocked') {
    return { label: '🔓 Déblocage Profil Candidat', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
  }
  if (action === 'candidate.profile_updated') {
    return { label: '✏️ Profil Candidat Mis à Jour', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  }
  if (action === 'candidate.photo_updated') {
    return { label: '📷 Photo Candidat Modifiée', bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' };
  }
  if (action === 'application.viewed_by_company') {
    return { label: '📋 Candidature Ouverte par Entreprise', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
  }
  if (action === 'company.profile_updated') {
    return { label: '🏢 Profil Entreprise Mis à Jour', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4' };
  }
  if (action === 'company.logo_updated') {
    return { label: '🖼️ Logo Entreprise Modifié', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4' };
  }
  if (action === 'event.updated') {
    return { label: '📅 Modification d\'Événement', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' };
  }
  if (action === 'event.deleted') {
    return { label: '🗑️ Suppression d\'Événement', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }

  // Authentification
  if (action.startsWith('auth.admin_login')) {
    return { label: '🔐 Connexion Administration', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }
  if (action.startsWith('auth.admin_logout')) {
    return { label: '🚪 Déconnexion Administration', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  }
  if (action.startsWith('auth.login')) {
    return { label: '🔐 Connexion Compte', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }
  if (action.startsWith('auth.logout')) {
    return { label: '🚪 Déconnexion Compte', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  }
  if (action.startsWith('auth.register')) {
    return { label: '👤 Création de Compte', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }

  // Paiements & Portefeuille
  if (action.startsWith('wallet.credit')) {
    return { label: '💳 Rechargement Portefeuille', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }
  if (action.startsWith('wallet.debit')) {
    return { label: '💳 Débit / Paiement Portefeuille', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }
  if (action.startsWith('subscription.purchased') || action.startsWith('subscription.')) {
    return { label: '⭐ Souscription Abonnement', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }

  // Offres
  if (action.startsWith('offer.created')) {
    return { label: '💼 Publication d\'Offre', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' };
  }
  if (action.startsWith('offer.updated')) {
    return { label: '💼 Modification d\'Offre', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' };
  }
  if (action.startsWith('offer.validated')) {
    return { label: '✅ Validation d\'Offre', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
  }
  if (action.startsWith('offer.rejected')) {
    return { label: '❌ Rejet d\'Offre', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
  }
  if (action.startsWith('offer.deleted')) {
    return { label: '🗑️ Suppression d\'Offre', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }
  if (action.startsWith('offer.status_changed')) {
    return { label: '🔄 Statut d\'Offre Modifié', bg: '#FDF4FF', color: '#86198F', border: '#F5D0FE' };
  }

  // Candidatures & Embauches
  if (action.startsWith('application.submitted')) {
    return { label: '📄 Dépôt de Candidature', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }
  if (action.startsWith('application.status_changed') || action.startsWith('admin.application_status_changed')) {
    return { label: '📋 Suivi de Candidature', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
  }
  if (action.startsWith('hiring.status_changed')) {
    return { label: '🤝 Déclaration d\'Embauche', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
  }
  if (action.startsWith('hiring.payment_decision')) {
    return { label: '💰 Prime d\'Embauche', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }

  // Événements
  if (action.startsWith('event.created')) {
    return { label: '📅 Création d\'Événement', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' };
  }
  if (action.startsWith('event.participated')) {
    return { label: '🎟️ Inscription à un Événement', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  }
  if (action.startsWith('event.participation_cancelled')) {
    return { label: '✕ Désinscription Événement', bg: '#F8FAFC', color: '#64748B', border: '#CBD5E1' };
  }

  // Sondages
  if (action.startsWith('survey.voted')) {
    return { label: '🗳️ Vote à un Sondage', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }
  if (action.startsWith('survey.created')) {
    return { label: '📊 Création de Sondage', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };
  }

  // Badges & Vérifications
  if (action.startsWith('badge.approved')) {
    return { label: '🏅 Attribution Badge Vérifié', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }
  if (action.startsWith('badge.rejected')) {
    return { label: '❌ Rejet Demande de Badge', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' };
  }

  // Signalements & Modération
  if (action.startsWith('report.content_banned')) {
    return { label: '🛡️ Contenu Banni par Modération', bg: '#FEF2F2', color: '#991B1B', border: '#F87171' };
  }
  if (action.startsWith('report.dismissed')) {
    return { label: '🛡️ Signalement Classé sans suite', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
  }

  // Partenariats B2B / Troc
  if (action.startsWith('service_exchange.status_changed')) {
    return { label: '🔄 Statut Troc B2B Modifié', bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' };
  }
  if (action.startsWith('service_exchange.deleted')) {
    return { label: '🗑️ Suppression Troc B2B', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }

  // Entreprises
  if (action.startsWith('company.viability')) {
    return { label: '🏢 Test Viabilité Entreprise', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }
  if (action.startsWith('company.international')) {
    return { label: '🌍 Analyse Droit International', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
  }

  // Admin & Demandes spéciales
  if (action.startsWith('special_request.status_changed')) {
    return { label: '⚡ Traitement Demande Spéciale', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }
  if (action.startsWith('admin.user_suspended')) {
    return { label: '🚫 Suspension d\'Utilisateur', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' };
  }
  if (action.startsWith('admin.user_reactivated')) {
    return { label: '✅ Réactivation d\'Utilisateur', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' };
  }

  // Fallback propre en français sans points ni underscores
  const cleanLabel = action
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return { label: cleanLabel, bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' };
};

// Obtenir le label clair du rôle utilisateur (sans codes bruts)
const getRoleBadge = (userType) => {
  switch (userType) {
    case 'admin_staff':
      return { label: 'Équipe Administration', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
    case 'company':
      return { label: 'Entreprise', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'candidate':
      return { label: 'Secrétaire (Candidat)', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    case 'visitor':
      return { label: 'Visiteur', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    default:
      return { label: userType ? String(userType).replace(/_/g, ' ') : 'Système Automatique', bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  }
};

// Obtenir le libellé clair de la cible / ressource (sans identifiants bruts)
const formatTargetModel = (modelType, modelId, action) => {
  if (!modelType) {
    if (action?.startsWith('notification.')) return 'Campagne de notification push';
    if (action?.startsWith('wallet.')) return 'Portefeuille & Transactions';
    if (action?.startsWith('subscription.')) return 'Abonnement utilisateur';
    if (action?.startsWith('ai.')) return 'Module IA';
    if (action?.startsWith('auth.')) return 'Session & Sécurité';
    if (action?.startsWith('event.')) return 'Événement & Formation';
    if (action?.startsWith('survey.')) return 'Sondage d\'opinion';
    return 'Système global';
  }

  const clean = modelType.split('\\').pop();
  switch (clean) {
    case 'NotificationCampaign':
      return 'Campagne de notification push';
    case 'User':
      return 'Compte utilisateur';
    case 'JobOffer':
      return 'Offre d\'emploi';
    case 'Application':
      return 'Candidature à une offre';
    case 'HiringDeclaration':
      return 'Déclaration d\'embauche';
    case 'Wallet':
    case 'WalletTransaction':
      return 'Portefeuille virtuel';
    case 'Subscription':
    case 'SubscriptionPlan':
      return 'Plan d\'abonnement';
    case 'Event':
    case 'EventParticipant':
      return 'Événement & Formation';
    case 'Survey':
    case 'SurveyVote':
      return 'Sondage d\'opinion';
    case 'VerificationRequest':
      return 'Demande de badge vérifié';
    case 'Report':
      return 'Signalement & Modération';
    case 'ServiceExchange':
      return 'Troc & Partenariat B2B';
    case 'SpecialRequest':
      return 'Demande spéciale admin';
    case 'AiCvEnhancement':
      return 'CV amélioré par IA';
    case 'Company':
      return 'Fiche entreprise';
    default:
      return clean.replace(/([A-Z])/g, ' $1').trim();
  }
};

// Parser le navigateur / appareil de manière conviviale
const formatUserAgent = (ua) => {
  if (!ua) return 'Navigateur Web';
  if (ua.includes('iPhone') || ua.includes('iPad')) return '📱 iPhone / iPad (iOS)';
  if (ua.includes('Android')) return '📱 Smartphone Android';
  if (ua.includes('Dart') || ua.includes('Flutter')) return '📱 Application Mobile SAMRE';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return '💻 Ordinateur (Mac)';
  if (ua.includes('Windows')) return '💻 Ordinateur (Windows)';
  if (ua.includes('Linux')) return '💻 Ordinateur (Linux)';
  return '🌐 Navigateur Web';
};

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 25 });
  const [stats, setStats] = useState({ total_logs: 0, logs_today: 0, logins_today: 0, admin_actions_today: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [userType, setUserType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  // Modale de détail
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get('/v1/admin/audit-logs/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats audit', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      if (userType !== 'all') params.user_type = userType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await apiClient.get('/v1/admin/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (err) {
      console.error('Erreur chargement logs audit', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, category, userType, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setUserType('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || category !== 'all' || userType !== 'all' || dateFrom || dateTo;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* ── En-tête Compact ── */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#1A6FD4" />
              Journal d'Audit & Traçabilité des Actions
            </h1>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Historique complet et immuable de toutes les activités des candidats, entreprises et administrateurs.
            </p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchLogs(); }}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* ── Cartes KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1A6FD4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Total Événements</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                {loadingStats ? '—' : Number(stats.total_logs || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Activités Aujourd'hui</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                {loadingStats ? '—' : Number(stats.logs_today || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogIn size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Connexions Aujourd'hui</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#4F46E5' }}>
                {loadingStats ? '—' : Number(stats.logins_today || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Actions Modération / Admin</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#9333EA' }}>
                {loadingStats ? '—' : Number(stats.admin_actions_today || 0).toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        {/* ── Filtres de recherche ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* Recherche texte */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher utilisateur, email, action, IP..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
            />
          </div>

          {/* Filtre Catégorie */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <option value="all">Toutes les catégories d'actions</option>
            <option value="security">🛡️ Sécurité & Incidents (Échecs, Verrouillages)</option>
            <option value="candidates">👤 Candidats & Traçabilité Profils</option>
            <option value="ai">✨ Intelligence Artificielle (Génération CV / IA)</option>
            <option value="wallet">💳 Finances, Wallets & Abonnements</option>
            <option value="auth">🔐 Authentification & Sessions</option>
            <option value="offers">💼 Offres de Stage & Emploi</option>
            <option value="applications">📄 Candidatures & Embauches</option>
            <option value="events">📅 Événements & Participations</option>
            <option value="surveys">📊 Sondages Communautaires</option>
            <option value="badges">🏅 Badges & Vérifications</option>
            <option value="reports">🛡️ Modération & Signalements</option>
            <option value="service_exchanges">🤝 Partenariats B2B / Troc</option>
            <option value="company">🏢 Entreprises & Viabilité</option>
            <option value="admin">⚙️ Administration & Paramètres</option>
          </select>

          {/* Filtre Type Utilisateur */}
          <select
            value={userType}
            onChange={e => { setUserType(e.target.value); setPage(1); }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <option value="all">Tous les rôles</option>
            <option value="candidate">Candidats</option>
            <option value="company">Entreprises</option>
            <option value="admin_staff">Administrateurs</option>
            <option value="visitor">Visiteurs</option>
          </select>

          {/* Date début */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Du</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '11.5px',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            />
          </div>

          {/* Date fin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Au</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '11.5px',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            />
          </div>

          {/* Réinitialisation */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: '5px 10px',
                backgroundColor: '#F1F5F9',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Effacer filtres
            </button>
          )}
        </div>

        {/* ── Tableau des Logs ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Horodatage</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Utilisateur / Auteur</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Action Réalisée</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Cible / Modèle</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>IP & Dispositif</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'right' }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      Chargement des logs d'audit...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                      <AlertCircle size={24} color="#94A3B8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      Aucune activité enregistrée correspondant aux critères.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionMeta = getActionMeta(log.action);
                    const userRole = getRoleBadge(log.user?.user_type);
                    const userName = log.user?.display_name || log.user?.email || (log.user_id ? `Utilisateur #${log.user_id}` : 'Système Automatique');

                    return (
                      <tr 
                        key={log.id}
                        style={{ 
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        {/* Horodatage */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: '#334155', fontWeight: '600' }}>
                          {formatDate(log.created_at)}
                        </td>

                        {/* Utilisateur */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: userRole.bg,
                              color: userRole.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: `1px solid ${userRole.border}`
                            }}>
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '700', color: '#0F172A', lineHeight: '1.2' }}>
                                {userName}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: userRole.bg,
                                  color: userRole.color,
                                  fontWeight: '600',
                                  border: `1px solid ${userRole.border}`
                                }}>
                                  {userRole.label}
                                </span>
                                {log.user?.email && (
                                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                                    • {log.user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            backgroundColor: actionMeta.bg,
                            color: actionMeta.color,
                            border: `1px solid ${actionMeta.border}`
                          }}>
                            {actionMeta.label}
                          </span>
                        </td>

                        {/* Cible / Ressource */}
                        <td style={{ padding: '8px 12px', color: '#334155' }}>
                          <span style={{ fontWeight: '600', fontSize: '11.5px' }}>
                            {formatTargetModel(log.model_type, log.model_id, log.action)}
                          </span>
                        </td>

                        {/* IP & Appareil */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: '600' }}>
                              {formatUserAgent(log.user_agent)}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                              IP : {log.ip_address || '127.0.0.1'}
                            </span>
                          </div>
                        </td>

                        {/* Bouton Détail */}
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#EFF6FF',
                              color: '#1A6FD4',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={13} />
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Compacte ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 14px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
              <span>Affichage de <strong>{meta.from || 0}</strong> à <strong>{meta.to || 0}</strong> sur <strong>{meta.total || 0}</strong> événements</span>
              <span style={{ color: '#CBD5E1' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Par page :</span>
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    fontSize: '11.5px',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '11.5px',
                  fontWeight: '600'
                }}
              >
                <ChevronLeft size={14} /> Précédent
              </button>

              <span style={{ padding: '0 8px', fontWeight: '700', color: '#1E293B' }}>
                {page} / {meta.last_page || 1}
              </span>

              <button
                onClick={() => setPage(p => Math.min(meta.last_page || 1, p + 1))}
                disabled={page >= (meta.last_page || 1) || loading}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  cursor: page >= (meta.last_page || 1) ? 'not-allowed' : 'pointer',
                  opacity: page >= (meta.last_page || 1) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '11.5px',
                  fontWeight: '600'
                }}
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Modal d'Inspection des Détails / Diff JSON (Sans codes bruts) ── */}
        {selectedLog && (() => {
          const mAction = getActionMeta(selectedLog.action);
          const mRole = getRoleBadge(selectedLog.user?.user_type);
          const mUser = selectedLog.user?.display_name || selectedLog.user?.email || 'Système Automatique';
          const mTarget = formatTargetModel(selectedLog.model_type, selectedLog.model_id, selectedLog.action);
          const mDevice = formatUserAgent(selectedLog.user_agent);

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15,23,42,0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
              animation: 'fadeIn 0.15s ease-out'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: '1px solid #CBD5E1',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header Modal */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      color: '#1A6FD4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                        Détails de l'événement
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Enregistré le {formatDate(selectedLog.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contenu Modal */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Meta infos en 4 cartes claires */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    
                    {/* Action */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Action Effectuée
                      </span>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: mAction.bg,
                          color: mAction.color,
                          border: `1px solid ${mAction.border}`
                        }}>
                          {mAction.label}
                        </span>
                      </div>
                    </div>

                    {/* Auteur & Rôle */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Auteur de l'action
                      </span>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{mUser}</span>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: '600',
                          backgroundColor: mRole.bg,
                          color: mRole.color,
                          border: `1px solid ${mRole.border}`
                        }}>
                          {mRole.label}
                        </span>
                      </div>
                    </div>

                    {/* Cible */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Ressource Concernée
                      </span>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
                        {mTarget}
                      </div>
                    </div>

                    {/* Appareil & IP */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Appareil & Connexion
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>
                        {mDevice}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                        IP : {selectedLog.ip_address || '127.0.0.1'}
                      </div>
                    </div>

                  </div>

                  {/* Comparaison Diff (Anciennes vs Nouvelles Valeurs) */}
                  <div style={{ display: 'grid', gridTemplateColumns: selectedLog.old_values ? '1fr 1fr' : '1fr', gap: '8px' }}>
                    {selectedLog.old_values && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626' }}>
                          ⬅️ Valeurs Précédentes :
                        </span>
                        <pre style={{
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#991B1B',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          margin: 0
                        }}>
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedLog.new_values && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669' }}>
                          ➡️ Données & Paramètres Enregistrés :
                        </span>
                        <pre style={{
                          backgroundColor: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#065F46',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          margin: 0
                        }}>
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {!selectedLog.old_values && !selectedLog.new_values && (
                    <div style={{ padding: '12px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '12px' }}>
                      Aucun paramètre supplémentaire associé à cet événement.
                    </div>
                  )}

                </div>

                {/* Footer Modal */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
                  <button
                    onClick={() => setSelectedLog(null)}
                    style={{
                      padding: '7px 18px',
                      backgroundColor: '#1A6FD4',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </MainLayout>
  );
};

export default AuditLogsPage;
