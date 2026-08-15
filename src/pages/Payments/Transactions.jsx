import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { getUserDisplayName, getUserTypeBadge, getPurposeBadge, getPaymentProviderBadge } from './FinanceDashboard';
import { 
  ReceiptText, Search, RefreshCw, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle2, Download,
  Filter, Eye, ArrowUpDown, TrendingUp, TrendingDown, DollarSign,
  Calendar, Layers, Check, CreditCard, Wallet
} from 'lucide-react';

export const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState(''); // credit, debit
  const [statusFilter, setStatusFilter] = useState(''); // completed, pending, failed
  const [providerFilter, setProviderFilter] = useState('');
  const [perPage, setPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [selectedTx, setSelectedTx] = useState(null);

  // Statistics calculation for strategic header
  const stats = useMemo(() => {
    let creditTotal = 0;
    let debitTotal = 0;
    let completedCount = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.status === 'completed' || !t.status) {
        completedCount++;
        if (t.type === 'credit') creditTotal += amt;
        else debitTotal += amt;
      }
    });

    return {
      creditTotal,
      debitTotal,
      netVolume: creditTotal - debitTotal,
      completedCount
    };
  }, [transactions]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, typeFilter, statusFilter, providerFilter, page, perPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        provider: providerFilter,
        page,
        per_page: perPage
      };
      const response = await apiClient.get('/v1/admin/transactions', { params });
      if (response.data.status === 'success' || response.data.data) {
        const d = response.data.data;
        if (d?.data) {
          setTransactions(d.data);
          setTotalPages(d.last_page || 1);
          setTotalCount(d.total || d.data.length);
        } else {
          setTransactions(Array.isArray(d) ? d : []);
          setTotalPages(1);
          setTotalCount(Array.isArray(d) ? d.length : 0);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des transactions.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', fontSize: '10.5px', fontWeight: '700', borderRadius: '10px', background: '#DCFCE7', color: '#166534' }}><CheckCircle2 size={11} /> Validé</span>;
      case 'pending':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', fontSize: '10.5px', fontWeight: '700', borderRadius: '10px', background: '#FEF9C3', color: '#854D0E' }}>En attente</span>;
      case 'failed':
      case 'cancelled':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', fontSize: '10.5px', fontWeight: '700', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B' }}><AlertTriangle size={11} /> Échoué</span>;
      default:
        return <span style={{ padding: '2px 6px', fontSize: '10.5px', fontWeight: '600', borderRadius: '8px', background: '#F1F5F9', color: '#475569' }}>{status}</span>;
    }
  };

  const formatDateCompact = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch (_) {
      return dateString;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' F';
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header & Strategic Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ReceiptText size={18} color="white" />
              </div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                Registre Stratégique des Transactions
              </h1>
            </div>
            <p style={{ margin: '2px 0 0 46px', fontSize: '12.5px', color: '#64748B' }}>
              Supervision des flux ({totalCount.toLocaleString('fr-FR')} opérations enregistrées)
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={totalCount === 0 && transactions.length === 0}
              onClick={async () => {
                if (totalCount === 0 && transactions.length === 0) {
                  alert('Aucune transaction disponible à exporter pour ces filtres.');
                  return;
                }
                try {
                  const response = await apiClient.get('/v1/admin/transactions/export/csv', {
                    params: { search: searchTerm, type: typeFilter, status: statusFilter, provider: providerFilter },
                    responseType: 'blob'
                  });
                  
                  // Check if blob is valid
                  if (response.data && response.data.size > 0) {
                    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `transactions_samre_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } else {
                    alert('Aucune donnée trouvée à exporter pour les critères sélectionnés.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Erreur lors du téléchargement du rapport CSV.');
                }
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                background: (totalCount === 0 && transactions.length === 0) ? '#94A3B8' : '#166534',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                fontSize: '12px',
                cursor: (totalCount === 0 && transactions.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(22,101,52,0.2)'
              }}
              title={(totalCount === 0 && transactions.length === 0) ? 'Aucune transaction à exporter' : 'Télécharger le registre CSV'}
            >
              <Download size={13} /> Export CSV
            </button>
            <button 
              onClick={fetchTransactions}
              style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontSize: '12px', fontWeight: '500' }}
              title="Actualiser"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {/* Strategic KPIs (4 mini-cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          
          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Entrées (Crédits)</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#16A34A' }}>+{formatCurrency(stats.creditTotal)}</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingDown size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Sorties (Débits)</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#DC2626' }}>-{formatCurrency(stats.debitTotal)}</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Volume sur la page</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{transactions.length} lignes</div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Taux de succès</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                {transactions.length > 0 ? Math.round((stats.completedCount / transactions.length) * 100) : 100}%
              </div>
            </div>
          </div>

        </div>

        {/* Compact Filters Toolbar */}
        <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #E2E8F0' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher utilisateur (nom, tél, email)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '6px 28px 6px 30px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12.5px',
                boxSizing: 'border-box', height: '32px'
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

          {/* Type Filter */}
          <div style={{ width: '130px' }}>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12px',
                background: 'white', height: '32px', fontWeight: '500'
              }}
            >
              <option value="">Tous les flux</option>
              <option value="credit">🟢 Crédit (+)</option>
              <option value="debit">🔴 Débit (-)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '130px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12px',
                background: 'white', height: '32px', fontWeight: '500'
              }}
            >
              <option value="">Tous statuts</option>
              <option value="completed">Validé</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div style={{ width: '140px' }}>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: '6px',
                border: '1px solid #CBD5E1', outline: 'none', fontSize: '12px',
                background: 'white', height: '32px', fontWeight: '500'
              }}
            >
              <option value="">Toutes sources</option>
              <option value="flooz">Moov / Flooz</option>
              <option value="tmoney">TMoney</option>
              <option value="wave">Wave</option>
              <option value="mtn">MTN MoMo</option>
              <option value="orange">Orange Money</option>
              <option value="stripe">Carte bancaire</option>
              <option value="wallet">Portefeuille</option>
            </select>
          </div>

          {/* Per Page Selector */}
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
            <AlertTriangle size={15} />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* High-Density Strategic Table */}
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px' }}>Date</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Utilisateur</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motif & Opération</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', width: '110px' }}>Montant</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', width: '95px' }}>Statut</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px', color: '#3B82F6' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>Chargement des flux...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Aucune transaction trouvée</td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const txUser = tx.wallet?.user;
                    const userName = getUserDisplayName(txUser);
                    const isCredit = tx.type === 'credit';
                    return (
                      <tr 
                        key={tx.id} 
                        onClick={() => setSelectedTx(tx)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', height: '38px', transition: 'background 0.1s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* DATE */}
                        <td style={{ padding: '6px 12px', color: '#64748B', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                          {formatDateCompact(tx.created_at)}
                        </td>

                        {/* USER */}
                        <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '12.5px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {userName}
                            </span>
                            {getUserTypeBadge(txUser?.user_type)}
                          </div>
                        </td>

                        {/* PURPOSE & DESCRIPTION */}
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getPurposeBadge(tx.purpose)}
                            {tx.description && (
                              <span style={{ color: '#475569', fontSize: '11.5px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.description}>
                                {tx.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SOURCE / PROVIDER */}
                        <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                          {getPaymentProviderBadge(tx.payment_provider)}
                        </td>

                        {/* AMOUNT */}
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', color: isCredit ? '#16A34A' : '#DC2626', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: '6px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {getStatusBadge(tx.status)}
                        </td>

                        {/* ACTION */}
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                            title="Voir tous les détails"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination Bar */}
          {totalPages > 1 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({totalCount} au total)
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

        {/* MODAL: FULL TRANSACTION DETAILS */}
        {selectedTx && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
              
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
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Amount Banner */}
                <div style={{ padding: '14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Montant de la transaction</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: selectedTx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                      {selectedTx.type === 'credit' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(selectedTx.status)}
                  </div>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* User info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Utilisateur</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {getUserDisplayName(selectedTx.wallet?.user)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                        {selectedTx.wallet?.user?.phone || selectedTx.wallet?.user?.email || '-'}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {getUserTypeBadge(selectedTx.wallet?.user?.user_type)}
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Type de mouvement</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', textTransform: 'capitalize' }}>
                      {selectedTx.type === 'credit' ? 'Crédit (+)' : 'Débit (-)'}
                    </span>
                  </div>

                  {/* Balances Before & After if available */}
                  {(selectedTx.balance_before !== undefined || selectedTx.balance_after !== undefined) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Solde avant</div>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>{formatCurrency(selectedTx.balance_before || 0)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Solde après</div>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: selectedTx.type === 'credit' ? '#16A34A' : '#0F172A' }}>{formatCurrency(selectedTx.balance_after || 0)}</div>
                      </div>
                    </div>
                  )}

                  {/* Motif / Description */}
                  {selectedTx.description && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Motif détaillé</span>
                      <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', background: '#F8FAFC', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {selectedTx.description}
                      </div>
                    </div>
                  )}

                  {/* Payment provider */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Moyen de paiement / Source</span>
                    <div>
                      {getPaymentProviderBadge(selectedTx.payment_provider)}
                    </div>
                  </div>

                  {/* External ref */}
                  {selectedTx.external_ref && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Référence externe</span>
                      <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#475569', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                        {selectedTx.external_ref}
                      </span>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div style={{ marginTop: '6px' }}>
                  <button
                    onClick={() => setSelectedTx(null)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0F172A', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Fermer
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
