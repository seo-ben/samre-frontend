import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';

// ─── Formatage des grands nombres (ex: 10 000 -> 10k) ──────────────────────────
const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  const val = Number(num);
  if (isNaN(val)) return num;

  if (val >= 1000000) {
    return (val / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M';
  }
  if (val >= 1000) {
    return (val / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k';
  }
  return val.toLocaleString('fr-FR');
};

// ─── Carte KPI ─────────────────────────────────────────────────────────────────
const KpiCard = ({ iconClass, label, value, color, loading }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid var(--gray-border)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <i className={iconClass} style={{ fontSize: '22px', color: color }}></i>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>{label}</p>
      {loading ? (
        <div style={{
          height: '28px', width: '64px', borderRadius: '6px',
          background: 'linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          marginTop: '4px',
        }} />
      ) : (
        <p style={{
          margin: '4px 0 0', fontSize: '24px', fontWeight: '700',
          color: 'var(--black-deep)', fontFamily: 'var(--font-poppins)',
        }}>
          {formatNumber(value)}
        </p>
      )}
    </div>
  </div>
);

// ─── Carte revenu (spéciale) ───────────────────────────────────────────────────
const RevenueCard = ({ value, loading }) => (
  <div style={{
    background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%)',
    borderRadius: '12px',
    padding: '24px',
    color: '#ffffff',
    gridColumn: 'span 2',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 16px rgba(0,82,255,0.25)',
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: '26px', color: '#ffffff' }}></i>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, fontWeight: '500' }}>
        Revenus totaux générés
      </p>
      {loading ? (
        <div style={{
          height: '32px', width: '120px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.2)',
          marginTop: '6px',
        }} />
      ) : (
        <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-poppins)' }}>
          {value !== null && value !== undefined
            ? `${formatNumber(value)} FCFA`
            : '—'}
        </p>
      )}
    </div>
  </div>
);

