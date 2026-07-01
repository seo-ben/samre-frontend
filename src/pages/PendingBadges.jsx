import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Filter, FileText, User, Building, Search, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, ShieldAlert, FileBadge, Download
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const PendingBadges = () => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Stats mockees ou calculees si possible
  const [stats, setStats] = useState({ users: 0, companies: 0, total: 0 });

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/badges/requests', {
        params: { page, status: filterStatus, search: searchQuery }
      });
      const data = response.data.data.data;
      setRequests(data);
      setMeta({
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total: response.data.data.total,
        per_page: response.data.data.per_page,
      });

      if (response.data.stats) {
        setStats({
          users: response.data.stats.pending_candidates,
          companies: response.data.stats.pending_companies,
          total: response.data.stats.total_pending
        });
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchQuery]);

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

  const updateStatsLocal = (oldStatus, newStatus, userType) => {
    if (oldStatus === newStatus) return;
    
    setStats(prev => {
      let newStats = { ...prev };
      if (oldStatus === 'pending') {
        if (userType === 'candidate') newStats.users = Math.max(0, newStats.users - 1);
        if (userType === 'company') newStats.companies = Math.max(0, newStats.companies - 1);
        newStats.total = Math.max(0, newStats.total - 1);
      }
      if (newStatus === 'pending') {
        if (userType === 'candidate') newStats.users += 1;
        if (userType === 'company') newStats.companies += 1;
        newStats.total += 1;
      }
      return newStats;
    });
  };

  const submitStatusChange = async () => {
    if (!selectedReq) return;
    try {
      const response = await apiClient.put(`/v1/admin/badges/requests/${selectedReq.id}/status`, {
        status: statusForm.status,
        rejection_reason: statusForm.note
      });
      
      const updatedReq = response.data.data;
      const oldStatus = requests.find(r => r.id === selectedReq.id)?.status;
      updateStatsLocal(oldStatus, updatedReq.status, selectedReq.user?.user_type);
      
      setRequests(requests.map(r => r.id === selectedReq.id ? updatedReq : r));
      setShowStatusModal(false);
      showToast('Demande mise à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur de mise à jour', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const quickApprove = async (req) => {
    try {
      const response = await apiClient.put(`/v1/admin/badges/requests/${req.id}/status`, {
        status: 'approved',
        rejection_reason: ''
      });
      
      const updatedReq = response.data.data;
      updateStatsLocal(req.status, updatedReq.status, req.user?.user_type);
      
      setRequests(requests.map(r => r.id === req.id ? updatedReq : r));
      showToast('Vérification effectuée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la vérification', error);
      showToast('Erreur lors de la vérification', 'error');
    }
  };

  const getStatusBadgeProps = (status) => {
    const badges = {
      pending: { label: 'En attente', bg: '#fffbeb', color: '#f59e0b', icon: <div style={{width: 6, height: 6, borderRadius: '50%', background: '#f59e0b'}}></div> },
      approved: { label: 'Approuvée', bg: '#dcfce7', color: '#15803d', icon: <div style={{width: 6, height: 6, borderRadius: '50%', background: '#15803d'}}></div> },
      rejected: { label: 'Rejetée', bg: '#fee2e2', color: '#b91c1c', icon: <div style={{width: 6, height: 6, borderRadius: '50%', background: '#b91c1c'}}></div> },
    };
    return badges[status] || badges.pending;
  };

  const renderUserInfo = (user) => {
    if (!user) return { name: 'Inconnu', type: 'Inconnu', phone: '', typeColor: '#64748b', typeBg: '#f1f5f9', icon: <User size={14} />, initials: 'U' };
    
    if (user.user_type === 'company' && user.company_profile) {
      return {
        name: user.company_profile.company_name,
        type: 'Entreprise',
        phone: user.phone || user.email, // Priorité au numéro de téléphone
        typeColor: '#2563eb', // blue
        typeBg: '#eff6ff',
        icon: <Building size={14} color="#2563eb" />,
        initials: user.company_profile.company_name?.[0]?.toUpperCase() || 'E',
        avatarBg: '#1e293b' // Dark like the GT logo in screenshot
      };
    } else if (user.user_type === 'candidate' && user.candidate_profile) {
      return {
        name: `${user.candidate_profile.first_name} ${user.candidate_profile.last_name}`,
        type: 'Utilisateur',
        phone: user.phone || user.email, // Priorité au numéro de téléphone
        typeColor: '#16a34a', // green
        typeBg: '#dcfce7',
        icon: <User size={14} color="#16a34a" />,
        initials: `${user.candidate_profile.first_name?.[0] || ''}${user.candidate_profile.last_name?.[0] || ''}`.toUpperCase(),
        photo: user.candidate_profile.photos?.[0]?.photo_url,
        avatarBg: '#e2e8f0'
      };
    }
    return { name: user.candidate_profile ? `${user.candidate_profile.first_name} ${user.candidate_profile.last_name}` : (user.phone || 'Inconnu'), type: 'Utilisateur', phone: user.phone, typeColor: '#16a34a', typeBg: '#dcfce7', icon: <User size={14} color="#16a34a" />, initials: 'U', avatarBg: '#e2e8f0' };
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'all') return true;
    if (activeTab === 'candidate' && req.user?.user_type === 'candidate') return true;
    if (activeTab === 'company' && req.user?.user_type === 'company') return true;
    return false;
  });

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
        
        {/* Header Stats & Filters Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          
          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0', minWidth: '180px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Utilisateurs en attente</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stats.users}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0', minWidth: '180px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Entreprises en attente</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stats.companies}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Type</label>
              <select style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#fff', color: '#0f172a', fontSize: '14px', minWidth: '150px' }}>
                <option value="all">Tous</option>
                <option value="candidate">Utilisateur</option>
                <option value="company">Entreprise</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Statut</label>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#fff', color: '#0f172a', fontSize: '14px', minWidth: '150px' }}
              >
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
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
              <button 
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tous ({stats.total})
              </button>
              <button 
                className={`tab-button ${activeTab === 'candidate' ? 'active' : ''}`}
                onClick={() => setActiveTab('candidate')}
              >
                Utilisateurs ({stats.users})
              </button>
              <button 
                className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
                onClick={() => setActiveTab('company')}
              >
                Entreprises ({stats.companies})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              Trier par
              <select style={{ border: 'none', outline: 'none', fontWeight: '500', color: '#0f172a', cursor: 'pointer', background: 'transparent' }}>
                <option>Plus récents</option>
                <option>Plus anciens</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
            ) : filteredRequests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Aucune demande trouvée.</div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Demandeur</th>
                    <th>Type</th>
                    <th>Documents soumis</th>
                    <th>Date de demande</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => {
                    const badge = getStatusBadgeProps(req.status);
                    const userInfo = renderUserInfo(req.user);
                    const date = new Date(req.created_at);
                    
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: userInfo.typeBg, color: userInfo.typeColor, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {userInfo.icon}
                            {userInfo.type}
                          </span>
                        </td>
                        <td>
                          {req.document_url ? (
                            <a href={req.document_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', textDecoration: 'none', fontSize: '12px', fontWeight: '500' }}>
                              <FileText size={14} />
                              1 document
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Aucun</span>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, color: badge.color, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button 
                              onClick={() => openStatusModal(req)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#3b82f6' }}
                              title="Voir et modifier"
                            >
                              <Eye size={14} />
                            </button>
                            {req.status === 'pending' && (
                              <button 
                                onClick={() => quickApprove(req)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 10px', height: '28px', borderRadius: '6px', border: 'none', background: '#2563eb', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: '500' }}
                                title="Vérifier instantanément"
                              >
                                Vérifier
                              </button>
                            )}
                          </div>
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
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Vérification du profil</h2>
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
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px' }}>{renderUserInfo(selectedReq.user).name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{renderUserInfo(selectedReq.user).phone}</div>
                  </div>
                </div>
              </div>

              {selectedReq.document_url && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Document fourni</h3>
                  <a href={selectedReq.document_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', textDecoration: 'none', fontWeight: '500', background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <Download size={18} color="#3b82f6" />
                    Ouvrir le justificatif
                  </a>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Décision</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Statut de la demande</label>
                    <select 
                      value={statusForm.status}
                      onChange={e => setStatusForm({...statusForm, status: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                    >
                      <option value="pending">En attente d'examen</option>
                      <option value="approved">Approuver et Certifier le Profil</option>
                      <option value="rejected">Rejeter la demande</option>
                    </select>
                  </div>
                  
                  {statusForm.status === 'rejected' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Motif de refus (visible par l'utilisateur)</label>
                      <textarea 
                        value={statusForm.note}
                        onChange={e => setStatusForm({...statusForm, note: e.target.value})}
                        rows={3}
                        placeholder="Veuillez fournir un document plus lisible..."
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
                style={{ padding: '8px 20px', background: statusForm.status === 'approved' ? '#2563eb' : (statusForm.status === 'rejected' ? '#ef4444' : '#3b82f6'), border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Confirmer
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
