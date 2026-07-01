import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, CalendarDays, FileText,
  BadgeCheck, CreditCard, Star, Bell, Layers, BarChart3,
  Settings, LogOut, ChevronDown, ChevronRight, PanelLeftClose,
  PanelLeftOpen, UserX, Clock, CheckCircle2, XCircle, ListFilter,
  Building2, UserCheck, Wallet, TrendingUp, ReceiptText, Send,
  History, Globe, Tag, Percent, Eye, LayoutGrid, Megaphone,
  Languages, MapPin, Award, UserCog, Type
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/apiClient';

// ─── Constantes de style ───────────────────────────────────────────────────────
const SIDEBAR_W = 264;
const SIDEBAR_W_COLLAPSED = 64;
const DARK = '#0D3B7A';
const BORDER = 'rgba(255,255,255,0.08)';
const ACTIVE_BG = 'rgba(26,111,212,0.85)';
const HOVER_BG = 'rgba(255,255,255,0.07)';
const TEXT_MUTED = 'rgba(255,255,255,0.45)';
const TEXT_DEFAULT = 'rgba(255,255,255,0.75)';
const TEXT_ACTIVE = '#ffffff';

// ─── Structure de navigation ───────────────────────────────────────────────────
const NAV = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: Users,
    path: '/users',
  },
  {
    id: 'offers',
    label: 'Offres',
    icon: Briefcase,
    children: [
      { label: 'Toutes les offres',      path: '/offers',          icon: Briefcase },
      { label: 'En attente',             path: '/offers/pending',  icon: Clock,         badgeKey: 'pending_offers_count' },
      { label: 'Validées',               path: '/offers/approved', icon: CheckCircle2 },
      { label: 'Expirées',               path: '/offers/expired',  icon: XCircle },
    ],
  },
  {
    id: 'events',
    label: 'Événements',
    icon: CalendarDays,
    children: [
      { label: 'Tous les événements',    path: '/events',              icon: CalendarDays },
      { label: 'En attente',             path: '/events/pending',      icon: Clock,         badgeKey: 'pending_events_count' },
      { label: 'Validés',                path: '/events/approved',     icon: CheckCircle2 },
      { label: 'Catégories',             path: '/events/categories',   icon: Tag },
    ],
  },
  {
    id: 'applications',
    label: 'Candidatures',
    icon: FileText,
    children: [
      { label: 'Toutes',       path: '/applications',            icon: FileText },
      { label: 'Par statut',   path: '/applications/by-status',  icon: ListFilter },
      { label: 'Par offre',    path: '/applications/by-offer',   icon: Briefcase },
    ],
  },
  {
    id: 'badges',
    label: 'Badges & Vérifications',
    icon: BadgeCheck,
    children: [
      { label: 'En attente de badge',   path: '/badges/pending',    icon: Clock,       badge: true, badgeKey: 'pending_verifications_count' },
      { label: 'Candidats vérifiés',    path: '/badges/candidates', icon: UserCheck },
      { label: 'Entreprises vérifiées', path: '/badges/companies',  icon: Building2 },
    ],
  },
  {
    id: 'payments',
    label: 'Paiements & Wallets',
    icon: CreditCard,
    children: [
      { label: 'Transactions',    path: '/payments/transactions', icon: ReceiptText },
      { label: 'Wallets',         path: '/payments/wallets',      icon: Wallet },
      { label: 'Revenus',         path: '/payments/revenue',      icon: TrendingUp },
      { label: 'Taux conversion', path: '/payments/conversion',   icon: Percent },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    icon: Star,
    children: [
      { label: 'Plans',              path: '/subscriptions/plans',   icon: Star },
      { label: 'Abonnés actifs',     path: '/subscriptions/active',  icon: Users },
      { label: 'Historique',         path: '/subscriptions/history', icon: History },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    children: [
      { label: 'Envoyer',            path: '/notifications/send',    icon: Send },
      { label: 'Historique',         path: '/notifications/history', icon: History },
      { label: 'Ciblage',            path: '/notifications/target',  icon: ListFilter },
    ],
  },
  {
    id: 'cms',
    label: 'CMS — Contenu',
    icon: Layers,
    children: [
      { label: 'Pages publicitaires', path: '/cms/ads',        icon: Megaphone },
      { label: 'Langues',             path: '/cms/languages',  icon: Languages },
      { label: 'Traductions App',     path: '/cms/translations', icon: Type },
      { label: 'Zones géographiques', path: '/cms/locations',  icon: MapPin },
      { label: 'Catégories',          path: '/cms/categories', icon: Tag },
      { label: 'Règles de quota',     path: '/cms/quotas',     icon: ListFilter },
      { label: 'Champs floutés',      path: '/cms/blur',       icon: Eye },
    ],
  },
  {
    id: 'stats',
    label: 'Statistiques',
    icon: BarChart3,
    children: [
      { label: 'Utilisateurs',  path: '/stats/users',        icon: Users },
      { label: 'Entreprises',   path: '/stats/companies',    icon: Building2 },
      { label: 'Offres',        path: '/stats/offers',       icon: Briefcase },
      { label: 'Candidatures',  path: '/stats/applications', icon: FileText },
      { label: 'Événements',    path: '/stats/events',       icon: CalendarDays },
      { label: 'Revenus',       path: '/stats/revenue',      icon: TrendingUp },
      { label: 'Exports',       path: '/stats/exports',      icon: LayoutGrid },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    children: [
      { label: 'Comptes admin',    path: '/settings/staff',    icon: UserCog },
      { label: 'Mon profil',       path: '/settings/profile',  icon: UserCheck },
      { label: 'Mot de passe',     path: '/settings/password', icon: Settings },
      { label: 'Langue du panel',  path: '/settings/language', icon: Languages },
    ],
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────
export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarStats, setSidebarStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/v1/admin/sidebar-stats');
        setSidebarStats(res.data.data || {});
      } catch (err) {
        console.error('Erreur stats sidebar', err);
        setSidebarStats({});
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [openSections, setOpenSections] = useState(() => {
    // Ouvrir par défaut la section dont un enfant est actif
    const initial = {};
    NAV.forEach(item => {
      if (item.children?.some(c => location.pathname.startsWith(c.path))) {
        initial[item.id] = true;
      }
    });
    return initial;
  });

  const toggleSection = useCallback((id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const fullName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Admin'
    : 'Admin';

  const w = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <>
      <aside style={{
        width: `${w}px`,
        minWidth: `${w}px`,
        backgroundColor: DARK,
        color: TEXT_DEFAULT,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 100,
        overflowX: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
      }}>

        {/* ── En-tête : logo + toggle ── */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 16px 0 20px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo-samre.png" alt="SAMRE Logo" style={{ height: '74px', objectFit: 'contain' }} />
              <span style={{
                fontFamily: 'var(--font-poppins)',
                fontSize: '20px', fontWeight: '800',
                color: '#fff', letterSpacing: '0.02em',
              }}>SAMRE</span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Agrandir' : 'Réduire'}
            style={{
              color: TEXT_MUTED, padding: '6px', borderRadius: '6px',
              display: 'flex', transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = HOVER_BG; }}
            onMouseLeave={e => { e.currentTarget.style.color = TEXT_MUTED; e.currentTarget.style.background = 'transparent'; }}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* ── Navigation scrollable ── */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}>
          {NAV.map(item => (
            <NavSection
              key={item.id}
              item={item}
              collapsed={collapsed}
              isOpen={!!openSections[item.id]}
              onToggle={() => toggleSection(item.id)}
              currentPath={location.pathname}
              sidebarStats={sidebarStats}
            />
          ))}
        </nav>

        {/* ── Pied : déconnexion ── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: collapsed ? '12px 0' : '12px 8px',
          flexShrink: 0,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'stretch',
        }}>
          <LogoutButton collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Décalage du contenu principal */}
      <div style={{ width: `${w}px`, minWidth: `${w}px`, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }} />
    </>
  );
};

// ─── Section de navigation (avec ou sans sous-items) ─────────────────────────
const NavSection = ({ item, collapsed, isOpen, onToggle, currentPath, sidebarStats }) => {
  const Icon = item.icon;
  const hasChildren = !!item.children;

  // Vérifie si un enfant est actif
  const isChildActive = hasChildren && item.children.some(c => currentPath.startsWith(c.path));
  const isDirectActive = !hasChildren && currentPath === item.path;
  const isHighlighted = isChildActive || isDirectActive;

  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        title={collapsed ? item.label : undefined}
        style={({ isActive }) => buildItemStyle(isActive, collapsed)}
      >
        <Icon size={19} style={{ flexShrink: 0 }} />
        {!collapsed && <span style={{ flex: 1, fontSize: '13.5px', fontWeight: '500' }}>{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      {/* En-tête de section */}
      <button
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: collapsed ? '10px 0' : '10px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: isHighlighted ? TEXT_ACTIVE : TEXT_DEFAULT,
          background: isHighlighted && collapsed ? ACTIVE_BG : 'transparent',
          borderRadius: collapsed ? '0' : '0 10px 10px 0',
          marginRight: collapsed ? '0' : '8px',
          transition: 'color 0.15s, background 0.15s',
          borderLeft: isHighlighted && !collapsed ? '3px solid #ffffff' : '3px solid transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = HOVER_BG; }}
        onMouseLeave={e => { if (!isHighlighted) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={19} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, textAlign: 'left', fontSize: '13.5px', fontWeight: '500' }}>{item.label}</span>
            <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: TEXT_MUTED }}>
              <ChevronDown size={15} />
            </span>
          </>
        )}
      </button>

      {/* Sous-items */}
      {!collapsed && isOpen && (
        <div style={{ paddingLeft: '16px', marginBottom: '4px' }}>
          {item.children.map(child => (
            <SubItem key={child.path} child={child} currentPath={currentPath} sidebarStats={sidebarStats} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sous-item ────────────────────────────────────────────────────────────────
const SubItem = ({ child, currentPath, sidebarStats }) => {
  const Icon = child.icon;
  const isActive = currentPath === child.path || currentPath.startsWith(child.path + '/');

  const hasStats = sidebarStats !== null;
  const badgeValue = hasStats && child.badgeKey ? (sidebarStats[child.badgeKey] || 0) : null;
  const showBadge = hasStats && child.badgeKey;

  return (
    <NavLink
      to={child.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 12px',
        borderRadius: '6px',
        color: isActive ? TEXT_ACTIVE : TEXT_MUTED,
        backgroundColor: isActive ? ACTIVE_BG : 'transparent',
        fontSize: '12.5px',
        fontWeight: isActive ? '600' : '400',
        textDecoration: 'none',
        transition: 'color 0.15s, background 0.15s',
        marginBottom: '1px',
        borderLeft: isActive ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = HOVER_BG; e.currentTarget.style.color = TEXT_ACTIVE; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED; } }}
    >
      <Icon size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
      <span style={{ flex: 1 }}>{child.label}</span>
      {child.badge && !child.badgeKey && (
        <span style={{
          background: '#F5A623', color: '#0F1923',
          fontSize: '10px', fontWeight: '700',
          padding: '1px 6px', borderRadius: '999px',
        }}>●</span>
      )}
      {showBadge && (
        <span style={{
          background: badgeValue > 0 ? '#ef4444' : '#64748b',
          color: '#fff', fontSize: '11px', fontWeight: '700',
          padding: '2px 6px', borderRadius: '10px',
          marginLeft: 'auto',
          minWidth: '18px', textAlign: 'center'
        }}>{badgeValue}</span>
      )}
    </NavLink>
  );
};

// ─── Bouton déconnexion ───────────────────────────────────────────────────────
const LogoutButton = ({ collapsed, onLogout }) => (
  <button
    onClick={onLogout}
    title="Se déconnecter"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: collapsed ? '10px' : '10px 16px',
      width: collapsed ? 'auto' : '100%',
      borderRadius: '8px',
      color: TEXT_MUTED,
      fontSize: '13.5px',
      fontWeight: '500',
      transition: 'color 0.15s, background 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.color = TEXT_MUTED; e.currentTarget.style.background = 'transparent'; }}
  >
    <LogOut size={18} style={{ flexShrink: 0 }} />
    {!collapsed && <span>Déconnexion</span>}
  </button>
);

// ─── Utilitaire : style d'un item de nav direct ───────────────────────────────
const buildItemStyle = (isActive, collapsed) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: collapsed ? '10px 0' : '10px 16px',
  justifyContent: collapsed ? 'center' : 'flex-start',
  color: isActive ? TEXT_ACTIVE : TEXT_DEFAULT,
  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
  borderLeft: isActive && !collapsed ? '3px solid #ffffff' : '3px solid transparent',
  borderRadius: collapsed ? '0' : '0 10px 10px 0',
  marginRight: collapsed ? '0' : '8px',
  textDecoration: 'none',
  fontSize: '13.5px',
  fontWeight: isActive ? '600' : '500',
  transition: 'color 0.15s, background 0.15s',
});
