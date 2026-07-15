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
    users_with_wallet: 0,
    total_users: 0
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

  // --- Chart Data Calculations ---
  
  // 1. Transaction Breakdown (Donut)
  const txBreakdown = useMemo(() => {
    if (!Array.isArray(transactions)) return [{ name: 'Aucun', value: 1, color: '#E2E8F0' }];
    const credits = transactions.filter(t => t.type === 'credit').length;
    const debits = transactions.filter(t => t.type === 'debit').length;
    return [
      { name: 'Crédits', value: credits || 1, color: '#3B82F6' },
      { name: 'Débits', value: debits || 1, color: '#EF4444' }
    ];
  }, [transactions]);

  // 2. Payment Methods
  const paymentMethods = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    const counts = {};
    transactions.forEach(t => {
      const provider = t.payment_provider || 'Inconnu';
      counts[provider] = (counts[provider] || 0) + 1;
    });
    const total = Math.max(1, transactions.length);
    return Object.entries(counts).map(([name, count], index) => {
      const colors = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6'];
      return {
        name: name === 'system_admin' ? 'Admin' : name,
        percent: ((count / total) * 100).toFixed(1),
        count,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [transactions]);

  // 3. Revenue Evolution (Mocked from recent tx for visual)
  const revenueData = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) return Array.from({length: 7}, (_, i) => ({ name: `J-${6-i}`, total: 0 }));
    const recent = [...transactions].reverse().slice(0, 10);
    return recent.map((t, i) => ({
      name: `TX-${i}`,
      total: parseFloat(t.amount || 0)
    }));
  }, [transactions]);

  // 4. Alerts
  const alerts = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.slice(0, 4).map(t => ({
      id: t.id,
      title: t.status === 'failed' ? 'Transaction échouée' : t.type === 'credit' ? 'Crédit important' : 'Nouveau retrait',
      desc: `${t.type === 'credit' ? '+' : '-'}${formatCurrency(t.amount || 0)} par ${t.wallet?.user?.name || 'Inconnu'}`,
      type: t.status === 'failed' ? 'error' : t.type === 'credit' ? 'success' : 'warning',
      time: 'Récemment'
    }));
  }, [transactions]);


  // --- Formatting Helpers ---
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
    borderRadius: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden'
  };

  return (
    <MainLayout>
      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        
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

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          
          {/* Revenu Total */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #4338CA, #3B82F6)', color: 'white', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <TrendingUp size={120} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}><TrendingUp size={20} color="white" /></div>
              <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>Revenu Total</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              {formatCurrency(stats?.total_revenue || 0).replace('FCFA', '')} <span style={{ fontSize: '16px', fontWeight: '600', opacity: 0.8 }}>FCFA</span>
            </div>
            <div style={{ fontSize: '12px', color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} color="#34D399" /> <span style={{ color: '#34D399', fontWeight: '600' }}>+12.5%</span> vs mois précédent
            </div>
          </div>

          {/* Crédit Distribué */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #047857, #10B981)', color: 'white', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Wallet size={120} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}><Wallet size={20} color="white" /></div>
              <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>Crédit Distribué</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              {formatCurrency(stats?.total_credit_distributed || 0).replace('FCFA', '')} <span style={{ fontSize: '16px', fontWeight: '600', opacity: 0.8 }}>FCFA</span>
            </div>
            <div style={{ fontSize: '12px', color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} color="#A7F3D0" /> <span style={{ color: '#A7F3D0', fontWeight: '600' }}>+18.7%</span> vs mois précédent
            </div>
          </div>

          {/* Taux de Conversion */}
          <div style={{ ...cardStyle, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#EFF6FF', padding: '8px', borderRadius: '8px' }}><Activity size={20} color="#3B82F6" /></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>Taux de Conversion</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                {stats?.conversion_rate || 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={14} color="#10B981" /> <span style={{ color: '#10B981', fontWeight: '600' }}>+5.3%</span> vs hier
              </div>
            </div>
            {/* Circular Progress */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(#3B82F6 ${stats?.conversion_rate || 0}%, #E2E8F0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                {stats?.conversion_rate || 0}%
              </div>
            </div>
          </div>

          {/* Portefeuilles Actifs */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#FFF7ED', padding: '8px', borderRadius: '8px' }}><CreditCard size={20} color="#EA580C" /></div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>Portefeuilles Actifs</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              {new Intl.NumberFormat('fr-FR').format(stats?.users_with_wallet || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} color="#10B981" /> <span style={{ color: '#10B981', fontWeight: '600' }}>+9.1%</span> vs mois précédent
            </div>
          </div>

          {/* Utilisateurs Totaux */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#FAF5FF', padding: '8px', borderRadius: '8px' }}><Users size={20} color="#9333EA" /></div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>Utilisateurs Totaux</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              {new Intl.NumberFormat('fr-FR').format(stats?.total_users || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} color="#10B981" /> <span style={{ color: '#10B981', fontWeight: '600' }}>+11.4%</span> vs mois précédent
            </div>
          </div>

        </div>

        {/* Middle Section: Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
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

        {/* Bottom Section: Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Pie Chart */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 24px 0' }}>Répartition des Transactions</h3>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={txBreakdown} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {txBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => new Intl.NumberFormat('fr-FR').format(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
              {txBreakdown.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart (Payment Methods) */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 24px 0' }}>Volume par Méthode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              {paymentMethods.map((pm, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ fontWeight: '500', color: '#334155' }}>{pm.name}</span>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>{pm.percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pm.percent}%`, height: '100%', background: pm.color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
              {paymentMethods.length === 0 && <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>Pas assez de données</div>}
            </div>
          </div>

          {/* Line Chart */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 24px 0' }}>Évolution du Revenu</h3>
            <div style={{ height: '220px', width: '100%', marginLeft: '-20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(0)}k` : value} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Montant']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: 0 }}>Alertes & Activités</h3>
              <MoreVertical size={18} color="#94A3B8" style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {alerts.map((alert, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: alert.type === 'error' ? '#FEE2E2' : alert.type === 'success' ? '#DCFCE7' : '#FEF3C7',
                    color: alert.type === 'error' ? '#DC2626' : alert.type === 'success' ? '#16A34A' : '#D97706'
                  }}>
                    <BellRing size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{alert.title}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{alert.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{alert.desc}</p>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '20px' }}>Aucune alerte</div>}
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};
