import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Filter, FileText, User, Briefcase, Calendar, Info, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, AlertCircle
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const getStatusFromPath = (path) => {
    if (path.includes('/applications/by-status')) return 'in_progress';
    return 'all';
  };

  const [filterStatus, setFilterStatus] = useState(getStatusFromPath(location.pathname));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setFilterStatus(getStatusFromPath(location.pathname));
  }, [location.pathname]);

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/applications', {
        params: { page, status: filterStatus, search: searchQuery }
      });
      setApplications(response.data.data.data);
      setMeta({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total: response.data.data.total,
        per_page: response.data.data.per_page,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des candidatures', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta?.last_page) {
      fetchApplications(newPage);
    }
  };

  const openStatusModal = (app) => {
    setSelectedApp(app);
    setStatusForm({ status: app.status, note: app.status_note || '' });
    setShowStatusModal(true);
  };

  const submitStatusChange = async () => {
    if (!selectedApp) return;
    try {
      const response = await apiClient.put(`/v1/admin/applications/${selectedApp.id}/status`, {
        status: statusForm.status,
        status_note: statusForm.note
      });
      setApplications(applications.map(a => a.id === selectedApp.id ? response.data.data : a));
      setShowStatusModal(false);
      showToast('Statut de la candidature mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur de changement de statut', error);
      showToast('Erreur lors du changement de statut', 'error');
    }
  };

  const getStatusBadgeProps = (status) => {
    const badges = {
      submitted: { label: 'Soumise', bg: '#f1f5f9', color: '#475569' },
      in_progress: { label: 'En cours', bg: '#dbeafe', color: '#1d4ed8' },
      accepted: { label: 'Acceptée', bg: '#dcfce7', color: '#15803d' },
      rejected: { label: 'Rejetée', bg: '#fee2e2', color: '#b91c1c' },
    };
    return badges[status] || badges.submitted;
  };

  return (
    <MainLayout>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .app-table { width: 100%; border-collapse: collapse; text-align: left; }
        .app-table th { padding: 16px; font-weight: 600; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .app-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
        .app-table tr:hover { background: #f8fafc; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', fontFamily: 'var(--font-inter)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)', margin: '0 0 4px 0' }}>Toutes les candidatures</h1>
            <p style={{ fontSize: '14px', color: 'var(--gray-medium)', margin: 0 }}>Visualisez et gérez les candidatures aux offres</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 16px 8px 36px',
                  border: '1px solid var(--gray-border)', borderRadius: '8px', background: '#fff',
                  fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)', cursor: 'pointer', outline: 'none',
                  appearance: 'none', minWidth: '180px'
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumises</option>
                <option value="in_progress">En cours</option>
                <option value="accepted">Acceptées</option>
                <option value="rejected">Rejetées</option>
              </select>
              <Filter size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            
            <input 
              type="text" 
              placeholder="Rechercher par candidat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--gray-border)', borderRadius: '8px', background: '#fff',
                fontSize: '14px', color: 'var(--black-deep)', outline: 'none', minWidth: '250px'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-border)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement des candidatures...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Aucune candidature trouvée.</div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Offre / Entreprise</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const badge = getStatusBadgeProps(app.status);
                    return (
                      <tr key={app.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: '700' }}>
                              {app.candidate_profile?.first_name?.[0] || ''}{app.candidate_profile?.last_name?.[0] || ''}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>{app.candidate_profile?.first_name} {app.candidate_profile?.last_name}</div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>{app.candidate_profile?.user?.phone || app.candidate_profile?.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{app.job_offer?.translations?.find(t => t.locale === 'fr')?.title || 'Offre'}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{app.job_offer?.company?.company_name}</div>
                        </td>
                        <td>
                          <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => openStatusModal(app)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '8px' }}
                            title="Voir les détails"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Footer */}
          {meta && meta.last_page > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Affichage {(meta.current_page - 1) * meta.per_page + 1} à {Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === 1 ? 'not-allowed' : 'pointer', opacity: meta.current_page === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ padding: '6px 16px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === meta.last_page ? 'not-allowed' : 'pointer', opacity: meta.current_page === meta.last_page ? 0.5 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails & Statut */}
      {showStatusModal && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Détails de la candidature</h2>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Le Candidat</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Nom complet</span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedApp.candidate_profile?.first_name} {selectedApp.candidate_profile?.last_name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Téléphone</span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedApp.candidate_profile?.user?.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Email</span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedApp.candidate_profile?.user?.email || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Date</span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{new Date(selectedApp.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Lettre de motivation</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedApp.cover_letter || "Aucune lettre de motivation fournie par le candidat."}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Mettre à jour le statut</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Statut de la candidature</label>
                    <select 
                      value={statusForm.status}
                      onChange={e => setStatusForm({...statusForm, status: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="submitted">Soumise (En attente de traitement)</option>
                      <option value="in_progress">En cours d'examen</option>
                      <option value="accepted">Acceptée</option>
                      <option value="rejected">Rejetée</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Note interne ou justificatif (optionnel)</label>
                    <textarea 
                      value={statusForm.note}
                      onChange={e => setStatusForm({...statusForm, note: e.target.value})}
                      rows={3}
                      placeholder="Commentaires sur le choix..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowStatusModal(false)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Fermer
              </button>
              <button 
                onClick={submitStatusChange}
                style={{ padding: '8px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Mettre à jour
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '12px',
            background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'var(--font-inter)',
            animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            maxWidth: '380px',
            border: toast.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {toast.type === 'success' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}>
              <CheckCircle2 size={18} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}>
              <AlertCircle size={18} />
            </div>
          )}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </MainLayout>
  );
};
