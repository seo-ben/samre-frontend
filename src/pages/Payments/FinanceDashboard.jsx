import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';

export const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('wallets'); // 'wallets' or 'transactions'
  const [stats, setStats] = useState({
    total_revenue: 0,
    conversion_rate: 0,
    total_credit_distributed: 0,
    users_with_wallet: 0,
    total_users: 0
  });

  // --- Wallets State ---
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletSearch, setWalletSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('credit'); // credit, debit
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- Transactions State ---
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // 1. Fetch Stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/v1/admin/dashboard/finance');
      if (response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch Wallets
  useEffect(() => {
    if (activeTab === 'wallets') {
      const delay = setTimeout(() => fetchWallets(), 500);
      return () => clearTimeout(delay);
    }
  }, [activeTab, walletSearch]);

  const fetchWallets = async () => {
    try {
      setWalletsLoading(true);
      const response = await apiClient.get('/v1/admin/wallets', { params: { search: walletSearch } });
      if (response.data.status === 'success') {
        setWallets(response.data.data.data || response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWalletsLoading(false);
    }
  };

  // 3. Fetch Transactions
  useEffect(() => {
    if (activeTab === 'transactions') {
      const delay = setTimeout(() => fetchTransactions(), 500);
      return () => clearTimeout(delay);
    }
  }, [activeTab, txSearch, txType, txStatus]);

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const params = { search: txSearch, type: txType, status: txStatus };
      const response = await apiClient.get('/v1/admin/transactions', { params });
      if (response.data.status === 'success' || response.data.data) {
        setTransactions(response.data.data.data || response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  // --- Handlers ---
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
        fetchWallets();
        fetchStats(); // Refresh stats after action
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

  // --- Helpers ---
  const formatCurrency = (val, currency) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'XOF', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: '#DCFCE7', color: '#166534' }}>Complété</span>;
      case 'pending':
        return <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: '#FEF9C3', color: '#854D0E' }}>En attente</span>;
      case 'failed':
      case 'cancelled':
        return <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: '#FEE2E2', color: '#991B1B' }}>Échoué</span>;
      default:
        return <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: 'var(--gray-light)', color: 'var(--gray-medium)' }}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
        
        {/* Header Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--black-deep)', fontFamily: 'var(--font-poppins)' }}>
            Finances & Portefeuilles
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
            Vue globale des revenus, des soldes utilisateurs et de l'historique des transactions.
          </p>
        </div>

        {/* KPIs Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* KPI 1: Revenus Totaux */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--gray-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-money-bill-wave" style={{ fontSize: '20px', color: 'var(--success)' }}></i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>Revenus Totaux</p>
              <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)' }}>
                {formatCurrency(stats.total_revenue, 'XOF')}
              </h3>
            </div>
          </div>

          {/* KPI 2: Taux de conversion */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--gray-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(26, 111, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-chart-line" style={{ fontSize: '20px', color: 'var(--primary-blue)' }}></i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>Taux d'adoption (Wallets)</p>
              <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)' }}>
                {stats.conversion_rate}%
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray-medium)' }}>
                {stats.users_with_wallet} sur {stats.total_users} utilisateurs
              </p>
            </div>
          </div>

          {/* KPI 3: Crédits distribués */}
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--gray-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 166, 35, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-hand-holding-dollar" style={{ fontSize: '20px', color: 'var(--warning)' }}></i>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>Crédits distribués</p>
              <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)' }}>
                {formatCurrency(stats.total_credit_distributed, 'XOF')}
              </h3>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--gray-border)', marginTop: '8px' }}>
          <button
            onClick={() => setActiveTab('wallets')}
            style={{
              padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '15px', fontWeight: '600', color: activeTab === 'wallets' ? 'var(--primary-blue)' : 'var(--gray-medium)',
              borderBottom: activeTab === 'wallets' ? '3px solid var(--primary-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-wallet" style={{ marginRight: '8px' }}></i>
            Portefeuilles ({stats.users_with_wallet})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '15px', fontWeight: '600', color: activeTab === 'transactions' ? 'var(--primary-blue)' : 'var(--gray-medium)',
              borderBottom: activeTab === 'transactions' ? '3px solid var(--primary-blue)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-receipt" style={{ marginRight: '8px' }}></i>
            Historique des Transactions
          </button>
        </div>

        {/* Tab Content: Wallets */}
        {activeTab === 'wallets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)' }}></i>
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 16px 10px 42px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-light)', borderBottom: '1px solid var(--gray-border)' }}>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Utilisateur</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', textAlign: 'right' }}>Solde</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletsLoading ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--primary-blue)', marginBottom: '8px' }}></i><br />Chargement...
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
                                <div style={{ fontSize: '12px', color: 'var(--gray-medium)' }}>{wallet.user?.email || wallet.user?.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', background: 'var(--gray-light)', color: 'var(--black-deep)' }}>
                              {wallet.user?.user_type}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', color: 'var(--black-deep)' }}>
                            {formatCurrency(wallet.balance, wallet.currency)}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => openModal(wallet, 'credit')} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: 'var(--success)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-plus"></i> Créditer
                              </button>
                              <button onClick={() => openModal(wallet, 'debit')} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: 'white', background: 'var(--danger)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          </div>
        )}

        {/* Tab Content: Transactions */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid var(--gray-border)' }}>
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)' }}></i>
                <input
                  type="text"
                  placeholder="Rechercher utilisateur..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div style={{ position: 'relative', width: '200px' }}>
                <select value={txType} onChange={(e) => setTxType(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px', appearance: 'none', background: 'white' }}>
                  <option value="">Tous les types</option>
                  <option value="credit">Crédit (+)</option>
                  <option value="debit">Débit (-)</option>
                </select>
                <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)', pointerEvents: 'none', fontSize: '12px' }}></i>
              </div>
              <div style={{ position: 'relative', width: '200px' }}>
                <select value={txStatus} onChange={(e) => setTxStatus(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px', appearance: 'none', background: 'white' }}>
                  <option value="">Tous les statuts</option>
                  <option value="completed">Complété</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échoué</option>
                </select>
                <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)', pointerEvents: 'none', fontSize: '12px' }}></i>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-light)', borderBottom: '1px solid var(--gray-border)' }}>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Utilisateur</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Motif</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', textAlign: 'center' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--primary-blue)', marginBottom: '8px' }}></i><br />Chargement...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>Aucune transaction trouvée</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--gray-border)' }}>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--gray-medium)' }}>
                            {tx.created_at ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.created_at)) : '-'}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--black-deep)' }}>
                              {tx.wallet?.user?.first_name} {tx.wallet?.user?.last_name} {tx.wallet?.user?.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-medium)' }}>{tx.wallet?.user?.email || tx.wallet?.user?.phone}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--black-deep)' }}>{tx.purpose || '-'}</div>
                            {tx.description && <div style={{ fontSize: '12px', color: 'var(--gray-medium)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</div>}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', color: tx.type === 'credit' ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount, 'XOF')}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            {getStatusBadge(tx.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Credit/Debit (Global) */}
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
