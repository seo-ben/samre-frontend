import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { 
  Wallet, TrendingUp, Search, 
  ArrowUpRight, ArrowDownRight, CreditCard, Activity,
  AlertTriangle, CheckCircle2, RefreshCw, X, Plus, Minus,
  ExternalLink, ArrowRight, ArrowLeft
} from 'lucide-react';

export const getUserDisplayName = (user) => {
  if (!user) return 'Utilisateur';
  if (user.display_name && user.display_name !== 'Utilisateur') return user.display_name;
  if (user.candidate_profile) {
    const fn = user.candidate_profile.first_name || '';
    const ln = user.candidate_profile.last_name || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
  }
  if (user.candidateProfile) {
    const fn = user.candidateProfile.first_name || '';
    const ln = user.candidateProfile.last_name || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
  }
  if (user.company_profile?.company_name) return user.company_profile.company_name;
  if (user.companyProfile?.company_name) return user.companyProfile.company_name;
  if (user.name) return user.name;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  
  if (user.user_type === 'candidate') {
    return `Candidat${user.phone ? ` (${user.phone})` : ''}`;
  }
  if (user.user_type === 'company') {
    return `Entreprise${user.phone ? ` (${user.phone})` : ''}`;
  }
  if (user.user_type === 'admin') {
    return 'Administrateur';
  }

  if (user.email) return user.email.split('@')[0];
  if (user.phone) return user.phone;
  return 'Utilisateur';
};

export const getUserTypeBadge = (userType) => {
  switch (userType) {
    case 'candidate':
      return <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', background: '#EFF6FF', color: '#1D4ED8' }}>Candidat</span>;
    case 'company':
      return <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', background: '#F5F3FF', color: '#6D28D9' }}>Entreprise</span>;
    case 'admin':
      return <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', background: '#FEF3C7', color: '#B45309' }}>Admin</span>;
    default:
      return <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', background: '#F1F5F9', color: '#475569' }}>{userType || 'Utilisateur'}</span>;
  }
};

export const getPaymentProviderBadge = (provider) => {
  if (!provider) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>Portefeuille SAMRE</span>;

  const p = provider.toLowerCase();
  if (p.includes('flooz') || p.includes('moov')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8' }}>Moov Money (Flooz)</span>;
  }
  if (p.includes('tmoney') || p.includes('mixx')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>TMoney</span>;
  }
  if (p.includes('wave')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#E0F2FE', color: '#0284C7' }}>Wave</span>;
  }
  if (p.includes('mtn')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#FEF9C3', color: '#854D0E' }}>MTN MoMo</span>;
  }
  if (p.includes('orange')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#FFEDD5', color: '#C2410C' }}>Orange Money</span>;
  }
  if (p.includes('stripe') || p.includes('card')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#EEF2FF', color: '#4F46E5' }}>Carte Bancaire</span>;
  }
  if (p.includes('leekpay')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>LeekPay</span>;
  }
  if (p.includes('admin') || p.includes('manual')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#F3E8FF', color: '#7E22CE' }}>Manuel Admin</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', background: '#F1F5F9', color: '#334155' }}>{provider.toUpperCase()}</span>;
};

export const getPurposeBadge = (purpose) => {
  switch (purpose) {
    case 'recharge':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#DCFCE7', color: '#166534' }}><i className="fa-solid fa-arrow-down" style={{ fontSize: '10px' }}></i> Rechargement</span>;
    case 'call_fee':
    case 'event_participant_call':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#FEF3C7', color: '#B45309' }}><i className="fa-solid fa-phone" style={{ fontSize: '10px' }}></i> Contact Événement</span>;
    case 'profile_unlock':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#EEF2FF', color: '#4338CA' }}><i className="fa-solid fa-user-check" style={{ fontSize: '10px' }}></i> Déblocage Profil</span>;
    case 'application_unlock':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}><i className="fa-solid fa-file-lines" style={{ fontSize: '10px' }}></i> Candidature</span>;
    case 'subscription':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#F3E8FF', color: '#6B21A8' }}><i className="fa-solid fa-crown" style={{ fontSize: '10px' }}></i> Abonnement</span>;
    case 'boost':
    case 'profile_boost':
    case 'offer_boost':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#FFEDD5', color: '#C2410C' }}><i className="fa-solid fa-bolt" style={{ fontSize: '10px' }}></i> Boost Visibilité</span>;
    case 'event_publication':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#DBEAFE', color: '#1E40AF' }}><i className="fa-solid fa-calendar-plus" style={{ fontSize: '10px' }}></i> Pub. Événement</span>;
    case 'offer_publication':
    case 'job_publication':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#E0E7FF', color: '#3730A3' }}><i className="fa-solid fa-briefcase" style={{ fontSize: '10px' }}></i> Pub. Offre</span>;
    case 'reward':
    case 'prime':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#FEF9C3', color: '#854D0E' }}><i className="fa-solid fa-medal" style={{ fontSize: '10px' }}></i> Prime Embauche</span>;
    case 'sms_fee':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#ECFEFF', color: '#0E7490' }}><i className="fa-solid fa-comment-sms" style={{ fontSize: '10px' }}></i> Notification SMS</span>;
    case 'badge_verification':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#FDF4FF', color: '#86198F' }}><i className="fa-solid fa-certificate" style={{ fontSize: '10px' }}></i> Vérification Badge</span>;
    case 'manual_credit':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#DCFCE7', color: '#166534' }}><i className="fa-solid fa-plus-circle" style={{ fontSize: '10px' }}></i> Crédit Manuel</span>;
    case 'manual_debit':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#FEE2E2', color: '#991B1B' }}><i className="fa-solid fa-minus-circle" style={{ fontSize: '10px' }}></i> Débit Manuel</span>;
    case 'refund':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#ECFDF5', color: '#065F46' }}><i className="fa-solid fa-rotate-left" style={{ fontSize: '10px' }}></i> Remboursement</span>;
    default:
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>{purpose || 'Transaction'}</span>;
  }
};

