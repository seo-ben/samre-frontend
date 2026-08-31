import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { getUserDisplayName, getUserTypeBadge, getPurposeBadge, getPaymentProviderBadge } from './FinanceDashboard';
import { 
  ReceiptText, Search, RefreshCw, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle2, Download,
  Filter, Eye, ArrowUpDown, TrendingUp, TrendingDown, DollarSign,
  Calendar, Layers, Check, CreditCard, Wallet, Copy, CheckCheck
} from 'lucide-react';

export const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
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
                  showToast('Aucune transaction disponible à exporter pour ces filtres.');
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
                    showToast('Rapport CSV téléchargé avec succès !');
                  } else {
                    showToast('Aucune donnée trouvée à exporter pour les critères sélectionnés.');
                  }
                } catch (err) {
                  console.error(err);
                  showToast('Erreur lors du téléchargement du rapport CSV.');
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
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher (Nom, Tél, Réf Stripe cs_..., Motif)..."
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
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 210px)',
          minHeight: '480px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC', boxShadow: '0 1px 0 #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', background: '#F8FAFC' }}>Date</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC' }}>Utilisateur</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC' }}>Motif & Opération</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC' }}>Source</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', width: '110px', background: '#F8FAFC' }}>Montant</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', width: '95px', background: '#F8FAFC' }}>Statut</th>
                  <th style={{ padding: '9px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', width: '40px', background: '#F8FAFC' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px', color: '#3B82F6' }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Chargement des flux...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Aucune transaction trouvée</td>
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
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', height: '40px', transition: 'background 0.1s' }}
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

                        {/* PURPOSE & OP */}
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {getPurposeBadge(tx.purpose)}
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: '500', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.description || tx.purpose || 'Opération de solde'}
                            </span>
                          </div>
                        </td>

                        {/* SOURCE / REF */}
                        <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getPaymentProviderBadge(tx.payment_provider)}
                            {tx.external_ref ? (
                              <span 
                                style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#1E293B', background: '#F1F5F9', padding: '1px 5px', borderRadius: '3px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', border: '1px solid #E2E8F0', display: 'inline-block' }}
                                title={`Référence externe / Stripe: ${tx.external_ref}`}
                              >
                                {tx.external_ref}
                              </span>
                            ) : null}
                          </div>
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
          <div style={{
            flex: '0 0 auto',
            padding: '10px 16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAFAFA',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                Affichage de <strong>{totalCount === 0 ? 0 : (page - 1) * perPage + 1}</strong> à <strong>{Math.min(page * perPage, totalCount)}</strong> sur <strong>{totalCount.toLocaleString('fr-FR')}</strong> flux
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                Page {page} / {totalPages}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  cursor: (page <= 1 || loading) ? 'not-allowed' : 'pointer',
                  opacity: (page <= 1 || loading) ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                <ChevronLeft size={14} /> Précédent
              </button>

              {/* Quick page pills */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5 && page > 3) {
                      pageNum = page - 2 + idx;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                    }
                    if (pageNum <= 0) return null;
                    const isActive = pageNum === page;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '5px',
                          border: isActive ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                          background: isActive ? '#3B82F6' : 'white',
                          color: isActive ? 'white' : '#334155',
                          fontWeight: isActive ? '700' : '500',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  cursor: (page >= totalPages || loading) ? 'not-allowed' : 'pointer',
                  opacity: (page >= totalPages || loading) ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL: FULL TRANSACTION DETAILS */}
        {selectedTx && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
            <div style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
              
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

                  {/* Payment provider & External Ref / Stripe Session */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Moyen de paiement / Source</span>
                    <div>
                      {getPaymentProviderBadge(selectedTx.payment_provider)}
                    </div>
                  </div>

                  {/* External ref / Stripe Session ID Box */}
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                        Référence Passerelle (Stripe / Opérateur)
                      </span>
                      {selectedTx.external_ref && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTx.external_ref);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: copiedRef ? '#DCFCE7' : '#E2E8F0', color: copiedRef ? '#166534' : '#334155', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                        >
                          {copiedRef ? <CheckCheck size={12} /> : <Copy size={12} />}
                          {copiedRef ? 'Copié !' : 'Copier la référence'}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: selectedTx.external_ref ? '#0F172A' : '#94A3B8', fontWeight: selectedTx.external_ref ? '700' : 'normal', wordBreak: 'break-all', background: 'white', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                      {selectedTx.external_ref || 'Aucune référence externe transmise (Opération interne)'}
                    </div>
                  </div>

                  {/* Linked Entity Reference if any */}
                  {selectedTx.reference_type && selectedTx.reference_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Élément / Entité liée</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#0F172A', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
                        {selectedTx.reference_type} #{selectedTx.reference_id}
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
