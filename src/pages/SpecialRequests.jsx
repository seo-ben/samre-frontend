import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Clock, CheckCircle2, XCircle, AlertCircle, 
  Search, RefreshCw, Eye, User, Phone, Mail, Calendar, 
  Tag, MessageSquare, ChevronRight, Check, X, ShieldAlert,
  HelpCircle, ArrowUpRight, Filter
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';
import { useRealtime } from '../contexts/RealtimeContext';

export const SpecialRequestsPage = () => {
  const { syncCounter, refreshNow } = useRealtime();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal de consultation et traitement
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page);

      const response = await apiClient.get(`/v1/admin/special-requests?${params.toString()}`);
      if (response.data?.success || response.data?.status === 'success') {
        const payload = response.data.data || response.data;
        const list = payload.requests || (Array.isArray(payload) ? payload : (payload.data || []));
        setRequests(list);
        if (payload.stats) {
          setStats(payload.stats);
        } else if (response.data.stats) {
          setStats(response.data.stats);
        }
        const meta = response.data.meta || payload;
        if (meta) {
          setPagination({
            page: meta.page || meta.current_page || 1,
            last_page: meta.last_page || 1,
            total: meta.total || list.length,
            per_page: meta.per_page || 15,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching special requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, syncCounter]);

  const handleOpenModal = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes || '');
    setNewStatus(req.status === 'pending' ? 'in_progress' : req.status);
  };

  const handleUpdateStatus = async (statusToSet = newStatus) => {
    if (!selectedRequest) return;
    setSubmittingAction(true);
    try {
      const res = await apiClient.put(`/v1/admin/special-requests/${selectedRequest.id}/status`, {
        status: statusToSet,
        admin_notes: adminNotes,
      });

      if (res.data?.success) {
        setSelectedRequest(null);
        setAdminNotes('');
        fetchRequests();
        refreshNow();
      }
    } catch (err) {
      console.error('Error updating special request status:', err);
      alert('Erreur lors de la mise à jour de la demande.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="text-amber-500" />
            En attente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw size={12} className="text-blue-500 animate-spin" />
            En cours
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Résolue
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-500" />
            Rejetée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getCategoryColor = (key) => {
    switch (key) {
      case 'special_req_cat_personal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'special_req_cat_professional':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'special_req_cat_applications':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'special_req_cat_security':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'special_req_cat_companies_events':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* En-tête de la page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Sparkles size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-poppins">
                Demandes Spéciales
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les requêtes d'assistance sur mesure et les demandes de modifications des utilisateurs
            </p>
          </div>

          <button
            onClick={() => { fetchRequests(); refreshNow(); }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-amber-600' : 'text-slate-500'} />
            Actualiser
          </button>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div 
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <p className={`text-xs font-semibold ${statusFilter === 'all' ? 'text-slate-400' : 'text-slate-500'}`}>
              Total demandes
            </p>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.total}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'pending' 
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-600'}`}>
                En attente
              </p>
              <Clock size={16} className={statusFilter === 'pending' ? 'text-white' : 'text-amber-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.pending}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('in_progress'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'in_progress' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${statusFilter === 'in_progress' ? 'text-blue-100' : 'text-blue-600'}`}>
                En cours
              </p>
              <RefreshCw size={16} className={statusFilter === 'in_progress' ? 'text-white' : 'text-blue-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.in_progress}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('resolved'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'resolved' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${statusFilter === 'resolved' ? 'text-emerald-100' : 'text-emerald-600'}`}>
                Résolues
              </p>
              <CheckCircle2 size={16} className={statusFilter === 'resolved' ? 'text-white' : 'text-emerald-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.resolved}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('rejected'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'rejected' 
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${statusFilter === 'rejected' ? 'text-rose-100' : 'text-rose-600'}`}>
                Rejetées
              </p>
              <XCircle size={16} className={statusFilter === 'rejected' ? 'text-white' : 'text-rose-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.rejected}</p>
          </div>
        </div>

        {/* Barre de filtres et recherche */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher utilisateur, sujet, message..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <span>Catégorie :</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes les catégories</option>
                <option value="special_req_cat_personal">👤 Informations personnelles</option>
                <option value="special_req_cat_professional">📄 Profil professionnel</option>
                <option value="special_req_cat_applications">💼 Candidatures</option>
                <option value="special_req_cat_security">🔐 Compte & sécurité</option>
                <option value="special_req_cat_companies_events">🏢 Entreprises / événements</option>
                <option value="special_req_cat_other">⚙️ Autre demande</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des demandes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto text-amber-500 mb-3" />
              <p className="text-sm font-medium">Chargement des demandes spéciales...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <HelpCircle size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Aucune demande trouvée</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou effectuez une autre recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Demandeur</th>
                    <th className="py-3.5 px-4">Catégorie & Objet</th>
                    <th className="py-3.5 px-4">Message extrait</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {requests.map((req) => {
                    const userName = req.user?.candidateProfile 
                      ? `${req.user.candidateProfile.first_name || ''} ${req.user.candidateProfile.last_name || ''}`.trim()
                      : (req.user?.companyProfile?.company_name || req.user?.email || `Utilisateur #${req.user_id}`);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-400">
                          #{req.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 shrink-0">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                              <p className="text-xs text-slate-400 truncate">{req.user?.phone || req.user?.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${getCategoryColor(req.category_key)}`}>
                              {req.category_label}
                            </span>
                            <p className="text-xs font-bold text-slate-900">{req.subject_label}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {req.message}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenModal(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye size={13} />
                            Traiter
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
          {pagination && pagination.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold">{pagination.page}</span> sur <span className="font-bold">{pagination.last_page}</span> ({pagination.total} demandes)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Précédent
                </button>
                <button
                  disabled={pagination.page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de traitement d'une demande */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-poppins">
                    Traitement de la demande #{selectedRequest.id}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Déposée le {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Demandeur */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Demandeur</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedRequest.user?.candidateProfile 
                        ? `${selectedRequest.user.candidateProfile.first_name || ''} ${selectedRequest.user.candidateProfile.last_name || ''}`.trim()
                        : (selectedRequest.user?.companyProfile?.company_name || `Utilisateur #${selectedRequest.user_id}`)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Type: <span className="font-semibold uppercase">{selectedRequest.user?.user_type || 'candidat'}</span>
                    </p>
                  </div>
                  <div className="text-right text-xs space-y-1">
                    {selectedRequest.user?.phone && (
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-semibold">{selectedRequest.user.phone}</span>
                      </p>
                    )}
                    {selectedRequest.user?.email && (
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={12} className="text-slate-400" />
                        <span>{selectedRequest.user.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Objet et message */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getCategoryColor(selectedRequest.category_key)}`}>
                    {selectedRequest.category_label}
                  </span>
                  <span className="text-sm font-black text-slate-900 font-poppins">
                    {selectedRequest.subject_label}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-sm text-slate-800 leading-relaxed">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={13} />
                    Message du demandeur :
                  </p>
                  <p className="whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              </div>

              {/* Notes administratives */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notes internes de traitement (Admin) :
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ex: Contacté par téléphone, modification effectuée dans le profil, ou motif de rejet..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              {/* Sélecteur de statut */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Modifier le statut :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('in_progress')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newStatus === 'in_progress'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw size={13} className="text-blue-500" />
                    En cours
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('resolved')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newStatus === 'resolved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Résolue
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('rejected')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newStatus === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle size={13} className="text-rose-500" />
                    Rejetée
                  </button>
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setSelectedRequest(null)}
                disabled={submittingAction}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition"
              >
                Fermer
              </button>

              <button
                onClick={() => handleUpdateStatus()}
                disabled={submittingAction}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Valider le statut
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SpecialRequestsPage;
