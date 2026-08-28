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

// Obtenir le label et la couleur selon l'action
const getActionMeta = (action) => {
  if (!action) return { label: 'Action inconnue', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };

  // IA
  if (action.startsWith('ai.cv_enhancement') || action.startsWith('ai.')) {
    return { label: '✨ Optimisation CV IA', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }

  // Authentification
  if (action.startsWith('auth.admin_login') || action.startsWith('auth.login')) {
    return { label: 'Connexion', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  }
  if (action.startsWith('auth.admin_logout') || action.startsWith('auth.logout')) {
    return { label: 'Déconnexion', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  }
  if (action.startsWith('auth.register')) {
    return { label: 'Inscription', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }

  // Paiements & Portefeuille
  if (action.startsWith('wallet.credit')) {
    return { label: '💳 Rechargement Portefeuille', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }
  if (action.startsWith('wallet.debit')) {
    return { label: '💳 Débit Portefeuille', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }
  if (action.startsWith('subscription.purchased')) {
    return { label: '⭐ Souscription Abonnement', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }

  // Offres
  if (action.startsWith('offer.created')) {
    return { label: 'Offre créée', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' };
  }
  if (action.startsWith('offer.updated')) {
    return { label: 'Offre modifiée', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' };
  }
  if (action.startsWith('offer.validated')) {
    return { label: 'Offre validée', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
  }
  if (action.startsWith('offer.rejected')) {
    return { label: 'Offre rejetée', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
  }
  if (action.startsWith('offer.deleted')) {
    return { label: 'Offre supprimée', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }
  if (action.startsWith('offer.status_changed')) {
    return { label: 'Statut offre modifié', bg: '#FDF4FF', color: '#86198F', border: '#F5D0FE' };
  }

  // Candidatures & Embauches
  if (action.startsWith('application.submitted')) {
    return { label: 'Candidature déposée', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }
  if (action.startsWith('application.status_changed') || action.startsWith('admin.application_status_changed')) {
    return { label: 'Statut candidature mis à jour', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
  }
  if (action.startsWith('hiring.status_changed')) {
    return { label: 'Déclaration d\'embauche', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
  }
  if (action.startsWith('hiring.payment_decision')) {
    return { label: 'Prime d\'embauche', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }

  // Événements
  if (action.startsWith('event.created')) {
    return { label: 'Événement publié', bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' };
  }
  if (action.startsWith('event.participated')) {
    return { label: 'Inscription événement', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  }
  if (action.startsWith('event.participation_cancelled')) {
    return { label: 'Annulation participation', bg: '#F8FAFC', color: '#64748B', border: '#CBD5E1' };
  }

  // Sondages
  if (action.startsWith('survey.voted')) {
    return { label: '📊 Vote à un sondage', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }
  if (action.startsWith('survey.created')) {
    return { label: '📊 Sondage créé', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };
  }

  // Badges & Vérifications
  if (action.startsWith('badge.approved')) {
    return { label: '🏅 Badge vérifié accordé', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  }
  if (action.startsWith('badge.rejected')) {
    return { label: 'Badge rejeté', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' };
  }

  // Signalements & Modération
  if (action.startsWith('report.content_banned')) {
    return { label: '🛡️ Contenu banni (Signalement)', bg: '#FEF2F2', color: '#991B1B', border: '#F87171' };
  }
  if (action.startsWith('report.dismissed')) {
    return { label: 'Signalement classé sans suite', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
  }

  // Partenariats B2B / Troc
  if (action.startsWith('service_exchange.status_changed')) {
    return { label: 'Troc B2B mis à jour', bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' };
  }
  if (action.startsWith('service_exchange.deleted')) {
    return { label: 'Troc B2B supprimé', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
  }

  // Entreprises
  if (action.startsWith('company.viability')) {
    return { label: 'Viabilité entreprise', bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4' };
  }
  if (action.startsWith('company.international')) {
    return { label: 'Droit international', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
  }

  // Admin & Demandes spéciales
  if (action.startsWith('special_request.status_changed')) {
    return { label: 'Demande spéciale traitée', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
  }
  if (action.startsWith('admin.user_suspended')) {
    return { label: 'Utilisateur suspendu', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' };
  }
  if (action.startsWith('admin.user_reactivated')) {
    return { label: 'Utilisateur réactivé', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' };
  }

  return { label: action, bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' };
};

// Obtenir le badge de rôle utilisateur
const getRoleBadge = (userType) => {
  switch (userType) {
    case 'admin_staff':
      return { label: 'Admin Staff', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
    case 'company':
      return { label: 'Entreprise', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'candidate':
      return { label: 'Candidat', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    case 'visitor':
      return { label: 'Visiteur', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    default:
      return { label: userType || 'Système', bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  }
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
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            backgroundColor: actionMeta.bg,
                            color: actionMeta.color,
                            border: `1px solid ${actionMeta.border}`
                          }}>
                            {actionMeta.label}
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
                            {log.action}
                          </span>
                        </td>

                        {/* Cible / Modèle */}
                        <td style={{ padding: '8px 12px', color: '#475569' }}>
                          {log.model_type ? (
                            <div>
                              <span style={{ fontWeight: '600', color: '#334155' }}>
                                {log.model_type.split('\\').pop()}
                              </span>
                              {log.model_id && (
                                <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>
                                  #{log.model_id}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* IP & Navigateur */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11.5px', color: '#0F172A', fontFamily: 'monospace', fontWeight: '600' }}>
                              {log.ip_address || '127.0.0.1'}
                            </span>
                            {log.user_agent && (
                              <span style={{ fontSize: '10.5px', color: '#94A3B8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_agent}>
                                {log.user_agent.includes('Mozilla') ? 'Navigateur Web' : log.user_agent.split('/')[0]}
                              </span>
                            )}
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
                            Diff
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
              <span>Affichage de <strong>{meta.from || 0}</strong> à <strong>{meta.to || 0}</strong> sur <strong>{meta.total || 0}</strong> logs</span>
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

        {/* ── Modal d'Inspection des Détails / Diff JSON ── */}
        {selectedLog && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header Modal */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#1A6FD4" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Détails de l'événement #{selectedLog.id}
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
                
                {/* Meta infos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Action</span>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedLog.action}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Adresse IP</span>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedLog.ip_address || '127.0.0.1'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Auteur / Rôle</span>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedLog.user?.display_name || selectedLog.user?.email || 'Système'} ({selectedLog.user?.user_type || 'N/A'})
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Cible / Modèle</span>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                      {selectedLog.model_type ? `${selectedLog.model_type.split('\\').pop()} #${selectedLog.model_id}` : 'Non spécifié'}
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>User-Agent (Navigateur / App)</span>
                    <div style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedLog.user_agent}
                    </div>
                  </div>
                )}

                {/* Comparaison Diff (Anciennes vs Nouvelles Valeurs) */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedLog.old_values ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  {selectedLog.old_values && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626' }}>
                        ⬅️ Anciennes Valeurs :
                      </span>
                      <pre style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '11px',
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
                        ➡️ Nouvelles Valeurs / Payload :
                      </span>
                      <pre style={{
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#065F46',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '11px',
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
                    Aucun payload supplémentaire associé à cet événement.
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#1A6FD4',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
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
        )}

      </div>
    </MainLayout>
  );
};

export default AuditLogsPage;
