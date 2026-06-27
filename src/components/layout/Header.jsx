import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Helper de correspondance des routes pour le fil d'Ariane (Breadcrumbs)
const getBreadcrumbs = (path) => {
  if (path === '/dashboard') {
    return { parent: 'Tableau de Bord', child: '' };
  }
  if (path.startsWith('/users')) {
    return { parent: 'Utilisateurs', child: '' };
  }
  if (path.startsWith('/offers/pending')) {
    return { parent: 'Offres', child: 'En attente' };
  }
  if (path.startsWith('/offers/approved')) {
    return { parent: 'Offres', child: 'Validées' };
  }
  if (path.startsWith('/offers/expired')) {
    return { parent: 'Offres', child: 'Expirées' };
  }
  if (path.startsWith('/offers')) {
    return { parent: 'Offres', child: 'Toutes les offres' };
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
  if (path.startsWith('/applications')) {
    return { parent: 'Candidatures', child: 'Toutes les candidatures' };
  }
  if (path.startsWith('/badges/pending')) {
    return { parent: 'Badges & Vérifications', child: 'En attente' };
  }
  if (path.startsWith('/badges/candidates')) {
    return { parent: 'Badges & Vérifications', child: 'Candidats vérifiés' };
  }
  if (path.startsWith('/badges/companies')) {
    return { parent: 'Badges & Vérifications', child: 'Entreprises vérifiées' };
  }
  if (path.startsWith('/payments/transactions')) {
    return { parent: 'Paiements & Wallets', child: 'Transactions' };
  }
  if (path.startsWith('/payments/wallets')) {
    return { parent: 'Paiements & Wallets', child: 'Wallets' };
  }
  if (path.startsWith('/payments/revenue')) {
    return { parent: 'Paiements & Wallets', child: 'Revenus' };
  }
  if (path.startsWith('/payments/conversion')) {
    return { parent: 'Paiements & Wallets', child: 'Taux de conversion' };
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
  if (path.startsWith('/notifications/history')) {
    return { parent: 'Notifications', child: 'Historique' };
  }
  if (path.startsWith('/notifications/target')) {
    return { parent: 'Notifications', child: 'Ciblage' };
  }
  if (path.startsWith('/cms/ads')) {
    return { parent: 'CMS — Contenu', child: 'Pages publicitaires' };
  }
  if (path.startsWith('/cms/languages')) {
    return { parent: 'CMS — Contenu', child: 'Langues' };
  }
  if (path.startsWith('/cms/locations')) {
    return { parent: 'CMS — Contenu', child: 'Zones géographiques' };
  }
  if (path.startsWith('/cms/offer-cats')) {
    return { parent: 'CMS — Contenu', child: 'Catégories d\'offres' };
  }
  if (path.startsWith('/cms/event-cats')) {
    return { parent: 'CMS — Contenu', child: 'Catégories d\'événements' };
  }
  if (path.startsWith('/cms/quotas')) {
    return { parent: 'CMS — Contenu', child: 'Règles de quota' };
  }
  if (path.startsWith('/cms/blur')) {
    return { parent: 'CMS — Contenu', child: 'Champs floutés' };
  }
  if (path.startsWith('/stats/users')) {
    return { parent: 'Statistiques', child: 'Stats utilisateurs' };
  }
  if (path.startsWith('/stats/companies')) {
    return { parent: 'Statistiques', child: 'Stats entreprises' };
  }
  if (path.startsWith('/stats/offers')) {
    return { parent: 'Statistiques', child: 'Stats offres' };
  }
  if (path.startsWith('/stats/applications')) {
    return { parent: 'Statistiques', child: 'Stats candidatures' };
  }
  if (path.startsWith('/stats/events')) {
    return { parent: 'Statistiques', child: 'Stats événements' };
  }
  if (path.startsWith('/stats/revenue')) {
    return { parent: 'Statistiques', child: 'Stats revenus' };
  }
  if (path.startsWith('/stats/exports')) {
    return { parent: 'Statistiques', child: 'Exports' };
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
  const location = useLocation();

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const fullName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Admin'
    : 'Admin';

  const { parent, child } = getBreadcrumbs(location.pathname);

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
        zIndex: 10
      }}>
        
        {/* Left section: Breadcrumb */}
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

        {/* Right section: Search & Actions */}
        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          <div className="header-search" style={{ position: 'relative' }}>
            <Search size={16} color="var(--gray-medium)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              style={{
                background: 'var(--gray-light)',
                border: '1px solid var(--gray-border)',
                borderRadius: '12px',
                padding: '8px 12px 8px 36px',
                width: '280px',
                fontFamily: 'var(--font-inter)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={22} color="var(--primary-dark)" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div className="header-user-info" style={{ textAlign: 'right', fontFamily: 'var(--font-inter)' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--black-deep)' }}>
                {fullName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-medium)', marginTop: '2px' }}>
                {user?.role ?? 'Administrateur'}
              </div>
            </div>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1A6FD4, #0052ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}>
              {initials}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