// ─── Page Dashboard ────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Filtres
  const [categories, setCategories] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Charger les listes pour les filtres au montage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catsRes, prefsRes] = await Promise.all([
          apiClient.get('/v1/offers/categories'),
          apiClient.get('/v1/content/prefectures'),
        ]);
        setCategories(catsRes.data.data || []);
        setPrefectures(prefsRes.data.data || []);
      } catch (err) {
        // Fallback en cas d'erreur
      }
    };
    loadFilters();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Récupérer les statistiques avec les filtres appliqués
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setToast(null);
    try {
      const params = {};
      if (selectedPeriod && selectedPeriod !== 'all') params.period = selectedPeriod;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedPrefecture) params.prefecture_id = selectedPrefecture;
      if (selectedStatus) params.status = selectedStatus;

      const { data } = await apiClient.get('/v1/admin/dashboard', { params });
      setStats(data.data);
      setLastRefresh(new Date());
    } catch (err) {
      setToast({ message: err.response?.data?.message ?? 'Impossible de charger les statistiques.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedCategory, selectedPrefecture, selectedStatus]);

  // Re-fetch à chaque changement de filtre
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = [
    { key: 'users_count',          label: 'Utilisateurs total',     iconClass: 'fa-solid fa-users',        color: '#0052ff' },
    { key: 'candidates_count',     label: 'Candidats',              iconClass: 'fa-solid fa-user-check',   color: '#7c3aed' },
    { key: 'companies_count',      label: 'Entreprises',            iconClass: 'fa-solid fa-landmark',     color: '#059669' },
    { key: 'offers_count',         label: 'Offres publiées',        iconClass: 'fa-solid fa-briefcase',    color: '#d97706' },
    { key: 'applications_count',   label: 'Candidatures',           iconClass: 'fa-solid fa-file-alt',     color: '#db2777' },
    { key: 'events_count',         label: 'Événements',             iconClass: 'fa-solid fa-calendar-days', color: '#0891b2' },
    { key: 'hired_candidates',     label: 'Embauchés',              iconClass: 'fa-solid fa-user-tie',     color: '#16a34a' },
    { key: 'scheduled_candidates', label: 'Programmés',             iconClass: 'fa-solid fa-clock',        color: '#6366f1' },
  ];

  return (
    <MainLayout>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* En-tête de la page */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: '22px', fontWeight: '700',
            fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)',
          }}>
            {new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour'}, {user?.first_name ?? 'Admin'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
            Vue en temps réel
            {lastRefresh && (
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                — mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        {/* Section de filtres réactifs (1, 2, 3, 4) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Filtre 1 : Période */}
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--gray-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--black-deep)',
              fontWeight: '500',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Période : Tout</option>
            <option value="today">Aujourd'hui</option>
            <option value="7_days">7 derniers jours</option>
            <option value="15_days">15 derniers jours</option>
            <option value="30_days">30 derniers jours</option>
          </select>

          {/* Filtre 2 : Secteur */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--gray-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--black-deep)',
              fontWeight: '500',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '160px',
            }}
          >
            <option value="">Tous les secteurs</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.translations?.[0]?.name ?? cat.name ?? `Secteur ${cat.id}`}
              </option>
            ))}
          </select>

          {/* Filtre 3 : Statut */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--gray-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--black-deep)',
              fontWeight: '500',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
          </select>

          {/* Filtre 4 : Préfecture */}
          {/* <select
            value={selectedPrefecture}
            onChange={e => setSelectedPrefecture(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--gray-border)',
              background: '#ffffff',
              fontSize: '13px',
              color: 'var(--black-deep)',
              fontWeight: '500',
              fontFamily: 'var(--font-inter)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '160px',
            }}
          >
            <option value="">Toutes les préfectures</option>
            {prefectures.map(pref => (
              <option key={pref.id} value={pref.id}>
                {pref.translations?.[0]?.name ?? pref.name ?? `Préfecture ${pref.id}`}
              </option>
            ))}
          </select> */}

          <button
            onClick={fetchStats}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px',
              background: loading ? 'var(--gray-light)' : '#0052ff',
              color: loading ? 'var(--gray-medium)' : '#ffffff',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              transition: '0.2s',
              fontFamily: 'var(--font-inter)',
            }}
          >
            <i className="fa-solid fa-arrows-rotate" style={{ fontSize: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }}></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#fff', padding: '14px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: toast.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          animation: 'slideUp 0.3s ease-out forwards',
          backdropFilter: 'blur(8px)',
        }}>
          {toast.type === 'success' ? (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}>✓</div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
          )}
          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
              opacity: 0.8, padding: '4px', display: 'flex', alignItems: 'center'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grille KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Carte revenus en pleine largeur */}
        <RevenueCard value={stats?.total_revenue} loading={loading} />

        {kpis.map(({ key, label, iconClass, color }) => (
          <KpiCard
            key={key}
            iconClass={iconClass}
            label={label}
            value={stats?.[key]}
            color={color}
            loading={loading}
          />
        ))}

        {/* Section d'actions rapides */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--gray-border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          gridColumn: 'span 2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h3 style={{
            margin: '0 0 16px',
            fontSize: '15px', fontWeight: '600',
            fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)',
          }}>
            Actions rapides
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Offres en attente',    path: '/offers/pending', iconClass: 'fa-solid fa-file-contract' },
              { label: 'Gérer les utilisateurs', path: '/users', iconClass: 'fa-solid fa-users-gear' },
              // { label: 'CMS & Contenu',        path: '/cms/languages', iconClass: 'fa-solid fa-folder-tree' },
              // { label: 'Envoyer notification', path: '/notifications/send', iconClass: 'fa-solid fa-bell' },
            ].map(({ label, path, iconClass }) => (
              <Link
                key={path}
                to={path}
                style={{
                  padding: '10px 16px',
                  background: 'var(--gray-light)',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--black-deep)',
                  textDecoration: 'none',
                  transition: '0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8edf5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-light)'; }}
              >
                <i className={iconClass} style={{ marginRight: '6px', opacity: 0.7 }}></i> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </MainLayout>
  );
};
