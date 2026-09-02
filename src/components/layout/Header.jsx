import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, ChevronRight, Volume2, VolumeX, 
  Monitor, Handshake, CreditCard, 
  Zap, UserCheck, ShieldCheck, Briefcase, 
  FileText, Calendar, UserPlus, Award 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';

// Helper de temps relatif en français
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  } catch {
    return '';
  }
};

// Helper d'icône d'alerte selon l'événement
const getAlertIcon = (type) => {
  switch (type) {
    case 'job_offer':
      return <Briefcase size={15} color="#4F46E5" />;
    case 'job_application':
      return <FileText size={15} color="#0284C7" />;
    case 'hiring_declaration':
      return <Handshake size={15} color="#059669" />;
    case 'special_request':
      return <Zap size={15} color="#7E22CE" />;
    case 'report':
      return <ShieldCheck size={15} color="#DC2626" />;
    case 'verification_badge':
      return <Award size={15} color="#D97706" />;
    case 'event':
      return <Calendar size={15} color="#2563EB" />;
    case 'user_registered':
      return <UserPlus size={15} color="#16A34A" />;
    case 'wallet_credit':
      return <CreditCard size={15} color="#059669" />;
    default:
      return <Bell size={15} color="#1D4ED8" />;
  }
};

// Helper de correspondance des routes pour le fil d'Ariane (Breadcrumbs)
const getBreadcrumbs = (path) => {
  if (path === '/dashboard') {
    return { parent: 'Tableau de Bord', child: '' };
  }
  if (path.startsWith('/users')) {
    return { parent: 'Utilisateurs', child: '' };
  }
  if (path.startsWith('/offers/deleted')) {
    return { parent: 'Offres', child: 'Supprimées' };
  }
  if (path.startsWith('/offers/expired')) {
    return { parent: 'Offres', child: 'Expirées' };
  }
  if (path.startsWith('/offers/pending')) {
    return { parent: 'Offres', child: 'En attente' };
  }
  if (path.startsWith('/offers/approved')) {
    return { parent: 'Offres', child: 'Validées' };
  }
  if (path.startsWith('/offers')) {
    return { parent: 'Offres', child: 'Toutes les offres' };
  }
  if (path.startsWith('/events/deleted')) {
    return { parent: 'Événements', child: 'Supprimés' };
  }
  if (path.startsWith('/events/expired')) {
    return { parent: 'Événements', child: 'Expirés' };
  }
  if (path.startsWith('/events/pending')) {
    return { parent: 'Événements', child: 'En attente' };
  }
  if (path.startsWith('/events/approved')) {
    return { parent: 'Événements', child: 'Validés' };
  }
  if (path.startsWith('/events/categories')) {
    return { parent: 'Événements', child: 'Catégories' };
  }
  if (path.startsWith('/events')) {
    return { parent: 'Événements', child: 'Tous les événements' };
  }
  if (path.startsWith('/applications/by-status')) {
    return { parent: 'Candidatures', child: 'Par statut' };
  }
  if (path.startsWith('/applications/by-offer')) {
    return { parent: 'Candidatures', child: 'Par offre' };
  }
  if (path.startsWith('/hiring-declarations') || path.startsWith('/declarations-embauche')) {
    return { parent: 'Candidatures', child: 'Déclarations d\'embauche' };
  }
  if (path.startsWith('/applications')) {
    return { parent: 'Candidatures', child: 'Toutes les candidatures' };
  }
  if (path.startsWith('/badges/pending')) {
    return { parent: 'Badges & Vérifications', child: 'En attente' };
  }
  if (path.startsWith('/badges/candidates')) {
    return { parent: 'Badges & Vérifications', child: 'Secrétaires vérifiées' };
  }
  if (path.startsWith('/badges/companies')) {
    return { parent: 'Badges & Vérifications', child: 'Entreprises vérifiées' };
  }
  if (path.startsWith('/payments/transactions') || path.startsWith('/transactions')) {
    return { parent: 'Finances & Wallets', child: 'Transactions' };
  }
  if (path.startsWith('/payments/wallets') || path.startsWith('/wallets')) {
    return { parent: 'Finances & Wallets', child: 'Portefeuilles' };
  }
  if (path.startsWith('/finances')) {
    return { parent: 'Finances & Wallets', child: 'Vue d\'ensemble' };
  }
  if (path.startsWith('/payments/revenue')) {
    return { parent: 'Paiements & Wallets', child: 'Revenus' };
  }
  if (path.startsWith('/payments/conversion')) {
    return { parent: 'Paiements & Wallets', child: 'Taux de conversion' };
  }
  if (path.startsWith('/subscriptions/control-center')) {
    return { parent: 'Abonnements', child: 'Centre de contrôle' };
  }
  if (path.startsWith('/subscriptions/plans')) {
    return { parent: 'Abonnements', child: 'Plans d\'abonnement' };
  }
  if (path.startsWith('/subscriptions/active')) {
    return { parent: 'Abonnements', child: 'Abonnés actifs' };
  }
  if (path.startsWith('/subscriptions/history')) {
    return { parent: 'Abonnements', child: 'Historique' };
  }
  if (path.startsWith('/subscriptions/create')) {
    return { parent: 'Abonnements', child: 'Créer un plan' };
  }
  if (path.startsWith('/notifications/send')) {
    return { parent: 'Notifications', child: 'Envoyer' };
  }
  if (path.startsWith('/notifications')) {
    return { parent: 'Notifications & Alertes', child: 'Centre Push' };
  }
  if (path.startsWith('/audit-logs')) {
    return { parent: 'Sécurité & Audit', child: 'Journal des activités' };
  }
  if (path.startsWith('/moderation/reports') || path.startsWith('/reports')) {
    return { parent: 'Modération', child: 'Signalements de contenu' };
  }
  if (path.startsWith('/special-requests')) {
    return { parent: 'Demandes Spéciales', child: 'Suivi des requêtes' };
  }
  if (path.startsWith('/surveys')) {
    return { parent: 'Sondages & Enquêtes', child: '' };
  }
  if (path.startsWith('/partnerships')) {
    return { parent: 'Partenariats B2B', child: '' };
  }
  if (path.startsWith('/cms')) {
    return { parent: 'CMS — Contenu', child: '' };
  }
  if (path.startsWith('/locations')) {
    return { parent: 'Données Géographiques', child: '' };
  }
  if (path.startsWith('/system/health')) {
    return { parent: 'Système & Logs', child: 'Santé du système' };
  }
  if (path.startsWith('/system/settings')) {
    return { parent: 'Système & Logs', child: 'Paramètres système' };
  }
  if (path.startsWith('/settings/staff')) {
    return { parent: 'Paramètres', child: 'Comptes admin' };
  }
  if (path.startsWith('/settings/profile')) {
    return { parent: 'Paramètres', child: 'Mon profil' };
  }
  if (path.startsWith('/settings/password')) {
    return { parent: 'Paramètres', child: 'Changer le mot de passe' };
  }
  if (path.startsWith('/settings/language')) {
    return { parent: 'Paramètres', child: 'Langue du panel' };
  }

  return { parent: 'Console', child: '' };
};

