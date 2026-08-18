import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  FileText, User, Building, Search, Filter,
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, ShieldAlert, Download,
  Phone, Mail, Globe, MapPin, Car, Award, Calendar, ExternalLink,
  ShieldCheck, RefreshCw, Check, AlertCircle, Building2, UserCheck, Info
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const VerifiedProfiles = ({ userType }) => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'approved', note: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const title = userType === 'candidate' ? 'Secrétaires Certifiées' : 'Entreprises Certifiées';
  const isCandidate = userType === 'candidate';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
      console.error('Erreur lors de la récupération des profils certifiés', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, [searchQuery, userType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta?.last_page) {
      fetchRequests(newPage);
    }
  };

  const openStatusModal = (req) => {
    setSelectedReq(req);
    setStatusForm({ status: req.status || 'approved', note: req.rejection_reason || '' });
    setShowStatusModal(true);
  };

  const submitStatusChange = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
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
      showToast(
        statusForm.status === 'approved' ? 'Certification maintenue avec succès' : 'Statut de certification mis à jour',
        statusForm.status === 'approved' ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Erreur de mise à jour', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUserInfo = (user) => {
    if (!user) return null;
    const cand = user.candidate_profile || user.candidateProfile;
    const comp = user.company_profile || user.companyProfile;

    if (comp) {
      return {
        name: comp.company_name || user.phone || 'Entreprise',
        type: 'Entreprise',
        phone: comp.company_phone || user.phone || '—',
        email: comp.company_email || user.email || '—',
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
        name: `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || user.phone || 'Secrétaire',
        type: 'Secrétaire',
        phone: user.phone || '—',
        email: user.email || '—',
        typeColor: '#15803d',
        typeBg: '#dcfce7',
        icon: <User size={14} color="#15803d" />,
        initials: `${cand.first_name?.[0] || ''}${cand.last_name?.[0] || ''}`.toUpperCase() || 'S',
        photo: cand.profile_photo_url || cand.photos?.[0]?.photo_url,
        avatarBg: '#e2e8f0',
        profile: cand,
        isCompany: false
      };
    }
    return { 
      name: user.phone || user.email || 'Utilisateur', 
      type: user.user_type === 'company' ? 'Entreprise' : 'Secrétaire', 
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

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${isCandidate ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'}`}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-poppins">
                  {title}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Consultez l'ensemble des profils certifiés possédant le badge officiel SAMRE
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchRequests(1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            Actualiser
          </button>
        </div>

        {/* Barre de filtres et recherche */}
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

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {meta?.total || 0} profils certifiés actifs
            </span>
          </div>
        </div>

        {/* Tableau des profils certifiés (Sans colonne ID brute) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-sm font-medium">Chargement des profils certifiés...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Aucun profil certifié trouvé</p>
              <p className="text-xs text-slate-400 mt-1">Tous les profils vérifiés apparaîtront ici dès leur approbation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Titulaire du Badge</th>
                    <th className="py-3.5 px-4">Type de compte</th>
                    <th className="py-3.5 px-4">Localisation</th>
                    <th className="py-3.5 px-4">Date de certification</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {requests.map((req) => {
                    const userInfo = renderUserInfo(req.user);
                    const date = new Date(req.updated_at || req.created_at);
                    const cand = req.user?.candidate_profile || req.user?.candidateProfile;
                    const comp = req.user?.company_profile || req.user?.companyProfile;
                    const location = isCandidate 
                      ? ([cand?.commune?.name, cand?.prefecture?.name].filter(Boolean).join(', ') || 'Non précisée')
                      : ([comp?.commune?.name, comp?.prefecture?.name, comp?.address].filter(Boolean).join(', ') || 'Non précisée');

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
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
                              <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                {userInfo.name}
                                <CheckCircle2 size={13} className="text-blue-500" />
                              </p>
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
                        <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{location}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {date.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Badge Actif
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openStatusModal(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye size={13} />
                            Fiche Complète
                          </button>
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

      {/* Modal Complet de Consultation & Gestion de la Certification */}
      {showStatusModal && selectedReq && (() => {
        const userInfo = renderUserInfo(selectedReq.user);
        const cand = selectedReq.user?.candidate_profile || selectedReq.user?.candidateProfile;
        const comp = selectedReq.user?.company_profile || selectedReq.user?.companyProfile;
        const isComp = selectedReq.user?.user_type === 'company';
        const isDummy = selectedReq.document_url && selectedReq.document_url.includes('dummy.pdf');

        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              padding: '16px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '820px',
                maxHeight: 'calc(100vh - 40px)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                margin: 'auto'
              }}
            >
              
              {/* Header FIXE du modal */}
              <div 
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
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
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
                        style={{ background: userInfo.typeBg, color: userInfo.typeColor }}
                      >
                        {userInfo.icon}
                        {userInfo.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Certification approuvée le {new Date(selectedReq.updated_at || selectedReq.created_at).toLocaleDateString('fr-FR', {
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

              {/* Contenu DÉROULANT / Scrollable Body */}
              <div 
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                
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
                {isComp && comp ? (
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
                        Profil Secrétaire Détaillé
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

                {/* 3. Gestion de la Certification (Révocation / Maintien) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Statut du Badge SAMRE :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'approved' })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: statusForm.status === 'approved' ? '#16a34a' : '#ffffff',
                        color: statusForm.status === 'approved' ? '#ffffff' : '#1e293b',
                        border: statusForm.status === 'approved' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        boxShadow: statusForm.status === 'approved' ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none'
                      }}
                    >
                      <Award size={15} color={statusForm.status === 'approved' ? '#ffffff' : '#16a34a'} />
                      Maintenir Certifié
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'pending' })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: statusForm.status === 'pending' ? '#d97706' : '#ffffff',
                        color: statusForm.status === 'pending' ? '#ffffff' : '#1e293b',
                        border: statusForm.status === 'pending' ? '2px solid #d97706' : '1px solid #cbd5e1',
                        boxShadow: statusForm.status === 'pending' ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
                      }}
                    >
                      <RefreshCw size={15} color={statusForm.status === 'pending' ? '#ffffff' : '#d97706'} />
                      Remettre en attente
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: 'rejected' })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: statusForm.status === 'rejected' ? '#dc2626' : '#ffffff',
                        color: statusForm.status === 'rejected' ? '#ffffff' : '#1e293b',
                        border: statusForm.status === 'rejected' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        boxShadow: statusForm.status === 'rejected' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
                      }}
                    >
                      <X size={15} color={statusForm.status === 'rejected' ? '#ffffff' : '#dc2626'} />
                      Révoquer le badge
                    </button>
                  </div>

                  {statusForm.status === 'rejected' && (
                    <div className="space-y-1.5 pt-2 animate-fadeIn">
                      <label className="text-xs font-bold text-rose-700">
                        Motif de la révocation (notifié à l'utilisateur) :
                      </label>
                      <textarea
                        rows={2}
                        value={statusForm.note}
                        onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                        placeholder="Ex: Le document d'identité a expiré ou le compte a été suspendu..."
                        className="w-full p-3 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Footer FIXE du modal avec boutons toujours visibles */}
              <div 
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={submitStatusChange}
                  disabled={submitting}
                  style={{
                    padding: '11px 22px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: statusForm.status === 'approved' ? '#16a34a' : (statusForm.status === 'rejected' ? '#dc2626' : '#f59e0b'),
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: '0.2s'
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Toast Notification 100% opaque et visible */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999,
            backgroundColor: toast.type === 'error' ? '#e11d48' : '#059669',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 20px 35px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'slideUp 0.3s ease-out forwards'
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} color="#ffffff" /> : <CheckCircle2 size={18} color="#ffffff" />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </MainLayout>
  );
};

export default VerifiedProfiles;