export const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_revenue: 0,
    conversion_rate: 0,
    total_credit_distributed: 0,
    users_with_wallet: 0
  });

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [walletSearch, setWalletSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // Modals
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletActionModal, setWalletActionModal] = useState(null); // 'credit' | 'debit'
  const [actionAmount, setActionAmount] = useState('');
  const [actionPurpose, setActionPurpose] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, walletsRes, txRes] = await Promise.all([
        apiClient.get('/v1/admin/dashboard/finance').catch(() => null),
        apiClient.get('/v1/admin/wallets', { params: { search: walletSearch } }).catch(() => null),
        apiClient.get('/v1/admin/transactions', { params: { search: txSearch } }).catch(() => null)
      ]);
      
      if (statsRes?.data?.status === 'success') {
          setStats(statsRes.data.data || {});
      }
      
      if (walletsRes?.data?.status === 'success') {
          const wData = walletsRes.data.data?.data || walletsRes.data.data;
          setWallets(Array.isArray(wData) ? wData : []);
      }
      
      if (txRes?.data?.status === 'success') {
          const tData = txRes.data.data?.data || txRes.data.data;
          setTransactions(Array.isArray(tData) ? tData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Debounced Search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delay);
  }, [walletSearch, txSearch]);

  const handleWalletAction = async (e) => {
    e.preventDefault();
    if (!actionAmount || isNaN(actionAmount) || Number(actionAmount) <= 0) return;
    if (!actionPurpose.trim()) return;

    try {
      setActionLoading(true);
      const response = await apiClient.post(`/v1/admin/wallets/${selectedWallet.id}/${walletActionModal}`, {
        amount: parseFloat(actionAmount),
        purpose: actionPurpose
      });
      if (response.data.status === 'success') {
        setWalletActionModal(null);
        setSelectedWallet(null);
        setActionAmount('');
        setActionPurpose('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Une erreur est survenue lors de l\'opération');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Formatting Helpers ---
  const formatCurrencyNumberOnly = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k';
    }
    return new Intl.NumberFormat('fr-FR').format(num);
  };
  
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U';
  };

  // --- Styles ---
  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden'
  };

  return (
    <MainLayout>
      <div style={{ width: '100%', background: '#F4F6FA', minHeight: '100vh', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Finances & Wallets
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Supervisez l'activité financière, les soldes des portefeuilles et l'historique complet des transactions.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              to="/wallets"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#0F172A', fontWeight: '600', textDecoration: 'none', fontSize: '13.5px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <Wallet size={16} color="#3B82F6" />
              Tous les Portefeuilles
            </Link>
            <Link 
              to="/transactions"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: '#3B82F6', border: '1px solid #2563EB', borderRadius: '8px', color: 'white', fontWeight: '600', textDecoration: 'none', fontSize: '13.5px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(37,99,235,0.2)' }}
            >
              <ArrowUpRight size={16} />
              Toutes les Transactions
            </Link>
            <button 
              onClick={fetchData}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#334155', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              title="Actualiser les données"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Top KPIs - 4 Columns */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Revenu Total */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', color: 'white', padding: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.15 }}>
              <TrendingUp size={54} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><TrendingUp size={16} color="white" /></div>
              <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9 }}>Revenu Total</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              {formatCurrencyNumberOnly(stats?.total_revenue || 0)} <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85 }}>FCFA</span>
            </div>
          </div>

          {/* Crédit Distribué */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #065F46, #059669)', color: 'white', padding: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.15 }}>
              <Wallet size={54} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><Wallet size={16} color="white" /></div>
              <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9 }}>Crédit Distribué</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              {formatCurrencyNumberOnly(stats?.total_credit_distributed || 0)} <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85 }}>FCFA</span>
            </div>
          </div>

          {/* Taux de Conversion */}
          <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: '#EFF6FF' }}><Activity size={16} color="#3B82F6" /></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Taux de Conversion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `conic-gradient(#3B82F6 ${stats?.conversion_rate || 0}%, #F1F5F9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                  {stats?.conversion_rate || 0}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{stats?.conversion_rate || 0}%</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Visiteurs convertis</div>
              </div>
            </div>
          </div>

          {/* Portefeuilles Actifs */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: '#FFF7ED' }}><CreditCard size={16} color="#EA580C" /></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Portefeuilles Actifs</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
              {new Intl.NumberFormat('fr-FR').format(stats?.users_with_wallet || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Comptes avec solde configuré</div>
          </div>

        </div>

        {/* Middle Section: Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Wallets Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Portefeuilles Récents</h2>
                <Link to="/wallets" style={{ fontSize: '12.5px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout ({wallets.length}) <ExternalLink size={12} />
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher utilisateur..." 
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '180px' }}
                />
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '11.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '12px 18px' }}>Utilisateur</th>
                    <th style={{ padding: '12px 18px' }}>Type</th>
                    <th style={{ padding: '12px 18px' }}>Solde</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.slice(0, 7).map((w) => {
                    const userName = getUserDisplayName(w.user);
                    const userInitials = getInitials(userName);
                    return (
                      <tr 
                        key={w.id} 
                        onClick={() => setSelectedWallet(w)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                              {userInitials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                {userName}
                              </div>
                              <div style={{ color: '#64748B', fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                {w.user?.email || w.user?.phone || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {getUserTypeBadge(w.user?.user_type)}
                        </td>
                        <td style={{ padding: '12px 18px', fontWeight: '700', color: '#10B981', fontSize: '13.5px' }}>
                          {formatCurrency(w.balance || 0)}
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWallet(w);
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: '#F1F5F9', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {wallets.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Aucun portefeuille trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Dernières Transactions</h2>
                <Link to="/transactions" style={{ fontSize: '12.5px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout ({transactions.length}) <ExternalLink size={12} />
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher transaction..." 
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '180px' }}
                />
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '11.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '12px 18px' }}>Transaction & Motif</th>
                    <th style={{ padding: '12px 18px' }}>Utilisateur</th>
                    <th style={{ padding: '12px 18px' }}>Montant</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 7).map((t) => {
                    const txUser = t.wallet?.user;
                    const userName = getUserDisplayName(txUser);
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTx(t)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>TXN-{(t?.id || 0).toString().padStart(6, '0')}</span>
                            {getPurposeBadge(t.purpose)}
                          </div>
                          {t.description ? (
                            <div style={{ color: '#475569', fontSize: '11.5px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.description}
                            </div>
                          ) : (
                            <div style={{ color: '#94A3B8', fontSize: '11px' }}>{formatDate(t.created_at)}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {userName}
                          </div>
                          <div style={{ color: '#64748B', fontSize: '11.5px' }}>{txUser?.phone || txUser?.email || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: t.type === 'credit' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {t.type === 'credit' ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(t);
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: '#F1F5F9', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Aucune transaction trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MODAL: TRANSACTION DETAILS */}
        {selectedTx && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', background: selectedTx.type === 'credit' ? '#F0FDF4' : '#FEF2F2', borderBottom: `1px solid ${selectedTx.type === 'credit' ? '#DCFCE7' : '#FEE2E2'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '17px', fontWeight: '800', color: selectedTx.type === 'credit' ? '#166534' : '#991B1B' }}>
                      Transaction TXN-{(selectedTx.id || 0).toString().padStart(6, '0')}
                    </span>
                    {getPurposeBadge(selectedTx.purpose)}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                    {formatDate(selectedTx.created_at)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Amount Banner */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Montant de la transaction</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: selectedTx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                      {selectedTx.type === 'credit' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>
                  <div>
                    {selectedTx.status === 'completed' ? (
                      <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', fontSize: '12.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={14} /> Complété
                      </span>
                    ) : selectedTx.status === 'failed' ? (
                      <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#FEE2E2', color: '#DC2626', fontSize: '12.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <AlertTriangle size={14} /> Échoué
                      </span>
                    ) : (
                      <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#FEF3C7', color: '#D97706', fontSize: '12.5px', fontWeight: '700' }}>
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* User info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Utilisateur</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                        {getUserDisplayName(selectedTx.wallet?.user)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {selectedTx.wallet?.user?.phone || selectedTx.wallet?.user?.email || '-'}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        {getUserTypeBadge(selectedTx.wallet?.user?.user_type)}
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Type de mouvement</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A', textTransform: 'capitalize' }}>
                      {selectedTx.type === 'credit' ? 'Crédit (+)' : 'Débit (-)'}
                    </span>
                  </div>

                  {/* Balances Before & After if available */}
                  {(selectedTx.balance_before !== undefined || selectedTx.balance_after !== undefined) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Solde avant</div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{formatCurrency(selectedTx.balance_before || 0)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Solde après</div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: selectedTx.type === 'credit' ? '#16A34A' : '#0F172A' }}>{formatCurrency(selectedTx.balance_after || 0)}</div>
                      </div>
                    </div>
                  )}

                  {/* Motif / Description */}
                  {selectedTx.description && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Motif détaillé</span>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        {selectedTx.description}
                      </div>
                    </div>
                  )}

                  {/* Payment provider */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Moyen de paiement / Source</span>
                    <div>
                      {getPaymentProviderBadge(selectedTx.payment_provider)}
                    </div>
                  </div>

                  {/* External ref */}
                  {selectedTx.external_ref && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Référence externe</span>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                        {selectedTx.external_ref}
                      </span>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => setSelectedTx(null)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0F172A', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                  >
                    Fermer
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODAL: WALLET DETAILS & ACTIONS */}
        {selectedWallet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              
              {/* Header */}
              <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                      Portefeuille #{selectedWallet.id}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                      {getUserDisplayName(selectedWallet.user)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedWallet(null);
                    setWalletActionModal(null);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px' }}>
                
                {/* Balance display */}
                <div style={{ padding: '18px', borderRadius: '12px', background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: 'white', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solde Actuel Disponible</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: '#34D399' }}>
                    {formatCurrency(selectedWallet.balance || 0)}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                    Devise : {selectedWallet.currency || 'XOF / FCFA'}
                  </div>
                </div>

                {/* User details card */}
                <div style={{ padding: '14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Nom complet</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{getUserDisplayName(selectedWallet.user)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Rôle / Type</span>
                    <span>{getUserTypeBadge(selectedWallet.user?.user_type)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Téléphone</span>
                    <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '500' }}>{selectedWallet.user?.phone || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Email</span>
                    <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '500' }}>{selectedWallet.user?.email || '-'}</span>
                  </div>
                </div>

                {/* If action modal is open (Credit/Debit form) */}
                {walletActionModal ? (
                  <form onSubmit={handleWalletAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: walletActionModal === 'credit' ? '#F0FDF4' : '#FEF2F2', padding: '16px', borderRadius: '10px', border: `1px solid ${walletActionModal === 'credit' ? '#DCFCE7' : '#FEE2E2'}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: walletActionModal === 'credit' ? '#166534' : '#991B1B' }}>
                      {walletActionModal === 'credit' ? 'Créditer le portefeuille (+)' : 'Débiter le portefeuille (-)'}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Montant (FCFA)</label>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="Ex: 5000"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Motif de l'opération</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Bonus de bienvenue, Régularisation..."
                        value={actionPurpose}
                        onChange={(e) => setActionPurpose(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => setWalletActionModal(null)}
                        style={{ flex: 1, padding: '9px', borderRadius: '6px', background: 'white', border: '1px solid #CBD5E1', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        style={{ flex: 1, padding: '9px', borderRadius: '6px', background: walletActionModal === 'credit' ? '#16A34A' : '#DC2626', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                      >
                        {actionLoading ? 'Traitement...' : 'Confirmer'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Action buttons */
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setWalletActionModal('credit')}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '8px', background: '#16A34A', color: 'white', border: 'none', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Créditer
                    </button>
                    <button
                      onClick={() => setWalletActionModal('debit')}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '8px', background: '#DC2626', color: 'white', border: 'none', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
                    >
                      <Minus size={16} /> Débiter
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/transactions?search=${encodeURIComponent(selectedWallet.user?.email || selectedWallet.user?.phone || '')}`);
                      }}
                      style={{ padding: '11px 14px', borderRadius: '8px', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer' }}
                      title="Voir toutes les transactions de cet utilisateur"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
