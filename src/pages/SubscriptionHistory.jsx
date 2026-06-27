import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Loader2, AlertCircle, CheckCircle2, X, XCircle, Search, User, CreditCard, Calendar, Filter } from 'lucide-react';

export const SubscriptionHistoryPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isCanceling, setIsCanceling] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtres & Recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/user-subscriptions?status=all');
      setSubscriptions(res.data.data || res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de l'historique des abonnements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Voulez-vous vraiment annuler cet abonnement immédiatement ? Le client perdra ses avantages.")) return;
    try {
      setIsCanceling(id);
      await apiClient.post(`/v1/admin/user-subscriptions/${id}/cancel`);
      showToast("Abonnement annulé avec succès");
      fetchData(); 
    } catch (err) {
      setError("Erreur lors de l'annulation.");
    } finally {
      setIsCanceling(null);
    }
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else if (!searchTerm) {
      setIsSearchExpanded(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(item => {
      const userName = (item.user?.first_name || item.user?.name || '') + ' ' + (item.user?.last_name || '');
      const userEmail = item.user?.email || '';
      const planKey = item.plan?.key || '';
      
      const searchStr = `${userName} ${userEmail} ${planKey}`.toLowerCase();
      const matchSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus ? item.status === selectedStatus : true;
      
      return matchSearch && matchStatus;
    });
  }, [subscriptions, searchTerm, selectedStatus]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStatus = (status) => {
    switch(status) {
      case 'active':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#065F46', fontSize: '12px', fontWeight: '500', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}><CheckCircle2 size={12} /> Actif</span>;
      case 'expired':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#71717A', fontSize: '12px', fontWeight: '500', backgroundColor: '#F4F4F5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E4E4E7' }}>Expiré</span>;
      case 'cancelled':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#991B1B', fontSize: '12px', fontWeight: '500', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}><X size={12} /> Annulé</span>;
      default:
        return <span style={{ fontSize: '12px', color: '#71717A' }}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Historique des Abonnements
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Consultez l'historique complet des souscriptions, incluant les abonnements expirés ou annulés.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: isSearchExpanded || searchTerm ? '#FFF' : 'transparent',
            border: isSearchExpanded || searchTerm ? '1px solid #E4E4E7' : '1px solid transparent',
            borderRadius: '8px',
            padding: isSearchExpanded || searchTerm ? '4px 12px' : '4px',
            transition: 'all 0.3s ease',
            height: '42px',
            boxShadow: isSearchExpanded || searchTerm ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
          }}>
            <button 
              onClick={handleSearchClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: '#71717A', outline: 'none' }}
            >
              <Search size={18} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher (nom, email, plan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {
                if (!searchTerm) setIsSearchExpanded(false);
              }}
              style={{ 
                width: isSearchExpanded || searchTerm ? '250px' : '0px', 
                opacity: isSearchExpanded || searchTerm ? 1 : 0,
                padding: isSearchExpanded || searchTerm ? '0 8px' : '0',
                border: 'none', 
                fontSize: '14px', 
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          <div style={{ position: 'relative', height: '42px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#71717A' }}>
              <Filter size={16} />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ 
                height: '100%', 
                padding: '0 14px 0 36px', 
                borderRadius: '8px', 
                border: '1px solid #E4E4E7', 
                fontSize: '14px', 
                outline: 'none', 
                appearance: 'none', 
                backgroundColor: '#FFF',
                color: '#09090B',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '160px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="expired">Expiré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="#18181B" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ width: '100%', overflow: 'auto', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#FFF', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '25%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Abonné</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '20%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Plan</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '20%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Dates (Début - Fin)</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '10%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Renouvellement</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '10%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Statut</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              ) : filteredSubscriptions.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #E4E4E7', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F4F5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#09090B' }}>
                          {item.user?.first_name || item.user?.name || 'Utilisateur'} {item.user?.last_name || ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717A' }}>{item.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: '500', color: '#09090B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={16} color="#71717A" />
                      {item.plan?.key || 'Plan Inconnu'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#71717A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {formatDate(item.starts_at)} → <strong style={{ color: '#09090B' }}>{formatDate(item.expires_at)}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    {item.auto_renewed ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1D4ED8', fontSize: '12px', fontWeight: '500', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>Automatique</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#71717A', fontSize: '12px', fontWeight: '500', backgroundColor: '#F4F4F5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E4E4E7' }}>Manuel</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    {renderStatus(item.status)}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      {item.status === 'active' ? (
                        <button 
                          onClick={() => handleCancel(item.id)} 
                          disabled={isCanceling === item.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', height: '32px', padding: '0 12px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', cursor: isCanceling === item.id ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', fontSize: '12px', fontWeight: '500', opacity: isCanceling === item.id ? 0.6 : 1 }}
                          title="Annuler l'abonnement"
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        >
                          {isCanceling === item.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Révoquer
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#A1A1AA', fontStyle: 'italic' }}>Aucune action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#10B981', color: '#FFF',
          padding: '12px 24px', borderRadius: '8px',
          fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          animation: 'slideUp 0.3s ease-out', zIndex: 9999
        }}>
          <CheckCircle2 size={20} />
          {toastMessage}
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </MainLayout>
  );
};
