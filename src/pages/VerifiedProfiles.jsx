import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  FileText, User, Building, Search, Filter,
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, ShieldAlert, Download
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const VerifiedProfiles = ({ userType }) => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const title = userType === 'candidate' ? 'Candidats vérifiés' : 'Entreprises vérifiées';
  const Icon = userType === 'candidate' ? User : Building;
  const iconColor = userType === 'candidate' ? '#16a34a' : '#3b82f6';
  const iconBg = userType === 'candidate' ? '#dcfce7' : '#eff6ff';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/badges/requests', {
        params: { page, status: 'approved', search: searchQuery, user_type: userType }
      });
      const data = response.data.data.data;
      setRequests(data);
      setMeta({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total: response.data.data.total,
        per_page: response.data.data.per_page,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des profils vérifiés', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, userType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta?.last_page) {
      fetchRequests(newPage);
    }
  };

  const openStatusModal = (req) => {
    setSelectedReq(req);
    setStatusForm({ status: req.status, note: req.rejection_reason || '' });
    setShowStatusModal(true);
  };

  const submitStatusChange = async () => {
    if (!selectedReq) return;
    try {
      const response = await apiClient.put(`/v1/admin/badges/requests/${selectedReq.id}/status`, {
        status: statusForm.status,
        rejection_reason: statusForm.note
      });
      
      const updatedReq = response.data.data;
      
      if (updatedReq.status !== 'approved') {
        setRequests(requests.filter(r => r.id !== updatedReq.id));
        setMeta(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      } else {
        setRequests(requests.map(r => r.id === selectedReq.id ? updatedReq : r));
      }
      
      setShowStatusModal(false);
      showToast('Statut mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur de mise à jour', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const renderUserInfo = (user) => {
    if (!user) return { name: 'Inconnu', type: 'Inconnu', phone: '', typeColor: '#64748b', typeBg: '#f1f5f9', icon: <User size={14} />, initials: 'U' };
    
    if (user.user_type === 'company' && user.company_profile) {
      return {
        name: user.company_profile.company_name,
        type: 'Entreprise',
        phone: user.phone || user.email,
        typeColor: '#2563eb',
        typeBg: '#eff6ff',
        icon: <Building size={14} color="#2563eb" />,
        initials: user.company_profile.company_name?.[0]?.toUpperCase() || 'E',
        avatarBg: '#1e293b'
      };
    } else if (user.user_type === 'candidate' && user.candidate_profile) {
      return {
        name: `${user.candidate_profile.first_name} ${user.candidate_profile.last_name}`,
        type: 'Utilisateur',
        phone: user.phone || user.email,
        typeColor: '#16a34a',
        typeBg: '#dcfce7',
        icon: <User size={14} color="#16a34a" />,
        initials: `${user.candidate_profile.first_name?.[0] || ''}${user.candidate_profile.last_name?.[0] || ''}`.toUpperCase(),
        photo: user.candidate_profile.photos?.[0]?.photo_url,
        avatarBg: '#e2e8f0'
      };
    }
    return { name: user.candidate_profile ? `${user.candidate_profile.first_name} ${user.candidate_profile.last_name}` : (user.phone || 'Inconnu'), type: 'Utilisateur', phone: user.phone, typeColor: '#16a34a', typeBg: '#dcfce7', icon: <User size={14} color="#16a34a" />, initials: 'U', avatarBg: '#e2e8f0' };
  };

  return (
    <MainLayout>
      <style>{`
        .app-table { width: 100%; border-collapse: collapse; text-align: left; }
        .app-table th { 
          padding: 12px 16px; 
          font-weight: 600; 
          color: #64748b; 
          font-size: 12px; 
          border-bottom: 1px solid #e2e8f0; 
          background: #fff; 
        }
        .app-table td { 
          padding: 4px 16px; 
          border-bottom: 1px solid #f1f5f9; 
          font-size: 13px; 
          color: #334155; 
          vertical-align: middle;
        }
        .app-table tr:hover { background: #f8fafc; }
        
        .tab-button {
          padding: 12px 8px;
          margin-right: 24px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #64748b;
          border-bottom: 2px solid transparent;
        }
        .tab-button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', fontFamily: 'var(--font-inter)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {title}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* Header Stats & Filters Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          
          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0', minWidth: '180px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={iconColor} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{meta?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Statut</label>
              <select 
                disabled
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#f8fafc', color: '#64748b', fontSize: '14px', minWidth: '150px', cursor: 'not-allowed' }}
              >
                <option value="approved">Approuvées</option>
              </select>
            </div>

            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#3b82f6', fontSize: '14px', fontWeight: '500', cursor: 'pointer', height: '38px' }}>
              <Filter size={16} /> Filtres
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* Tabs and Sort */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
            <div style={{ display: 'flex' }}>
              <button className="tab-button active">
                Tous ({meta?.total || 0})
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Trier par
              <select style={{ border: 'none', background: 'transparent', color: '#0f172a', fontWeight: '600', outline: 'none', cursor: 'pointer' }}>
                <option>Plus récents</option>
                <option>Plus anciens</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Aucun profil certifié trouvé.</div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Demandeur</th>
                    <th>Type</th>
                    <th>Documents soumis</th>
                    <th>Date d'approbation</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const userInfo = renderUserInfo(req.user);
                    const date = new Date(req.updated_at);
                    
                    return (
                      <tr key={req.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {userInfo.photo ? (
                              <img src={userInfo.photo} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: userInfo.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                                {userInfo.initials}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>{userInfo.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{userInfo.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: userInfo.typeBg, color: userInfo.typeColor, fontSize: '12px', fontWeight: '500' }}>
                            {userInfo.icon}
                            {userInfo.type}
                          </span>
                        </td>
                        <td>
                          {req.document_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontSize: '13px' }}>
                              <FileText size={14} /> 1 document
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Aucun</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '500' }}>
                            {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: '500' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                            Approuvée
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => openStatusModal(req)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#3b82f6' }}
                            title="Voir et modifier"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Affichage de {(meta.current_page - 1) * meta.per_page + 1} à {Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total} résultats
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2563eb', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: '600', fontSize: '14px' }}>
                  {meta.current_page}
                </button>
                {meta.current_page < meta.last_page && (
                  <button onClick={() => handlePageChange(meta.current_page + 1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>
                    {meta.current_page + 1}
                  </button>
                )}
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === meta.last_page ? 'not-allowed' : 'pointer', color: '#64748b' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails & Traitement */}
      {showStatusModal && selectedReq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Détails de la certification</h2>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: renderUserInfo(selectedReq.user).avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px' }}>
                    {renderUserInfo(selectedReq.user).initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {renderUserInfo(selectedReq.user).name}
                      <CheckCircle2 size={16} color="#2563eb" />
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{renderUserInfo(selectedReq.user).phone}</div>
                  </div>
                </div>
              </div>

              {selectedReq.document_url && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Document validé</h3>
                  <a href={selectedReq.document_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', textDecoration: 'none', fontWeight: '500', background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <Download size={18} color="#3b82f6" />
                    Ouvrir le document
                  </a>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Révoquer ou Rejeter</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Modifier le statut</label>
                    <select 
                      value={statusForm.status}
                      onChange={e => setStatusForm({...statusForm, status: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="approved">Maintenir Certifié</option>
                      <option value="pending">Remettre en attente</option>
                      <option value="rejected">Révoquer le badge (Rejeter)</option>
                    </select>
                  </div>
                  
                  {statusForm.status === 'rejected' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Motif de révocation (visible par l'utilisateur)</label>
                      <textarea 
                        value={statusForm.note}
                        onChange={e => setStatusForm({...statusForm, note: e.target.value})}
                        rows={3}
                        placeholder="Veuillez fournir un document mis à jour..."
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowStatusModal(false)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={submitStatusChange}
                style={{ padding: '8px 20px', background: statusForm.status === 'approved' ? '#2563eb' : (statusForm.status === 'rejected' ? '#ef4444' : '#f59e0b'), border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Sauvegarder
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
            animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </MainLayout>
  );
};
