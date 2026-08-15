import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { 
  Wallet, TrendingUp, Search, 
  ArrowUpRight, ArrowDownRight, CreditCard, Activity,
  AlertTriangle, CheckCircle2, RefreshCw, X, Plus, Minus,
  ExternalLink, Eye, Layers
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
      return <span style={{ padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8' }}>Candidat</span>;
    case 'company':
      return <span style={{ padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '10px', background: '#F5F3FF', color: '#6D28D9' }}>Entreprise</span>;
    case 'admin':
      return <span style={{ padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '10px', background: '#FEF3C7', color: '#B45309' }}>Admin</span>;
    default:
      return <span style={{ padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '10px', background: '#F1F5F9', color: '#475569' }}>{userType || 'Utilisateur'}</span>;
  }
};

export const getPaymentProviderBadge = (provider) => {
  if (!provider) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>Portefeuille</span>;

  const p = provider.toLowerCase();
  if (p.includes('flooz') || p.includes('moov')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>Moov (Flooz)</span>;
  }
  if (p.includes('tmoney') || p.includes('mixx')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626' }}>TMoney</span>;
  }
  if (p.includes('wave')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#E0F2FE', color: '#0284C7' }}>Wave</span>;
  }
  if (p.includes('mtn')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#FEF9C3', color: '#854D0E' }}>MTN</span>;
  }
  if (p.includes('orange')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#FFEDD5', color: '#C2410C' }}>Orange</span>;
  }
  if (p.includes('stripe') || p.includes('card')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5' }}>Carte</span>;
  }
  if (p.includes('leekpay')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#ECFDF5', color: '#059669' }}>LeekPay</span>;
  }
  if (p.includes('admin') || p.includes('manual')) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#F3E8FF', color: '#7E22CE' }}>Admin</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>{provider.toUpperCase()}</span>;
};

export const getPurposeBadge = (purpose) => {
  switch (purpose) {
    case 'recharge':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#DCFCE7', color: '#166534' }}><i className="fa-solid fa-arrow-down" style={{ fontSize: '9px' }}></i> Recharge</span>;
    case 'call_fee':
    case 'event_participant_call':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}><i className="fa-solid fa-phone" style={{ fontSize: '9px' }}></i> Contact Événement</span>;
    case 'profile_unlock':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#EEF2FF', color: '#4338CA' }}><i className="fa-solid fa-user-check" style={{ fontSize: '9px' }}></i> Déblocage Profil</span>;
    case 'application_unlock':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#E0F2FE', color: '#0369A1' }}><i className="fa-solid fa-file-lines" style={{ fontSize: '9px' }}></i> Candidature</span>;
    case 'subscription':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#F3E8FF', color: '#6B21A8' }}><i className="fa-solid fa-crown" style={{ fontSize: '9px' }}></i> Abonnement</span>;
    case 'boost':
    case 'profile_boost':
    case 'offer_boost':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#FFEDD5', color: '#C2410C' }}><i className="fa-solid fa-bolt" style={{ fontSize: '9px' }}></i> Boost</span>;
    case 'event_publication':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#DBEAFE', color: '#1E40AF' }}><i className="fa-solid fa-calendar-plus" style={{ fontSize: '9px' }}></i> Pub. Événement</span>;
    case 'offer_publication':
    case 'job_publication':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#E0E7FF', color: '#3730A3' }}><i className="fa-solid fa-briefcase" style={{ fontSize: '9px' }}></i> Pub. Offre</span>;
    case 'reward':
    case 'prime':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#FEF9C3', color: '#854D0E' }}><i className="fa-solid fa-medal" style={{ fontSize: '9px' }}></i> Prime</span>;
    case 'sms_fee':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#ECFEFF', color: '#0E7490' }}><i className="fa-solid fa-comment-sms" style={{ fontSize: '9px' }}></i> SMS</span>;
    case 'badge_verification':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#FDF4FF', color: '#86198F' }}><i className="fa-solid fa-certificate" style={{ fontSize: '9px' }}></i> Badge</span>;
    case 'manual_credit':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#DCFCE7', color: '#166534' }}><i className="fa-solid fa-plus-circle" style={{ fontSize: '9px' }}></i> Crédit Manuel</span>;
    case 'manual_debit':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#FEE2E2', color: '#991B1B' }}><i className="fa-solid fa-minus-circle" style={{ fontSize: '9px' }}></i> Débit Manuel</span>;
    case 'refund':
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#ECFDF5', color: '#065F46' }}><i className="fa-solid fa-rotate-left" style={{ fontSize: '9px' }}></i> Remboursement</span>;
    default:
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>{purpose || 'Opération'}</span>;
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
        apiClient.get('/v1/admin/wallets', { params: { search: walletSearch, per_page: 8 } }).catch(() => null),
        apiClient.get('/v1/admin/transactions', { params: { search: txSearch, per_page: 8 } }).catch(() => null)
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
    }, 400);
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
    return new Intl.NumberFormat('fr-FR').format(num) + ' F';
  };
  
  const formatDateCompact = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${mins}`;
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
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden'
  };

  return (
    <MainLayout>
      <div style={{ width: '100%', background: '#F4F6FA', minHeight: '100vh', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Finances & Portefeuilles
            </h1>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Supervision stratégique des soldes et du registre des flux en temps réel.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link 
              to="/wallets"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#0F172A', fontWeight: '600', textDecoration: 'none', fontSize: '12.5px' }}
            >
              <Wallet size={14} color="#3B82F6" />
              Portefeuilles
            </Link>
            <Link 
              to="/transactions"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#3B82F6', border: '1px solid #2563EB', borderRadius: '6px', color: 'white', fontWeight: '600', textDecoration: 'none', fontSize: '12.5px' }}
            >
              <ArrowUpRight size={14} />
              Toutes les Transactions
            </Link>
            <button 
              onClick={fetchData}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
              title="Actualiser les données"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Top KPIs - 4 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          
          {/* Revenu Total */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', color: 'white', padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ padding: '5px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><TrendingUp size={14} color="white" /></div>
              <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9 }}>Revenu Total</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>
              {formatCurrencyNumberOnly(stats?.total_revenue || 0)} <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.85 }}>FCFA</span>
            </div>
          </div>

          {/* Crédit Distribué */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #065F46, #059669)', color: 'white', padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ padding: '5px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><Wallet size={14} color="white" /></div>
              <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9 }}>Crédits Distribués</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>
              {formatCurrencyNumberOnly(stats?.total_credit_distributed || 0)} <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.85 }}>FCFA</span>
            </div>
          </div>

          {/* Taux de Conversion */}
          <div style={{ ...cardStyle, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#EFF6FF' }}><Activity size={14} color="#3B82F6" /></div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Taux de Conversion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{stats?.conversion_rate || 0}%</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Visiteurs convertis</div>
            </div>
          </div>

          {/* Portefeuilles Actifs */}
          <div style={{ ...cardStyle, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#FFF7ED' }}><CreditCard size={14} color="#EA580C" /></div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Portefeuilles Actifs</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
              {new Intl.NumberFormat('fr-FR').format(stats?.users_with_wallet || 0)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Comptes avec solde</div>
          </div>

        </div>

        {/* Middle Section: High-Density Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Wallets Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Portefeuilles Récents</h2>
                <Link to="/wallets" style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Voir tout ({wallets.length}) <ExternalLink size={11} />
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={12} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Filtrer..." 
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  style={{ padding: '4px 8px 4px 26px', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '12px', outline: 'none', width: '130px', height: '28px' }}
                />
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <tr>
                    <th style={{ padding: '7px 12px' }}>Utilisateur</th>
                    <th style={{ padding: '7px 12px' }}>Rôle</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right' }}>Solde</th>
                    <th style={{ padding: '7px 12px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.slice(0, 8).map((w) => {
                    const userName = getUserDisplayName(w.user);
                    const userInitials = getInitials(userName);
                    return (
                      <tr 
                        key={w.id} 
                        onClick={() => setSelectedWallet(w)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', height: '36px', transition: 'background 0.1s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '5px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10.5px', flexShrink: 0 }}>
                              {userInitials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {userName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '5px 12px' }}>
                          {getUserTypeBadge(w.user?.user_type)}
                        </td>
                        <td style={{ padding: '5px 12px', fontWeight: '800', color: '#10B981', fontSize: '12.5px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {formatCurrency(w.balance || 0)}
                        </td>
                        <td style={{ padding: '5px 12px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWallet(w);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '2px 4px' }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {wallets.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>Aucun portefeuille trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Dernières Transactions</h2>
                <Link to="/transactions" style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Voir tout ({transactions.length}) <ExternalLink size={11} />
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={12} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Filtrer..." 
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{ padding: '4px 8px 4px 26px', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '12px', outline: 'none', width: '130px', height: '28px' }}
                />
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <tr>
                    <th style={{ padding: '7px 12px' }}>Motif & Date</th>
                    <th style={{ padding: '7px 12px' }}>Utilisateur</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '7px 12px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((t) => {
                    const txUser = t.wallet?.user;
                    const userName = getUserDisplayName(txUser);
                    const isCredit = t.type === 'credit';
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTx(t)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', height: '36px', transition: 'background 0.1s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '5px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getPurposeBadge(t.purpose)}
                            <span style={{ color: '#64748B', fontSize: '11px' }}>{formatDateCompact(t.created_at)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '5px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            {userName}
                          </div>
                        </td>
                        <td style={{ padding: '5px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: '800', fontSize: '12.5px', color: isCredit ? '#10B981' : '#EF4444' }}>
                            {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td style={{ padding: '5px 12px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(t);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '2px 4px' }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>Aucune transaction trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MODAL: TRANSACTION DETAILS */}
        {selectedTx && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '16px 20px', background: selectedTx.type === 'credit' ? '#F0FDF4' : '#FEF2F2', borderBottom: `1px solid ${selectedTx.type === 'credit' ? '#DCFCE7' : '#FEE2E2'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: selectedTx.type === 'credit' ? '#166534' : '#991B1B' }}>
                      Transaction #{(selectedTx.id || 0).toString().padStart(6, '0')}
                    </span>
                    {getPurposeBadge(selectedTx.purpose)}
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                    {formatDateCompact(selectedTx.created_at)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Amount Banner */}
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Montant</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: selectedTx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                      {selectedTx.type === 'credit' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>
                  <div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Validé
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  
                  {/* User info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Utilisateur</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', color: '#0F172A' }}>{getUserDisplayName(selectedTx.wallet?.user)}</span>
                      <span style={{ marginLeft: '6px' }}>{getUserTypeBadge(selectedTx.wallet?.user?.user_type)}</span>
                    </div>
                  </div>

                  {/* Motif */}
                  {selectedTx.description && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748B', fontWeight: '500' }}>Motif</span>
                      <div style={{ fontWeight: '600', color: '#0F172A', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {selectedTx.description}
                      </div>
                    </div>
                  )}

                  {/* Provider */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Source / Moyen</span>
                    <div>{getPaymentProviderBadge(selectedTx.payment_provider)}</div>
                  </div>

                </div>

                <button
                  onClick={() => setSelectedTx(null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0F172A', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}
                >
                  Fermer
                </button>

              </div>

            </div>
          </div>
        )}

        {/* MODAL: WALLET DETAILS & ACTIONS */}
        {selectedWallet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12)' }}>
              
              {/* Header */}
              <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                    <Wallet size={16} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#0F172A' }}>
                      Portefeuille #{selectedWallet.id}
                    </h3>
                    <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: '#64748B' }}>
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
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px' }}>
                
                {/* Balance display */}
                <div style={{ padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: 'white', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solde Disponible</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '2px', color: '#34D399' }}>
                    {formatCurrency(selectedWallet.balance || 0)}
                  </div>
                </div>

                {/* If action modal is open */}
                {walletActionModal ? (
                  <form onSubmit={handleWalletAction} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: walletActionModal === 'credit' ? '#F0FDF4' : '#FEF2F2', padding: '12px', borderRadius: '8px', border: `1px solid ${walletActionModal === 'credit' ? '#DCFCE7' : '#FEE2E2'}` }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: walletActionModal === 'credit' ? '#166534' : '#991B1B' }}>
                      {walletActionModal === 'credit' ? 'Créditer le portefeuille (+)' : 'Débiter le portefeuille (-)'}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '3px' }}>Montant (FCFA)</label>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="Ex: 5000"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '3px' }}>Motif</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Régularisation, bonus..."
                        value={actionPurpose}
                        onChange={(e) => setActionPurpose(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button 
                        type="button" 
                        onClick={() => setWalletActionModal(null)}
                        style={{ flex: 1, padding: '7px', borderRadius: '5px', background: 'white', border: '1px solid #CBD5E1', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        style={{ flex: 1, padding: '7px', borderRadius: '5px', background: walletActionModal === 'credit' ? '#16A34A' : '#DC2626', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                      >
                        {actionLoading ? '...' : 'Valider'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Action buttons */
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setWalletActionModal('credit')}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '6px', background: '#16A34A', color: 'white', border: 'none', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Créditer
                    </button>
                    <button
                      onClick={() => setWalletActionModal('debit')}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '6px', background: '#DC2626', color: 'white', border: 'none', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      <Minus size={14} /> Débiter
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/transactions?search=${encodeURIComponent(selectedWallet.user?.email || selectedWallet.user?.phone || '')}`);
                      }}
                      style={{ padding: '9px 12px', borderRadius: '6px', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer' }}
                      title="Transactions"
                    >
                      <ExternalLink size={14} />
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
