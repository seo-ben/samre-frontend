import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient';
import { Landmark, ArrowRight, ArrowLeft, Eye, Clock, X, Lock, Copy, CheckCheck, CheckCircle2 } from 'lucide-react';
import { getPurposeBadge, getPaymentProviderBadge } from '../../pages/Payments/FinanceDashboard';

export const UserWalletTab = ({ user, refreshUser }) => {
  const [walletBalance, setWalletBalance] = useState(user.wallet?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Manual transaction modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [actionType, setActionType] = useState('credit'); // credit or debit
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState(null);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M FCFA';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k FCFA';
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(num).replace('XOF', 'FCFA');
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/v1/admin/transactions?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setTransactions(res.data.data.data);
      } else {
        setError("Erreur lors du chargement des transactions");
      }
      
      // Fetch latest wallet balance directly from the user details
      try {
        const userRes = await apiClient.get(`/v1/admin/users/${user.id}`);
        if (userRes.data.status === 'success' && userRes.data.data.wallet) {
          setWalletBalance(userRes.data.data.wallet.balance);
        }
      } catch (e) {
        console.error("Impossible de récupérer le solde à jour", e);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau ou serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id]);

  const handleManualAction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) return;
    if (!purpose.trim()) return;

    if (!user.wallet?.id) {
      showToast("Ce client n'a pas de portefeuille actif.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await apiClient.post(`/v1/admin/wallets/${user.wallet.id}/${actionType}`, {
        amount: parseFloat(amount),
        purpose: purpose.trim()
      });

      if (res.data.status === 'success') {
        setShowManualModal(false);
        setAmount('');
        setPurpose('');
        if (res.data.data?.balance !== undefined) {
          setWalletBalance(res.data.data.balance);
        }
        showToast(`Portefeuille ${actionType === 'credit' ? 'crédité' : 'débité'} avec succès`);
        refreshUser();
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>Complété</span>;
      case 'pending': return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#fef3c7', color: '#92400e' }}>En attente</span>;
      case 'failed': return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>Échoué</span>;
      case 'cancelled': return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#f3f4f6', color: '#374151' }}>Annulé</span>;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Solde Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #1A6FD4, #0052ff)',
        padding: '20px',
        borderRadius: '12px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,82,255,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solde actuel</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              {user.wallet ? formatCurrency(walletBalance) : '0 FCFA'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setActionType('credit'); setShowManualModal(true); }}
            style={{
              padding: '8px 16px', background: '#fff', color: '#16a34a', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ArrowRight size={16} /> Créditer
          </button>
          <button
            onClick={() => { setActionType('debit'); setShowManualModal(true); }}
            style={{
              padding: '8px 16px', background: '#fff', color: '#dc2626', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ArrowLeft size={16} /> Débiter
          </button>
        </div>
      </div>

      {/* Historique Transactions */}
      <div>
        <h5 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: 'var(--black-deep)' }}>
          Historique des Transactions
        </h5>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-medium)' }}>Chargement...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>
        ) : transactions.length === 0 ? (
          <div style={{
            padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px',
            border: '2px dashed var(--gray-border)', color: 'var(--gray-medium)', fontSize: '13px'
          }}>
            Aucune transaction trouvée pour cet utilisateur.
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--gray-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-light)', borderBottom: '1px solid var(--gray-border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}>Motif</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}>Montant</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}>Statut</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-medium)' }}></th>
                  </tr>
                </thead>
                <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--gray-border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--black-deep)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--gray-medium)"/>
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {tx.type === 'credit' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '600' }}><ArrowRight size={14}/> Crédit</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: '600' }}><ArrowLeft size={14}/> Débit</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-medium)' }}>
                      <div style={{ marginBottom: tx.description ? '4px' : '0' }}>
                        {getPurposeBadge(tx.purpose)}
                      </div>
                      {tx.description && (
                        <div style={{ fontSize: '12px', color: 'var(--black-deep)', maxWidth: '280px', lineHeight: '1.4' }}>
                          {tx.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: tx.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(tx.status)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          background: 'none', border: 'none', color: '#0052ff', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600'
                        }}
                      >
                        <Eye size={16} /> Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Action Modal */}
      {showManualModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px', borderBottom: '1px solid var(--gray-border)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              background: actionType === 'credit' ? '#f0fdf4' : '#fef2f2'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: actionType === 'credit' ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {actionType === 'credit' ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                {actionType === 'credit' ? 'Créditer le portefeuille' : 'Débiter le portefeuille'}
              </h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-medium)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleManualAction} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--black-deep)', marginBottom: '6px' }}>
                  Montant (XOF)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                  placeholder="Ex: 5000"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--black-deep)', marginBottom: '6px' }}>
                  Motif / Description
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                  placeholder="Ex: Remboursement ou Bonus"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--gray-light)', color: 'var(--black-deep)',
                    border: '1px solid var(--gray-border)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    flex: 1, padding: '12px', background: actionType === 'credit' ? '#16a34a' : '#dc2626', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? 'En cours...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--black-deep)' }}>Détails de la transaction</h3>
              <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-medium)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>ID Transaction</span>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)' }}>#{selectedTx.id}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Statut</span>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedTx.status)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Montant</span>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: selectedTx.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                    {selectedTx.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Type</span>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)' }}>
                    {selectedTx.type === 'credit' ? 'Crédit' : 'Débit'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--gray-border)', margin: '4px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Solde avant</span>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)' }}>{formatCurrency(selectedTx.balance_before)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Solde après</span>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)' }}>{formatCurrency(selectedTx.balance_after)}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--gray-border)', margin: '4px 0' }}></div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Catégorie / Motif</span>
                <div style={{ marginTop: '6px' }}>{getPurposeBadge(selectedTx.purpose)}</div>
                {selectedTx.description && (
                  <div style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--black-deep)', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', marginTop: '8px', border: '1px solid var(--gray-border)' }}>
                    {selectedTx.description}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', textTransform: 'uppercase' }}>Moyen de paiement / Source</span>
                <div style={{ marginTop: '6px' }}>
                  {getPaymentProviderBadge(selectedTx.payment_provider)}
                </div>
              </div>

              {/* Référence Externe / Stripe Session */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-medium)', fontWeight: '700', textTransform: 'uppercase' }}>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: copiedRef ? '#dcfce7' : '#e2e8f0', color: copiedRef ? '#166534' : '#334155', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      {copiedRef ? <CheckCheck size={12} /> : <Copy size={12} />}
                      {copiedRef ? 'Copié !' : 'Copier'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: selectedTx.external_ref ? 'var(--black-deep)' : 'var(--gray-medium)', fontWeight: selectedTx.external_ref ? '700' : 'normal', wordBreak: 'break-all', background: 'white', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  {selectedTx.external_ref || 'Aucune référence externe transmise (Opération interne)'}
                </div>
              </div>

              {/* Linked Entity Reference if any */}
              {selectedTx.reference_type && selectedTx.reference_id && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--gray-border)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '500' }}>Entité liée</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--black-deep)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                    {selectedTx.reference_type} #{selectedTx.reference_id}
                  </span>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--gray-light)', borderTop: '1px solid var(--gray-border)', textAlign: 'right' }}>
              <button onClick={() => setSelectedTx(null)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid var(--gray-border)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Fermer
              </button>
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
  );
};
