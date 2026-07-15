import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../lib/apiClient';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // credit, debit
  const [statusFilter, setStatusFilter] = useState(''); // completed, pending, failed

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter
      };
      const response = await apiClient.get('/v1/admin/transactions', { params });
      if (response.data.status === 'success' || response.data.data) {
        setTransactions(response.data.data.data || response.data.data);
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(26, 111, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="fa-solid fa-receipt" style={{ fontSize: '20px', color: 'var(--primary-blue)' }}></i>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)', fontFamily: 'var(--font-poppins)' }}>
                Historique des Transactions
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
                Consultez tous les mouvements financiers
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid var(--gray-border)' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)' }}></i>
            <input
              type="text"
              placeholder="Rechercher utilisateur (email, nom)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px 10px 42px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px',
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ position: 'relative', width: '200px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px',
                appearance: 'none', background: 'white'
              }}
            >
              <option value="">Tous les types</option>
              <option value="credit">Crédit (+)</option>
              <option value="debit">Débit (-)</option>
            </select>
            <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)', pointerEvents: 'none', fontSize: '12px' }}></i>
          </div>

          {/* Status Filter */}
          <div style={{ position: 'relative', width: '200px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gray-border)', outline: 'none', fontSize: '14px',
                appearance: 'none', background: 'white'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="completed">Complété</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
            <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-medium)', pointerEvents: 'none', fontSize: '12px' }}></i>
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
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-medium)' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--primary-blue)' }}></i>
                      <p>Chargement...</p>
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
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: tx.type === 'credit' ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.type === 'credit' ? '+' : '-'} {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(tx.amount)}
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
    </MainLayout>
  );
};
