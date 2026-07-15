import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';

export const WalletsPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/wallets', { params: { search: searchTerm } });
      if (response.data.status === 'success') {
        setWallets(response.data.data.data || response.data.data);
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
    if (!amount || isNaN(amount) || amount <= 0) return;
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M ' + (currency || 'XOF');
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k ' + (currency || 'XOF');
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'XOF', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(26, 111, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="fa-solid fa-wallet" style={{ fontSize: '20px', color: 'var(--primary-blue)' }}></i>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)', fontFamily: 'var(--font-poppins)' }}>
                Portefeuilles (Wallets)
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
                Gérez les soldes des utilisateurs
              </p>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)' }}></i>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 42px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-border)'}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 var(--radius-md) var(--radius-md) 0', color: '#B91C1C', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: '2px' }}></i>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray-light)', borderBottom: '1px solid var(--gray-border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Solde</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--primary-blue)' }}></i>
                      <p>Chargement...</p>
                    </td>
                  </tr>
                ) : wallets.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>Aucun portefeuille trouvé</td>
                  </tr>
                ) : (
                  wallets.map((wallet) => (
                    <tr key={wallet.id} style={{ borderBottom: '1px solid var(--gray-border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(26, 111, 212, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', fontWeight: '600', textTransform: 'uppercase'
                          }}>
                            {wallet.user?.first_name?.[0] || wallet.user?.name?.[0] || 'U'}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--black-deep)' }}>
                              {wallet.user?.first_name} {wallet.user?.last_name} {wallet.user?.name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--gray-medium)' }}>
                              {wallet.user?.email || wallet.user?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: 'var(--gray-light)', color: 'var(--black-deep)' }}>
                          {wallet.user?.user_type}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--black-deep)' }}>
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => openModal(wallet, 'credit')}
                            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: 'var(--success)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="fa-solid fa-plus"></i> Créditer
                          </button>
                          <button
                            onClick={() => openModal(wallet, 'debit')}
                            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: 'var(--danger)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <i className="fa-solid fa-minus"></i> Débiter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Credit/Debit */}
        {showModal && selectedWallet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              
              <div style={{ padding: '20px', background: modalType === 'credit' ? '#ECFDF5' : '#FEF2F2', borderBottom: `1px solid ${modalType === 'credit' ? '#D1FAE5' : '#FEE2E2'}` }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: modalType === 'credit' ? '#065F46' : '#991B1B' }}>
                  {modalType === 'credit' ? 'Créditer le portefeuille' : 'Débiter le portefeuille'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--gray-medium)' }}>
                  Utilisateur: {selectedWallet.user?.first_name} {selectedWallet.user?.last_name} {selectedWallet.user?.name}
                </p>
              </div>
              
              <form onSubmit={handleAction} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)', marginBottom: '8px' }}>Montant</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ width: '100%', padding: '10px 48px 10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px' }}
                      placeholder="Ex: 5000"
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)', fontSize: '14px', fontWeight: '500' }}>
                      {selectedWallet.currency || 'XOF'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)', marginBottom: '8px' }}>Motif (visible dans l'historique)</label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px' }}
                    placeholder="Ex: Geste commercial, Correction..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--gray-light)', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'var(--gray-medium)' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', background: modalType === 'credit' ? 'var(--success)' : 'var(--danger)', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'white', display: 'flex', justifyContent: 'center' }}
                  >
                    {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Confirmer'}
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
