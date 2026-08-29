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
  const [perPage, setPerPage] = useState(30);
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
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, perPage]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/wallets', { 
        params: { search: searchTerm, page, per_page: perPage } 
      });
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
    if (!selectedWallet) return;
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
        showToast(`Opération de ${modalType === 'credit' ? 'crédit' : 'débit'} effectuée avec succès`);
        fetchWallets();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Une erreur est survenue');
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
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wallet size={18} color="white" />
              </div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                Portefeuilles Utilisateurs (Wallets)
              </h1>
            </div>
            <p style={{ margin: '2px 0 0 46px', fontSize: '12.5px', color: '#64748B' }}>
              Gestion des soldes ({totalWallets.toLocaleString('fr-FR')} comptes répertoriés)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={fetchWallets}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', fontWeight: '600', fontSize: '12px' }}
              title="Actualiser"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #E2E8F0' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, tél..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '6px 28px 6px 30px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12.5px',
                background: 'white', boxSizing: 'border-box', height: '32px'
              }}
            />
            {searchTerm && (
              <X 
                size={13} 
                color="#94A3B8" 
                onClick={() => { setSearchTerm(''); setPage(1); }}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} 
              />
            )}
          </div>

          {/* Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500' }}>Afficher :</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '4px 6px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12px',
                background: 'white', height: '32px', fontWeight: '600'
              }}
            >
              <option value="20">20 / page</option>
              <option value="30">30 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

        </div>

        {error && (
          <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '10px 14px', borderRadius: '0 6px 6px 0', color: '#B91C1C', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
            <AlertCircle size={15} />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* High-Density Table */}
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Utilisateur</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Profil</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Solde Disponible</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', width: '180px' }}>Actions Rapides</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px', color: '#3B82F6' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>Chargement des portefeuilles...</p>
                    </td>
                  </tr>
                ) : wallets.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>Aucun portefeuille trouvé</td>
                  </tr>
                ) : (
                  wallets.map((wallet) => {
                    const userName = getUserDisplayName(wallet.user);
                    const userInitials = getInitials(userName);
                    return (
                      <tr key={wallet.id} style={{ borderBottom: '1px solid #F1F5F9', height: '38px', transition: 'background 0.1s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        {/* User */}
                        <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10.5px', flexShrink: 0
                            }}>
                              {userInitials}
                            </div>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {userName}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '6px 12px', color: '#64748B', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                          {wallet.user?.phone || wallet.user?.email || '-'}
                        </td>

                        {/* Profile type */}
                        <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                          {getUserTypeBadge(wallet.user?.user_type)}
                        </td>

                        {/* Balance */}
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', color: '#10B981', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatCurrency(wallet.balance, wallet.currency)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              onClick={() => openModal(wallet, 'credit')}
                              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: 'white', background: '#16A34A', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title="Créditer le portefeuille"
                            >
                              <Plus size={11} /> Créditer
                            </button>
                            <button
                              onClick={() => openModal(wallet, 'debit')}
                              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: 'white', background: '#DC2626', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title="Débiter le portefeuille"
                            >
                              <Minus size={11} /> Débiter
                            </button>
                            <button
                              onClick={() => navigate(`/transactions?search=${encodeURIComponent(wallet.user?.email || wallet.user?.phone || '')}`)}
                              style={{ padding: '3px 6px', fontSize: '11px', fontWeight: '600', color: '#334155', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              title="Voir les transactions de cet utilisateur"
                            >
                              <ExternalLink size={12} />
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
            <div style={{ padding: '10px 14px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({totalWallets} au total)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid #CBD5E1', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: '600' }}
                >
                  <ChevronLeft size={13} /> Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid #CBD5E1', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: '600' }}
                >
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Credit/Debit Form */}
        {showModal && selectedWallet && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
          }}>
            <div style={{
              background: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px',
              overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '16px 20px',
                background: modalType === 'credit' ? '#F0FDF4' : '#FEF2F2',
                borderBottom: `1px solid ${modalType === 'credit' ? '#DCFCE7' : '#FEE2E2'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: modalType === 'credit' ? '#DCFCE7' : '#FEE2E2',
                    color: modalType === 'credit' ? '#16A34A' : '#DC2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {modalType === 'credit' ? <Plus size={16} /> : <Minus size={16} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: modalType === 'credit' ? '#166534' : '#991B1B' }}>
                      {modalType === 'credit' ? 'Créditer le portefeuille (+)' : 'Débiter le portefeuille (-)'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                      {getUserDisplayName(selectedWallet.user)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAction} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Solde actuel</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                    {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Ex: 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #CBD5E1', outline: 'none', fontSize: '13.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    Motif de l'opération *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bonus de bienvenue, Remboursement..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '6px',
                      border: '1px solid #CBD5E1', background: 'white',
                      color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '6px',
                      border: 'none',
                      background: modalType === 'credit' ? '#16A34A' : '#DC2626',
                      color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    {actionLoading ? 'Traitement...' : 'Confirmer'}
                  </button>
                </div>
              </form>
            </div>
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
      </div>
    </MainLayout>
  );
};
