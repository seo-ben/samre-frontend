import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { getUserDisplayName, getUserTypeBadge } from './FinanceDashboard';
import { 
  Wallet, Search, RefreshCw, ArrowUpRight, Plus, Minus, 
  ExternalLink, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2 
} from 'lucide-react';

export const WalletsPage = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWallets, setTotalWallets] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('credit'); // credit, debit
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchWallets();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/wallets', { params: { search: searchTerm, page } });
      if (response.data.status === 'success') {
        const d = response.data.data;
        if (d?.data) {
          setWallets(d.data);
          setTotalPages(d.last_page || 1);
          setTotalWallets(d.total || d.data.length);
        } else {
          setWallets(Array.isArray(d) ? d : []);
          setTotalPages(1);
          setTotalWallets(Array.isArray(d) ? d.length : 0);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des portefeuilles.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    if (!purpose.trim()) return;

    try {
      setActionLoading(true);
      const response = await apiClient.post(`/v1/admin/wallets/${selectedWallet.id}/${modalType}`, {
        amount: parseFloat(amount),
        purpose
      });
      if (response.data.status === 'success') {
        setShowModal(false);
        setAmount('');
        setPurpose('');
        fetchWallets(); // Refresh list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (wallet, type) => {
    setSelectedWallet(wallet);
    setModalType(type);
    setAmount('');
    setPurpose('');
    setShowModal(true);
  };

  const formatCurrency = (val, currency) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' ' + (currency || 'FCFA');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(26, 111, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Wallet size={24} color="#1A6FD4" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F172A' }}>
                Portefeuilles (Wallets)
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
                Consultez et ajustez les soldes des utilisateurs ({totalWallets} portefeuilles au total)
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, tél..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px',
                  border: '1px solid #E2E8F0', outline: 'none', fontSize: '13.5px',
                  background: 'white', boxSizing: 'border-box'
                }}
              />
            </div>
            <button 
              onClick={fetchWallets}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '500', fontSize: '13px' }}
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 8px 8px 0', color: '#B91C1C', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type / Profil</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Solde Disponible</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#3B82F6' }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>Chargement des portefeuilles...</p>
                    </td>
                  </tr>
                ) : wallets.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucun portefeuille trouvé</td>
                  </tr>
                ) : (
                  wallets.map((wallet) => {
                    const userName = getUserDisplayName(wallet.user);
                    const userInitials = getInitials(userName);
                    return (
                      <tr key={wallet.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px', flexShrink: 0
                            }}>
                              {userInitials}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                                {userName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748B' }}>
                                {wallet.user?.email || wallet.user?.phone || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {getUserTypeBadge(wallet.user?.user_type)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: '#10B981', fontSize: '14.5px' }}>
                          {formatCurrency(wallet.balance, wallet.currency)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              onClick={() => openModal(wallet, 'credit')}
                              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: '#16A34A', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Créditer le portefeuille"
                            >
                              <Plus size={13} /> Créditer
                            </button>
                            <button
                              onClick={() => openModal(wallet, 'debit')}
                              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Débiter le portefeuille"
                            >
                              <Minus size={13} /> Débiter
                            </button>
                            <button
                              onClick={() => navigate(`/transactions?search=${encodeURIComponent(wallet.user?.email || wallet.user?.phone || '')}`)}
                              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#334155', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Voir les transactions de cet utilisateur"
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                Page {page} sur {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Credit/Debit */}
        {showModal && selectedWallet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              
              <div style={{ padding: '18px 20px', background: modalType === 'credit' ? '#F0FDF4' : '#FEF2F2', borderBottom: `1px solid ${modalType === 'credit' ? '#DCFCE7' : '#FEE2E2'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: modalType === 'credit' ? '#166534' : '#991B1B' }}>
                    {modalType === 'credit' ? 'Créditer le portefeuille (+)' : 'Débiter le portefeuille (-)'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                    Utilisateur : <strong>{getUserDisplayName(selectedWallet.user)}</strong>
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleAction} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Montant</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ width: '100%', padding: '10px 54px 10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Ex: 5000"
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                      {selectedWallet.currency || 'FCFA'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Motif (enregistré dans l'historique)</label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13.5px', boxSizing: 'border-box' }}
                    placeholder="Ex: Geste commercial, Déblocage exceptionnel..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '13.5px' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '11px', borderRadius: '8px', background: modalType === 'credit' ? '#16A34A' : '#DC2626', border: 'none', cursor: 'pointer', fontWeight: '700', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13.5px' }}
                  >
                    {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : 'Confirmer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
