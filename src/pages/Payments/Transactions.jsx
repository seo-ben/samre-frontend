import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';
import { getUserDisplayName, getUserTypeBadge, getPurposeBadge } from './FinanceDashboard';
import { 
  ReceiptText, Search, RefreshCw, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle2, Download 
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, typeFilter, statusFilter, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        page
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
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '12px', background: '#DCFCE7', color: '#166534' }}><CheckCircle2 size={12} /> Complété</span>;
      case 'pending':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '12px', background: '#FEF9C3', color: '#854D0E' }}>En attente</span>;
      case 'failed':
      case 'cancelled':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '12px', background: '#FEE2E2', color: '#991B1B' }}><AlertTriangle size={12} /> Échoué</span>;
      default:
        return <span style={{ padding: '3px 8px', fontSize: '11.5px', fontWeight: '600', borderRadius: '12px', background: '#F1F5F9', color: '#475569' }}>{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
    } catch (_) {
      return dateString;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(26, 111, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ReceiptText size={24} color="#1A6FD4" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F172A' }}>
                Historique des Transactions
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
                Traçabilité complète des mouvements financiers ({totalCount} transactions au total)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get('/v1/admin/transactions/export/csv', {
                    params: { search: searchTerm, type: typeFilter, status: statusFilter },
                    responseType: 'blob'
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `rapport_financier_samre_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (err) {
                  alert('Erreur lors du téléchargement du rapport CSV.');
                }
              }}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#166534',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(22,101,52,0.2)'
              }}
            >
              <Download size={15} /> Exporter CSV
            </button>
            <button 
              onClick={fetchTransactions}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', border: '1px solid #E2E8F0' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher utilisateur (nom, tél, email)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '9px 14px 9px 38px', borderRadius: '8px',
                border: '1px solid #E2E8F0', outline: 'none', fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ width: '160px' }}>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #E2E8F0', outline: 'none', fontSize: '13.5px',
                background: 'white'
              }}
            >
              <option value="">Tous les types</option>
              <option value="credit">Crédit (+)</option>
              <option value="debit">Débit (-)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #E2E8F0', outline: 'none', fontSize: '13.5px',
                background: 'white'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="completed">Complété</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '0 8px 8px 0', color: '#B91C1C', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif & Description</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: '14px 20px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#3B82F6' }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>Chargement des transactions...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Aucune transaction trouvée</td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const txUser = tx.wallet?.user;
                    const userName = getUserDisplayName(txUser);
                    return (
                      <tr 
                        key={tx.id} 
                        onClick={() => setSelectedTx(tx)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {formatDate(tx.created_at)}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                            {userName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{txUser?.email || txUser?.phone || '-'}</div>
                          <div style={{ marginTop: '2px' }}>{getUserTypeBadge(txUser?.user_type)}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ marginBottom: tx.description ? '4px' : '0' }}>{getPurposeBadge(tx.purpose)}</div>
                          {tx.description && (
                            <div style={{ fontSize: '12px', color: '#334155', maxWidth: '340px', lineHeight: '1.4' }}>
                              {tx.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: tx.type === 'credit' ? '#16A34A' : '#DC2626', fontSize: '14px', whiteSpace: 'nowrap' }}>
                          {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          {getStatusBadge(tx.status)}
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
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                Page {page} sur {totalPages} ({totalCount} au total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
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
                    {getStatusBadge(selectedTx.status)}
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
                      {selectedTx.type === 'credit' ? 'Crédit (+)' : 'Débit (-)'} ({selectedTx.purpose || 'Opération'})
                    </span>
                  </div>

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
                  {selectedTx.payment_provider && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Moyen de paiement</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase' }}>
                        {selectedTx.payment_provider}
                      </span>
                    </div>
                  )}

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

      </div>
    </MainLayout>
  );
};
