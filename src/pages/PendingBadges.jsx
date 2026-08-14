import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Filter, FileText, User, Building, Search, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, ShieldAlert, 
  FileBadge, Download, Phone, Mail, MapPin, Calendar, Award, 
  Sparkles, ExternalLink, AlertCircle, Check, Briefcase, Car,
  ShieldCheck, Globe, Hash, Info, UserCheck, Clock
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const PendingBadges = () => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [stats, setStats] = useState({ users: 0, companies: 0, total: 0 });

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/badges/requests', {
        params: { page, status: filterStatus, search: searchQuery }
      });
      const data = response.data.data?.data || response.data.data || [];
      setRequests(Array.isArray(data) ? data : []);
      
      const metaData = response.data.data?.meta || response.data.data;
      if (metaData) {
        setMeta({
          current_page: metaData.current_page || page,
          last_page: metaData.last_page || 1,
          total: metaData.total || (Array.isArray(data) ? data.length : 0),
          per_page: metaData.per_page || 15,
        });
      }

      if (response.data.stats) {
        setStats({
          users: response.data.stats.pending_candidates || 0,
          companies: response.data.stats.pending_companies || 0,
          total: response.data.stats.total_pending || 0
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
  }, [filterStatus, searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (meta?.last_page || 1)) {
      fetchRequests(newPage);
    }
  };

  const openStatusModal = (req) => {
    setSelectedReq(req);
    setStatusForm({ status: req.status || 'pending', note: req.rejection_reason || '' });
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

  const submitStatusChange = async (targetStatus = statusForm.status) => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      const response = await apiClient.put(`/v1/admin/badges/requests/${selectedReq.id}/status`, {
        status: targetStatus,
        rejection_reason: targetStatus === 'rejected' ? statusForm.note : ''
      });
      
      const updatedReq = response.data.data;
      const oldStatus = requests.find(r => r.id === selectedReq.id)?.status;
      updateStatsLocal(oldStatus, targetStatus, selectedReq.user?.user_type);
      
      setRequests(requests.map(r => r.id === selectedReq.id ? (updatedReq || { ...r, status: targetStatus }) : r));
      setShowStatusModal(false);
      showToast(
        targetStatus === 'approved' 
          ? 'Badge accordé avec succès ! Profil certifié.' 
          : (targetStatus === 'rejected' ? 'Demande rejetée.' : 'Statut mis à jour.'),
        targetStatus === 'approved' ? 'success' : (targetStatus === 'rejected' ? 'error' : 'info')
      );
    } catch (error) {
      console.error('Erreur de mise à jour', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const quickApprove = async (req) => {
    try {
      const response = await apiClient.put(`/v1/admin/badges/requests/${req.id}/status`, {
        status: 'approved',
        rejection_reason: ''
      });
      
      const updatedReq = response.data.data;
      updateStatsLocal(req.status, 'approved', req.user?.user_type);
      
      setRequests(requests.map(r => r.id === req.id ? (updatedReq || { ...r, status: 'approved' }) : r));
      showToast('Badge certifié avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la vérification', error);
      showToast('Erreur lors de la vérification', 'error');
    }
  };

  const getStatusBadgeProps = (status) => {
    const badges = {
      pending: { label: 'En attente', bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: <Clock size={12} className="text-amber-500" /> },
      approved: { label: 'Badge Certifié', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: <CheckCircle2 size={12} className="text-emerald-500" /> },
      rejected: { label: 'Rejetée', bg: '#fff1f2', color: '#be123c', border: '#fecdd3', icon: <X size={12} className="text-rose-500" /> },
    };
    return badges[status] || badges.pending;
  };

  const renderUserInfo = (user) => {
    if (!user) return { name: 'Inconnu', type: 'Inconnu', phone: '', email: '', typeColor: '#64748b', typeBg: '#f1f5f9', icon: <User size={14} />, initials: 'U' };
    
    const isCompany = user.user_type === 'company';
    const cand = user.candidate_profile || user.candidateProfile;
    const comp = user.company_profile || user.companyProfile;

    if (isCompany && comp) {
      return {
        name: comp.company_name || 'Entreprise',
        type: 'Entreprise',
        phone: comp.contact_phone || user.phone || '—',
        email: comp.email || user.email || '—',
        typeColor: '#1d4ed8',
        typeBg: '#dbeafe',
        icon: <Building size={14} color="#1d4ed8" />,
        initials: comp.company_name?.[0]?.toUpperCase() || 'E',
        avatarBg: '#0f172a',
        profile: comp,
        isCompany: true
      };
    } else if (cand) {
      return {
        name: `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidat',
        type: 'Candidat',
        phone: user.phone || '—',
        email: user.email || '—',
        typeColor: '#15803d',
        typeBg: '#dcfce7',
        icon: <User size={14} color="#15803d" />,
        initials: `${cand.first_name?.[0] || ''}${cand.last_name?.[0] || ''}`.toUpperCase() || 'C',
        photo: cand.profile_photo_url || cand.photos?.[0]?.photo_url,
        avatarBg: '#e2e8f0',
        profile: cand,
        isCompany: false
      };
    }
    return { 
      name: user.phone || user.email || `Utilisateur #${user.id}`, 
      type: user.user_type === 'company' ? 'Entreprise' : 'Candidat', 
      phone: user.phone || '—', 
      email: user.email || '—',
      typeColor: '#64748b', 
      typeBg: '#f1f5f9', 
      icon: <User size={14} />, 
      initials: 'U', 
      avatarBg: '#e2e8f0',
      profile: null,
      isCompany: user.user_type === 'company'
    };
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'all') return true;
    if (activeTab === 'candidate' && req.user?.user_type === 'candidate') return true;
    if (activeTab === 'company' && req.user?.user_type === 'company') return true;
    return false;
  });

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <FileBadge size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-poppins">
                  Demandes de Vérification & Badges
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Examinez les pièces justificatives et certifiez les profils candidats et entreprises
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchRequests(1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <Clock size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            Actualiser
          </button>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total en attente</p>
              <p className="text-3xl font-black text-slate-900 mt-1 font-poppins">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Candidats en attente</p>
              <p className="text-3xl font-black text-slate-900 mt-1 font-poppins">{stats.users}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Entreprises en attente</p>
              <p className="text-3xl font-black text-slate-900 mt-1 font-poppins">{stats.companies}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building size={24} />
            </div>
          </div>
        </div>

        {/* Barre de filtres et onglets */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'candidate', label: 'Candidats' },
                { id: 'company', label: 'Entreprises' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="pending">Statut : En attente</option>
              <option value="approved">Statut : Approuvées</option>
              <option value="rejected">Statut : Rejetées</option>
              <option value="all">Tous les statuts</option>
            </select>
          </div>
        </div>

        {/* Table des demandes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Clock size={28} className="animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-sm font-medium">Chargement des demandes de badge...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Aucune demande trouvée</p>
              <p className="text-xs text-slate-400 mt-1">Toutes les demandes ont été traitées ou correspondent aux critères</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Demandeur</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Justificatif</th>
                    <th className="py-3.5 px-4">Date de demande</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRequests.map((req) => {
                    const userInfo = renderUserInfo(req.user);
                    const badge = getStatusBadgeProps(req.status);
                    const date = new Date(req.created_at);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-400">
                          #{req.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {userInfo.photo ? (
                              <img 
                                src={userInfo.photo} 
                                alt={userInfo.name} 
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm" style={{ background: userInfo.avatarBg }}>
                                {userInfo.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{userInfo.name}</p>
                              <p className="text-xs text-slate-400 truncate">{userInfo.phone} {userInfo.email && `• ${userInfo.email}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ background: userInfo.typeBg, color: userInfo.typeColor }}
                          >
                            {userInfo.icon}
                            {userInfo.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.document_url ? (
                            <a
                              href={req.document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                            >
                              <Download size={13} />
                              Voir document
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Aucun fichier</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          <p className="font-semibold text-slate-700">
                            {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                            style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openStatusModal(req)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                            >
                              <Eye size={13} />
                              Examiner profil
                            </button>

                            {req.status === 'pending' && (
                              <button
                                onClick={() => quickApprove(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                                title="Certifier immédiatement"
                              >
                                <Award size={13} />
                                Certifier
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold">{meta.current_page}</span> sur <span className="font-bold">{meta.last_page}</span> ({meta.total} résultats)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Précédent
                </button>
                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails Complets de l'Utilisateur & Certification du Badge */}
      {showStatusModal && selectedReq && (() => {
        const userInfo = renderUserInfo(selectedReq.user);
        const cand = selectedReq.user?.candidate_profile || selectedReq.user?.candidateProfile;
        const comp = selectedReq.user?.company_profile || selectedReq.user?.companyProfile;
        const isCompany = selectedReq.user?.user_type === 'company';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Header du modal */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3.5">
                  {userInfo.photo ? (
                    <img 
                      src={userInfo.photo} 
                      alt={userInfo.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md shrink-0" style={{ background: userInfo.avatarBg }}>
                      {userInfo.initials}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 font-poppins">
                        {userInfo.name}
                      </h3>
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                        style={{ background: userInfo.typeBg, color: userInfo.typeColor }}
                      >
                        {userInfo.icon}
                        {userInfo.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Demande de badge #{selectedReq.id} • Déposée le {new Date(selectedReq.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenu Déroulant / Toutes les Infos */}
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* 1. Coordonnées & Identifiants du compte */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Info size={13} />
                    Informations du Compte
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block mb-0.5">Téléphone Principal</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        {selectedReq.user?.phone || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block mb-0.5">Adresse Email</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        <Mail size={12} className="text-slate-400" />
                        {selectedReq.user?.email || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 block mb-0.5">Pays / Origine</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Globe size={12} className="text-slate-400" />
                        {selectedReq.user?.country?.name || 'Guinée (GN)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Profil Spécifique (Candidat ou Entreprise) */}
                {isCompany && comp ? (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                    <p className="text-xs font-bold uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                      <Building size={13} />
                      Profil Entreprise Détaillé
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Raison Sociale</span>
                        <span className="font-bold text-slate-900 text-sm">{comp.company_name}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Secteur d'activité</span>
                        <span className="font-bold text-slate-800">{comp.sector || 'Général'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Numéro RCCM</span>
                        <span className="font-bold text-slate-800">{comp.rccm_number || 'Non renseigné'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Numéro NIF</span>
                        <span className="font-bold text-slate-800">{comp.nif_number || 'Non renseigné'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Contact Référent & Tél</span>
                        <span className="font-bold text-slate-800">{comp.contact_phone || 'Non renseigné'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100">
                        <span className="text-slate-400 block mb-0.5">Localisation</span>
                        <span className="font-bold text-slate-800">
                          {[comp.commune?.name, comp.prefecture?.name, comp.address].filter(Boolean).join(', ') || 'Non précisée'}
                        </span>
                      </div>
                    </div>
                    {comp.description && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 text-xs">
                        <span className="text-slate-400 block mb-1">Description de l'entreprise :</span>
                        <p className="text-slate-700 leading-relaxed">{comp.description}</p>
                      </div>
                    )}
                  </div>
                ) : cand ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                        <UserCheck size={13} />
                        Profil Candidat Détaillé
                      </p>
                      {cand.completeness_score !== undefined && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Complétion profil : {cand.completeness_score}%
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-0.5">Nom Complet</span>
                        <span className="font-bold text-slate-900">{cand.first_name} {cand.last_name}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-0.5">Date de naissance & Sexe</span>
                        <span className="font-bold text-slate-800">
                          {cand.birth_date ? new Date(cand.birth_date).toLocaleDateString('fr-FR') : '—'} 
                          {cand.gender && ` (${cand.gender === 'male' ? 'Homme' : 'Femme'})`}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-0.5">Moyen de Transport</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Car size={12} className="text-slate-400" />
                          {cand.has_transport ? (cand.transport_type || 'Oui (Véhiculé)') : 'Non'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Localisation / Commune</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {[cand.commune?.name, cand.prefecture?.name].filter(Boolean).join(', ') || 'Non précisée'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-slate-400 block mb-0.5">Statut Actuel</span>
                        <span className={`font-bold ${cand.is_hired ? 'text-blue-600' : 'text-slate-700'}`}>
                          {cand.is_hired ? 'En poste (Embauché)' : 'Disponible'}
                        </span>
                      </div>
                    </div>

                    {cand.skills && cand.skills.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs">
                        <span className="text-slate-400 block mb-1.5">Compétences :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cand.skills.map((s, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px] border border-emerald-200">
                              {s.name || s.skill_name || s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {cand.bio && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs">
                        <span className="text-slate-400 block mb-1">Présentation / Bio :</span>
                        <p className="text-slate-700 leading-relaxed italic">{cand.bio}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* 3. Justificatif & Pièce fournie */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                      <FileBadge size={14} />
                      Document Justificatif Fourni
                    </p>
                    {selectedReq.document_url && (
                      <a 
                        href={selectedReq.document_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <ExternalLink size={12} />
                        Ouvrir en plein écran
                      </a>
                    )}
                  </div>

                  {selectedReq.document_url ? (
                    <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Pièce justificative (Carte d'identité / RCCM)</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-sm">{selectedReq.document_url}</p>
                        </div>
                      </div>

                      <a 
                        href={selectedReq.document_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        Télécharger
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-500 italic">
                      Aucun document numérique n'a été joint à cette demande.
                    </div>
                  )}
                </div>

                {/* 4. Décision de Modération */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Décision de Certification :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'approved' })}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        statusForm.status === 'approved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Award size={15} className={statusForm.status === 'approved' ? 'text-white' : 'text-emerald-500'} />
                      Approuver le badge
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'pending' })}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        statusForm.status === 'pending'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Clock size={15} className={statusForm.status === 'pending' ? 'text-white' : 'text-amber-500'} />
                      En attente
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'rejected' })}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        statusForm.status === 'rejected'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <X size={15} className={statusForm.status === 'rejected' ? 'text-white' : 'text-rose-500'} />
                      Rejeter la demande
                    </button>
                  </div>

                  {statusForm.status === 'rejected' && (
                    <div className="space-y-1.5 pt-2 animate-fadeIn">
                      <label className="text-xs font-bold text-rose-700">
                        Motif du refus (qui sera visible par l'utilisateur) :
                      </label>
                      <textarea
                        rows={2}
                        value={statusForm.note}
                        onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                        placeholder="Ex: Le document fourni est illisible ou a expiré. Merci de fournir une copie nette de votre pièce d'identité..."
                        className="w-full p-3 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer du modal */}
              <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition"
                >
                  Fermer
                </button>

                <button
                  onClick={() => submitStatusChange()}
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 ${
                    statusForm.status === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : (statusForm.status === 'rejected' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20')
                  }`}
                >
                  {submitting ? (
                    <>
                      <Clock size={14} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirmer la décision
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl text-white font-bold text-sm shadow-xl flex items-center gap-2 backdrop-blur-md animate-slideUp ${
            toast.type === 'error' ? 'bg-rose-600/95 border border-rose-500' : 'bg-emerald-600/95 border border-emerald-500'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}
    </MainLayout>
  );
};

export default PendingBadges;
