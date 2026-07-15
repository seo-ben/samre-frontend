import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { 
  Wallet, TrendingUp, TrendingDown, Users, Search, Filter, 
  Download, ArrowUpRight, ArrowDownRight, CreditCard, Activity,
  BellRing, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  MoreVertical, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export const FinanceDashboard = () => {
  const [stats, setStats] = useState({
    total_revenue: 0,
    conversion_rate: 0,
    total_credit_distributed: 0,
    users_with_wallet: 0
  });

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [walletPage, setWalletPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [walletSearch, setWalletSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, walletsRes, txRes] = await Promise.all([
        apiClient.get('/v1/admin/dashboard/finance').catch(() => null),
        apiClient.get('/v1/admin/wallets', { params: { search: walletSearch, page: walletPage } }).catch(() => null),
        apiClient.get('/v1/admin/transactions', { params: { search: txSearch, page: txPage } }).catch(() => null)
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
  }, [walletPage, txPage]);

  // Debounced Search
  useEffect(() => {
    const delay = setTimeout(() => {
      setWalletPage(1);
      setTxPage(1);
      fetchData();
    }, 500);
    return () => clearTimeout(delay);
  }, [walletSearch, txSearch]);

  // No charts needed, bottom 4 cards removed.


  // --- Formatting Helpers ---
  const formatCurrencyNumberOnly = (val) => {
    return new Intl.NumberFormat('fr-FR').format(Number(val) || 0);
  };
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(val) || 0);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Finances & Wallets
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Dashboard › Finances & Wallets</p>
          </div>
          <button 
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#334155', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Top KPIs - 4 Columns */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          
          {/* Revenu Total */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #4338CA, #3B82F6)', color: 'white', padding: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.1 }}>
              <TrendingUp size={64} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><TrendingUp size={16} color="white" /></div>
              <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9 }}>Revenu Total</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
              {formatCurrencyNumberOnly(stats?.total_revenue || 0)} <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>FCFA</span>
            </div>
          </div>

          {/* Crédit Distribué */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #064E3B, #059669)', color: 'white', padding: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.1 }}>
              <Wallet size={64} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)' }}><Wallet size={16} color="white" /></div>
              <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9 }}>Crédit Distribué</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
              {formatCurrencyNumberOnly(stats?.total_credit_distributed || 0)} <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>FCFA</span>
            </div>
          </div>

          {/* Taux de Conversion */}
          <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: '#EFF6FF' }}><Activity size={16} color="#3B82F6" /></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Taux de Conversion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(#3B82F6 ${stats?.conversion_rate || 0}%, #F1F5F9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  {stats?.conversion_rate || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Portefeuilles Actifs */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', background: '#FFF7ED' }}><CreditCard size={16} color="#EA580C" /></div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Portefeuilles Actifs</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              {new Intl.NumberFormat('fr-FR').format(stats?.users_with_wallet || 0)}
            </div>
          </div>

        </div>

        {/* Middle Section: Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Wallets Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Portefeuilles</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '200px' }}
                  />
                </div>
                <button style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155' }}>
                  <Filter size={16} /> Filtres
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '16px 24px' }}>Utilisateur</th>
                    <th style={{ padding: '16px 24px' }}>Téléphone</th>
                    <th style={{ padding: '16px 24px' }}>Solde</th>
                    <th style={{ padding: '16px 24px' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.slice(0, 5).map((w, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', ':hover': { background: '#F8FAFC' } }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                            {getInitials(w.user?.name || w.user?.email || 'A')}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{w.user?.name || w.user?.email || 'Anonyme'}</div>
                            <div style={{ color: '#64748B', fontSize: '12px' }}>{w.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontSize: '14px' }}>{w.user?.phone || '-'}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '700', color: '#10B981', fontSize: '14px' }}>{formatCurrency(w.balance || 0)}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></div> Actif
                        </span>
                      </td>
                    </tr>
                  ))}
                  {wallets.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>Aucun portefeuille trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Transactions</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '200px' }}
                  />
                </div>
                <button style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155' }}>
                  <Download size={16} /> Exporter
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '16px 24px' }}>Transaction</th>
                    <th style={{ padding: '16px 24px' }}>Utilisateur</th>
                    <th style={{ padding: '16px 24px' }}>Montant</th>
                    <th style={{ padding: '16px 24px' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>TXN-{(t?.id || 0).toString().padStart(6, '0')}</div>
                        <div style={{ color: '#64748B', fontSize: '12px' }}>{formatDate(t.created_at || new Date())}</div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontSize: '14px' }}>
                        <div style={{ fontWeight: '500' }}>{t.wallet?.user?.name || t.wallet?.user?.email || 'Inconnu'}</div>
                        <div style={{ color: '#94A3B8', fontSize: '12px' }}>{t.wallet?.user?.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'credit' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {t.type === 'credit' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                          {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {t.status === 'completed' ? (
                          <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#DCFCE7', color: '#16A34A', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Complété
                          </span>
                        ) : t.status === 'failed' ? (
                          <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#FEE2E2', color: '#DC2626', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Échoué
                          </span>
                        ) : (
                          <span style={{ padding: '4px 8px', borderRadius: '20px', background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: '600' }}>
                            En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && !loading && (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>Aucune transaction trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};
