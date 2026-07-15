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
        return <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '30px', background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', border: '1px solid rgba(34, 197, 94, 0.2)' }}>Complété</span>;
      case 'pending':
        return <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '30px', background: 'rgba(234, 179, 8, 0.1)', color: '#CA8A04', border: '1px solid rgba(234, 179, 8, 0.2)' }}>En attente</span>;
      case 'failed':
      case 'cancelled':
        return <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '30px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Échoué</span>;
      default:
        return <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '30px', background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      {/* Inject Custom CSS for Animations and Hover Effects */}
      <style>{`
        .finance-card {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .finance-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        }
        .finance-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0; width: 100px; height: 100px;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
          opacity: 0.1;
          border-radius: 50%;
          transform: translate(30%, -30%);
        }
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
        .table-row {
          transition: background-color 0.2s ease;
        }
        .table-row:hover {
          background-color: #F8FAFC !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
        .modal-overlay {
          animation: fadeIn 0.3s ease-out forwards;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 32px 64px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #1A6FD4 0%, #0D47A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(26, 111, 212, 0.3)' }}>
                <i className="fa-solid fa-vault" style={{ color: 'white', fontSize: '18px' }}></i>
              </div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
                Finances & Portefeuilles
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748B', fontWeight: '500' }}>
              Pilotez la santé financière de la plateforme en temps réel.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', background: '#F1F5F9', padding: '6px', borderRadius: '12px' }}>
             <button
              onClick={() => setActiveTab('wallets')}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', 
                background: activeTab === 'wallets' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'wallets' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'wallets' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <i className="fa-solid fa-wallet"></i>
              Portefeuilles
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', 
                background: activeTab === 'transactions' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'transactions' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'transactions' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <i className="fa-solid fa-receipt"></i>
              Historique
            </button>
          </div>
        </div>

        {/* KPIs Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* KPI 1: Revenus Totaux */}
          <div className="finance-card" style={{ 
            background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', 
            borderRadius: '20px', padding: '28px', color: 'white',
            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenus Réels</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
                  {formatCurrency(stats.total_revenue, 'XOF')}
                </h3>
              </div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '24px', color: 'white' }}></i>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
              <i className="fa-solid fa-arrow-trend-up" style={{ color: '#A7F3D0' }}></i>
              <span>Total des recharges confirmées</span>
            </div>
          </div>

          {/* KPI 2: Crédits distribués */}
          <div className="finance-card" style={{ 
            background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)', 
            borderRadius: '20px', padding: '28px', color: 'white',
            boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Crédité</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
                  {formatCurrency(stats.total_credit_distributed, 'XOF')}
                </h3>
              </div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <i className="fa-solid fa-coins" style={{ fontSize: '24px', color: 'white' }}></i>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
              <i className="fa-solid fa-gift" style={{ color: '#FDE68A' }}></i>
              <span>Inclut recharges et bonus manuels</span>
            </div>
          </div>

          {/* KPI 3: Taux de conversion */}
          <div className="finance-card" style={{ 
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', 
            borderRadius: '20px', padding: '28px', color: 'white',
            boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adoption Portefeuille</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
                  {stats.conversion_rate}%
                </h3>
              </div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <i className="fa-solid fa-users" style={{ fontSize: '24px', color: 'white' }}></i>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
               <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.conversion_rate}%`, height: '100%', background: '#BFDBFE', borderRadius: '3px' }}></div>
               </div>
            </div>
             <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                {stats.users_with_wallet} / {stats.total_users} utilisateurs
              </p>
          </div>

        </div>

        {/* Content Area */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', padding: '24px' }}>
          
          {/* Tab Content: Wallets */}
          {activeTab === 'wallets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>Gestion des soldes</h2>
                <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
                  <input
                    type="text"
                    placeholder="Rechercher (Nom, Email, Tél)..."
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
                      border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px',
                      background: '#F8FAFC', transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.background = '#FFFFFF'; e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.target.style.background = '#F8FAFC'; e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="custom-scrollbar" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utilisateur</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profil</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Solde Actuel</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Opérations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletsLoading ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '64px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          <p style={{ marginTop: '16px', color: '#64748B', fontWeight: '500' }}>Chargement des portefeuilles...</p>
                        </td>
                      </tr>
                    ) : wallets.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '64px', textAlign: 'center' }}>
                           <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                             <i className="fa-solid fa-wallet" style={{ fontSize: '32px', color: '#94A3B8' }}></i>
                           </div>
                           <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>Aucun portefeuille trouvé</p>
                           <p style={{ margin: '8px 0 0', color: '#64748B' }}>Modifiez votre recherche pour trouver un utilisateur.</p>
                        </td>
                      </tr>
                    ) : (
                      wallets.map((wallet) => (
                        <tr key={wallet.id} className="table-row" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{
                                width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', fontWeight: '700', fontSize: '18px', textTransform: 'uppercase'
                              }}>
                                {wallet.user?.first_name?.[0] || wallet.user?.name?.[0] || 'U'}
                              </div>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                                  {wallet.user?.first_name} {wallet.user?.last_name} {wallet.user?.name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <i className="fa-regular fa-envelope" style={{ fontSize: '11px' }}></i> {wallet.user?.email || 'N/A'}
                                  <span style={{ color: '#CBD5E1' }}>|</span>
                                  <i className="fa-solid fa-phone" style={{ fontSize: '11px' }}></i> {wallet.user?.phone || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ 
                              padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '30px', 
                              background: wallet.user?.user_type === 'candidate' ? '#F0FDF4' : '#F8FAFC', 
                              color: wallet.user?.user_type === 'candidate' ? '#16A34A' : '#475569',
                              border: `1px solid ${wallet.user?.user_type === 'candidate' ? '#BBF7D0' : '#E2E8F0'}`,
                              textTransform: 'capitalize'
                            }}>
                              {wallet.user?.user_type}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                              {formatCurrency(wallet.balance, wallet.currency)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button className="action-btn" onClick={() => openModal(wallet, 'credit')} title="Créditer" style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-plus"></i>
                              </button>
                              <button className="action-btn" onClick={() => openModal(wallet, 'debit')} title="Débiter" style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-minus"></i>
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
          )}

          {/* Tab Content: Transactions */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>Dernières Transactions</h2>
              </div>

              {/* Toolbar */}
              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid #E2E8F0' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                  <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', background: 'white' }}
                  />
                </div>
                <div style={{ position: 'relative', width: '220px' }}>
                  <select value={txType} onChange={(e) => setTxType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', appearance: 'none', background: 'white', fontWeight: '500', color: '#475569' }}>
                    <option value="">🔄 Tous les types</option>
                    <option value="credit">🟢 Crédits (Entrées)</option>
                    <option value="debit">🔴 Débits (Sorties)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', fontSize: '12px' }}></i>
                </div>
                <div style={{ position: 'relative', width: '220px' }}>
                  <select value={txStatus} onChange={(e) => setTxStatus(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', appearance: 'none', background: 'white', fontWeight: '500', color: '#475569' }}>
                    <option value="">🎯 Tous les statuts</option>
                    <option value="completed">✅ Complété</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="failed">❌ Échoué</option>
                  </select>
                  <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', fontSize: '12px' }}></i>
                </div>
              </div>

              {/* Table */}
              <div className="custom-scrollbar" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utilisateur</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motif</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading ? (
                      <tr>
                         <td colSpan="5" style={{ padding: '64px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          <p style={{ marginTop: '16px', color: '#64748B', fontWeight: '500' }}>Recherche des transactions...</p>
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '64px', textAlign: 'center' }}>
                           <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                             <i className="fa-solid fa-receipt" style={{ fontSize: '32px', color: '#94A3B8' }}></i>
                           </div>
                           <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>Aucune transaction trouvée</p>
                           <p style={{ margin: '8px 0 0', color: '#64748B' }}>Modifiez vos filtres de recherche.</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="table-row" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                              {tx.created_at ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(tx.created_at)) : '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                               {tx.created_at ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(tx.created_at)) : ''}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                              {tx.wallet?.user?.first_name} {tx.wallet?.user?.last_name} {tx.wallet?.user?.name}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{tx.wallet?.user?.email || tx.wallet?.user?.phone}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'inline-block', padding: '4px 10px', background: '#F1F5F9', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                               {tx.purpose || 'Transaction'}
                            </div>
                            {tx.description && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.description}>{tx.description}</div>}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                             <div style={{ 
                                fontSize: '16px', fontWeight: '800', 
                                color: tx.type === 'credit' ? '#10B981' : '#EF4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'
                              }}>
                               {tx.type === 'credit' ? <i className="fa-solid fa-arrow-turn-down" style={{ fontSize: '12px' }}></i> : <i className="fa-solid fa-arrow-turn-up" style={{ fontSize: '12px' }}></i>}
                               {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount, 'XOF')}
                            </div>
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
          )}
        </div>

        {/* Modal Credit/Debit (Global) */}
        {showModal && selectedWallet && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="modal-content" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '24px 24px 20px', background: modalType === 'credit' ? 'linear-gradient(to right, #ECFDF5, #ffffff)' : 'linear-gradient(to right, #FEF2F2, #ffffff)', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: modalType === 'credit' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`fa-solid ${modalType === 'credit' ? 'fa-plus' : 'fa-minus'}`} style={{ color: 'white', fontSize: '14px' }}></i>
                     </div>
                     <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                       {modalType === 'credit' ? 'Créditer le compte' : 'Débiter le compte'}
                     </h3>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-user" style={{ fontSize: '11px' }}></i>
                    {selectedWallet.user?.first_name} {selectedWallet.user?.last_name} {selectedWallet.user?.name}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px', padding: 0 }}>&times;</button>
              </div>
              
              <form onSubmit={handleAction} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montant</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ 
                        width: '100%', padding: '14px 60px 14px 16px', borderRadius: '12px', 
                        border: '2px solid #E2E8F0', outline: 'none', fontSize: '18px', fontWeight: '700', color: '#0F172A',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = modalType === 'credit' ? '#10B981' : '#EF4444'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                      placeholder="0"
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: '14px', fontWeight: '700' }}>
                      {selectedWallet.currency || 'XOF'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motif de l'opération</label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ 
                       width: '100%', padding: '14px 16px', borderRadius: '12px', 
                       border: '2px solid #E2E8F0', outline: 'none', fontSize: '14px',
                       transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    placeholder="Ex: Geste commercial, Correction d'erreur..."
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94A3B8' }}>Ce motif sera visible dans l'historique des transactions.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '12px', background: '#F1F5F9', border: 'none', 
                      cursor: 'pointer', fontWeight: '700', color: '#475569', transition: 'background 0.2s' 
                    }}
                    onMouseOver={(e) => e.target.style.background = '#E2E8F0'}
                    onMouseOut={(e) => e.target.style.background = '#F1F5F9'}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '12px', 
                      background: modalType === 'credit' ? '#10B981' : '#EF4444', 
                      border: 'none', cursor: 'pointer', fontWeight: '700', color: 'white', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      boxShadow: modalType === 'credit' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = modalType === 'credit' ? '0 6px 16px rgba(16, 185, 129, 0.4)' : '0 6px 16px rgba(239, 68, 68, 0.4)'; }}
                    onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = modalType === 'credit' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)'; }}
                  >
                    {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : (
                      <>
                        <i className={`fa-solid ${modalType === 'credit' ? 'fa-check' : 'fa-check'}`}></i>
                        Confirmer
                      </>
                    )}
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
