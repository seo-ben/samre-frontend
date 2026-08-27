import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Clock, 
  Search, Filter, RefreshCw, Eye, Ban, Check, User, Calendar, 
  Briefcase, CalendarDays, ChevronRight, X, MessageSquare, 
  FileText, ExternalLink, ShieldCheck, Building2, Phone, Mail,
  AlertOctagon, CheckSquare, Sparkles, MapPin, ArrowRight
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';
import { useRealtime } from '../contexts/RealtimeContext';

export const ModerationReportsPage = () => {
  const { syncCounter, refreshNow } = useRealtime();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    banned: 0,
    dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal de traitement
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState(null); // 'ban' or 'dismiss'
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page);

      const response = await apiClient.get(`/v1/admin/reports?${params.toString()}`);
      if (response.data?.success || response.data?.status === 'success') {
        const payload = response.data.data || response.data;
        const list = payload.reports || (Array.isArray(payload) ? payload : (payload.data || []));
        setReports(list);
        
        if (payload.stats) {
          setStats(payload.stats);
        } else if (response.data.stats) {
          setStats(response.data.stats);
        }

        const meta = response.data.meta || payload;
        if (meta) {
          setPagination({
            current_page: meta.current_page || meta.page || 1,
            last_page: meta.last_page || 1,
            total: meta.total || list.length,
            per_page: meta.per_page || 15,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchReports(false);
  }, [fetchReports]);

  useEffect(() => {
    if (syncCounter > 0) {
      fetchReports(true);
    }
  }, [syncCounter, fetchReports]);

  const handleAction = async (type) => {
    if (!selectedReport || !type) return;
    setSubmittingAction(true);
    try {
      const endpoint = type === 'ban' 
        ? `/v1/admin/reports/${selectedReport.id}/ban`
        : `/v1/admin/reports/${selectedReport.id}/dismiss`;

      const res = await apiClient.post(endpoint, { 
        admin_notes: adminNotes || (type === 'ban' ? 'Contenu banni pour violation des conditions.' : 'Signalement vérifié et classé sans suite.')
      });

      if (res.data?.success || res.data?.status === 'success') {
        showToast(
          type === 'ban' ? 'Contenu banni et masqué avec succès.' : 'Signalement classé sans suite.',
          type === 'ban' ? 'error' : 'success'
        );
        setSelectedReport(null);
        setActionType(null);
        setAdminNotes('');
        fetchReports();
        refreshNow();
      }
    } catch (err) {
      console.error('Action error:', err);
      showToast('Erreur lors du traitement du signalement.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getReasonLabel = (reasonId) => {
    switch (reasonId) {
      case 'suspect_event':
        return { text: 'Offre / Événement suspect', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'fake_organization':
        return { text: 'Entreprise fictive / Fausse organisation', color: 'bg-red-100 text-red-900 border-red-300' };
      case 'incorrect_info':
        return { text: 'Information trompeuse ou inexacte', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'inappropriate':
        return { text: 'Contenu inapproprié ou abusif', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'fraud':
        return { text: 'Tentative de fraude / Arnaque', color: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'terms_violation':
        return { text: 'Non-respect des conditions d\'utilisation', color: 'bg-orange-100 text-orange-900 border-orange-300' };
      default:
        return { text: reasonId || 'Motif divers', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="text-amber-500 animate-pulse" />
            En attente
          </span>
        );
      case 'resolved_banned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-500" />
            Contenu banni
          </span>
        );
      case 'resolved_dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Classé sans suite
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTargetTypeBadge = (reportableType) => {
    if (reportableType?.includes('JobOffer')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Briefcase size={13} className="text-blue-500" />
          Offre d'emploi
        </span>
      );
    }
    if (reportableType?.includes('Event')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <CalendarDays size={13} className="text-purple-500" />
          Événement
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <FileText size={13} className="text-slate-500" />
        Publication
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header de la page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-poppins">
                  Modération & Signalements
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Examinez et traitez les signalements d'offres et d'événements déposés par les utilisateurs
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { fetchReports(); refreshNow(); }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-rose-600' : 'text-slate-500'} />
            Actualiser
          </button>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div 
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Signalements
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
              <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-600'}`}>
                En attente
              </p>
              <Clock size={16} className={statusFilter === 'pending' ? 'text-white' : 'text-amber-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.pending}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('processed'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'processed' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'processed' ? 'text-blue-100' : 'text-blue-600'}`}>
                Total Traités
              </p>
              <ShieldCheck size={16} className={statusFilter === 'processed' ? 'text-white' : 'text-blue-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.processed ?? ((stats.banned || 0) + (stats.dismissed || 0))}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('resolved_banned'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'resolved_banned' 
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'resolved_banned' ? 'text-rose-100' : 'text-rose-600'}`}>
                Contenus Bannis
              </p>
              <Ban size={16} className={statusFilter === 'resolved_banned' ? 'text-white' : 'text-rose-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.banned}</p>
          </div>

          <div 
            onClick={() => { setStatusFilter('resolved_dismissed'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'resolved_dismissed' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'resolved_dismissed' ? 'text-emerald-100' : 'text-emerald-600'}`}>
                Classés sans suite
              </p>
              <CheckCircle2 size={16} className={statusFilter === 'resolved_dismissed' ? 'text-white' : 'text-emerald-500'} />
            </div>
            <p className="text-2xl font-black mt-1 font-poppins">{stats.dismissed}</p>
          </div>
        </div>

        {/* Barre de filtres et recherche */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, motif, demandeur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'pending', label: 'En attente' },
              { id: 'processed', label: 'Traités' },
              { id: 'resolved_banned', label: 'Bannis' },
              { id: 'resolved_dismissed', label: 'Classés' },
              { id: 'all', label: 'Tous' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau des signalements (Sans colonne ID brute) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto text-rose-500 mb-3" />
              <p className="text-sm font-medium">Chargement des signalements...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Aucun signalement dans cette section</p>
              <p className="text-xs text-slate-400 mt-1">Tous les signalements ont été traités ou correspondent à vos critères</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Contenu ciblé</th>
                    <th className="py-3.5 px-4">Motif & Explication</th>
                    <th className="py-3.5 px-4">Auteur du signalement</th>
                    <th className="py-3.5 px-4">Date de dépôt</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reports.map((report) => {
                    const reason = getReasonLabel(report.reason);
                    const targetTitle = report.reportable?.title || report.reportable?.name || 'Publication concernée';
                    const reporterName = report.reporter?.candidateProfile 
                      ? `${report.reporter.candidateProfile.first_name || ''} ${report.reporter.candidateProfile.last_name || ''}`.trim()
                      : (report.reporter?.companyProfile?.company_name || report.reporter?.email || 'Utilisateur Samre');

                    return (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-xs">
                            {getTargetTypeBadge(report.reportable_type)}
                            <p className="text-sm font-bold text-slate-900 truncate" title={targetTitle}>
                              {targetTitle}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-xs">
                            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${reason.color}`}>
                              {reason.text}
                            </span>
                            {(report.description || report.details) && (
                              <p className="text-xs text-slate-500 line-clamp-1 italic">
                                "{report.description || report.details}"
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 shrink-0">
                              {reporterName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{reporterName}</p>
                              <p className="text-[11px] text-slate-400 truncate">{report.reporter?.phone || report.reporter?.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotes(report.admin_notes || '');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
                          >
                            <Eye size={13} />
                            Examiner
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
                Page <span className="font-bold">{pagination.current_page}</span> sur <span className="font-bold">{pagination.last_page}</span> ({pagination.total} signalements)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Précédent
                </button>
                <button
                  disabled={pagination.current_page >= pagination.last_page}
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

      {/* Modal de Traitement & Décision Modérateur */}
      {selectedReport && (
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
              maxWidth: '720px',
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
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 font-poppins">
                      Examen du Signalement
                    </h3>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Signalé le {new Date(selectedReport.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps DÉROULANT du modal / Scrollable Body */}
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
              
              {/* 1. Contenu ciblé par le signalement */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Contenu Cible
                  </span>
                  {getTargetTypeBadge(selectedReport.reportable_type)}
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 font-poppins">
                    {selectedReport.reportable?.title || selectedReport.reportable?.name || 'Contenu publié'}
                  </h4>
                  {selectedReport.reportable?.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                      {selectedReport.reportable.description}
                    </p>
                  )}
                  {selectedReport.reportable?.company && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      Entreprise émettrice : <span className="font-semibold text-slate-800">{selectedReport.reportable.company.company_name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Motif et explications fournies */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-600 tracking-wider flex items-center gap-1">
                    <AlertTriangle size={13} />
                    Motif signalé
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getReasonLabel(selectedReport.reason).color}`}>
                    {getReasonLabel(selectedReport.reason).text}
                  </span>
                </div>

                {(selectedReport.description || selectedReport.details) ? (
                  <div className="text-sm text-slate-800 pt-1">
                    <p className="text-xs font-bold text-slate-500 mb-0.5">Explication fournie :</p>
                    <p className="whitespace-pre-wrap bg-white/80 p-3 rounded-xl border border-rose-200/50 leading-relaxed text-xs">
                      {selectedReport.description || selectedReport.details}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Aucune note détaillée précisée.</p>
                )}
              </div>

              {/* 3. Auteur du signalement */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Signalé par</p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedReport.reporter?.candidateProfile 
                        ? `${selectedReport.reporter.candidateProfile.first_name || ''} ${selectedReport.reporter.candidateProfile.last_name || ''}`.trim()
                        : (selectedReport.reporter?.companyProfile?.company_name || selectedReport.reporter?.email || 'Utilisateur')}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1">
                  {selectedReport.reporter?.phone && (
                    <p className="text-slate-700 font-semibold">{selectedReport.reporter.phone}</p>
                  )}
                  {selectedReport.reporter?.email && (
                    <p className="text-slate-400">{selectedReport.reporter.email}</p>
                  )}
                </div>
              </div>

              {/* 4. Décision & Notes de traitement */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notes internes de traitement :
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ex: Contenu vérifié conforme, ou publication supprimée pour non-respect des règles..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>
            </div>

            {/* Actions claires du modal */}
            <div 
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
                gap: '12px',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                disabled={submittingAction}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleAction('dismiss')}
                  disabled={submittingAction}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    transition: '0.2s'
                  }}
                >
                  <Check size={16} />
                  Classer sans suite
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('ban')}
                  disabled={submittingAction}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                    transition: '0.2s'
                  }}
                >
                  <Ban size={16} />
                  Bannir le contenu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {toast.type === 'error' ? <AlertOctagon size={18} color="#ffffff" /> : <CheckCircle2 size={18} color="#ffffff" />}
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

export default ModerationReportsPage;