export const Header = () => {
  const { user } = useAuth();
  const { 
    isSyncing, 
    refreshNow, 
    liveAlerts, 
    unreadAlertsCount, 
    desktopPermission, 
    requestDesktopPermission, 
    testDesktopNotification,
    soundEnabled,
    toggleSound
  } = useRealtime();

  const location = useLocation();
  const navigate = useNavigate();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const fullName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Admin'
    : 'Admin';

  const { parent, child } = getBreadcrumbs(location.pathname);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        .header-container { padding: 0 24px; gap: 16px; }
        .header-search { display: block; }
        .header-user-info { display: block; }
        .header-breadcrumb { font-size: 15px; }
        @media (max-width: 1024px) {
          .header-search input { width: 200px !important; }
        }
        @media (max-width: 768px) {
          .header-container { padding: 0 16px !important; }
          .header-search { display: none !important; }
        }
        @media (max-width: 480px) {
          .header-user-info { display: none !important; }
          .header-breadcrumb span { font-size: 13px !important; }
          .header-container { padding: 0 12px !important; gap: 8px !important; }
          .header-right-actions { gap: 12px !important; }
        }
        @keyframes pulseAlert {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
      <header className="header-container" style={{
        height: '64px',
        backgroundColor: 'var(--white-pure)',
        borderBottom: '1px solid var(--gray-border)',
        boxShadow: '0 1px 0 var(--gray-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <div className="header-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            {child ? (
              <>
                <span style={{ color: 'var(--gray-medium)', fontFamily: 'var(--font-inter)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{parent}</span>
                <ChevronRight size={14} color="var(--gray-medium)" style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-poppins)', fontWeight: '600', color: 'var(--black-deep)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{child}</span>
              </>
            ) : (
              <span style={{ fontFamily: 'var(--font-poppins)', fontWeight: '600', color: 'var(--black-deep)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{parent}</span>
            )}
          </div>
        </div>

        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          
          <button
            onClick={refreshNow}
            title="Synchronisation temps réel"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px',
              borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0',
              fontSize: '11.5px', fontWeight: '700', color: '#16a34a', cursor: 'pointer'
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isSyncing ? '#eab308' : '#22c55e' }}></span>
            <span className="hidden sm:inline">{isSyncing ? 'Actualisation...' : 'En direct'}</span>
          </button>

          {desktopPermission !== 'granted' && (
            <button
              onClick={requestDesktopPermission}
              title="Activer les alertes PC"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                borderRadius: '20px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                fontSize: '11.5px', fontWeight: '700', color: '#1D4ED8', cursor: 'pointer',
                animation: 'pulseAlert 2.5s infinite'
              }}
            >
              <Monitor size={13} />
              <span className="hidden md:inline">Activer alertes PC</span>
            </button>
          )}

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setNotifDropdownOpen(o => !o)}
              style={{
                background: notifDropdownOpen ? '#EFF6FF' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px'
              }}
            >
              <Bell size={21} color={notifDropdownOpen ? '#1A6FD4' : 'var(--primary-dark)'} />
              {unreadAlertsCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px', minWidth: '16px', height: '16px',
                  background: '#EF4444', color: '#FFFFFF', borderRadius: '10px', fontSize: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFFFFF'
                }}>
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                maxWidth: '90vw',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: '0 20px 30px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                zIndex: 1000,
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {/* Header Dropdown */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Bell size={15} color="#1A6FD4" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        Alertes en Direct
                      </h4>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                        Notifications PC & Web
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSound()}
                    title={soundEnabled ? 'Désactiver la sonnerie' : 'Activer la sonnerie'}
                    style={{
                      background: soundEnabled ? '#ECFDF5' : '#F1F5F9',
                      border: `1px solid ${soundEnabled ? '#A7F3D0' : '#CBD5E1'}`,
                      borderRadius: '6px',
                      padding: '4px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: soundEnabled ? '#047857' : '#64748B'
                    }}
                  >
                    {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  </button>
                </div>

                {/* Statut Notifications de Bureau (Mac/PC) */}
                <div style={{
                  padding: '8px 14px',
                  backgroundColor: desktopPermission === 'granted' ? '#F0FDF4' : '#FFFBEB',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Monitor size={14} color={desktopPermission === 'granted' ? '#16A34A' : '#D97706'} />
                    <span style={{ fontWeight: '600', color: desktopPermission === 'granted' ? '#166534' : '#B45309' }}>
                      {desktopPermission === 'granted'
                        ? 'Notifications PC actives'
                        : 'Alertes sur écran inactives'}
                    </span>
                  </div>

                  {desktopPermission === 'granted' ? (
                    <button
                      onClick={testDesktopNotification}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        color: '#166534',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      🔔 Tester
                    </button>
                  ) : (
                    <button
                      onClick={requestDesktopPermission}
                      style={{
                        background: '#1A6FD4',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Autoriser
                    </button>
                  )}
                </div>

                {/* Liste des Alertes */}
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {liveAlerts.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12px', color: '#94A3B8' }}>
                      Aucune alerte récente. Vous recevrez une notification sur votre écran dès qu'un événement survient.
                    </div>
                  ) : (
                    liveAlerts.map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          if (alert.url) navigate(alert.url);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          backgroundColor: alert.is_read ? '#FFFFFF' : '#F8FAFC',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = alert.is_read ? '#FFFFFF' : '#F8FAFC'}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.title}
                            </span>
                            <span style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                              {timeAgo(alert.created_at)}
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#475569', lineHeight: '1.3' }}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Dropdown */}
                <div style={{
                  padding: '8px 14px',
                  backgroundColor: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  textAlign: 'center'
                }}>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      navigate('/notifications');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1A6FD4',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Accéder au Centre Push & Alertes <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div 
            onClick={() => navigate('/settings/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            title="Accéder à mon profil administrateur"
          >
            <div className="header-user-info" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-medium)' }}>{user?.role ?? 'Administrateur'}</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1A6FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 6px rgba(26, 111, 212, 0.25)' }}>
              {initials}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
