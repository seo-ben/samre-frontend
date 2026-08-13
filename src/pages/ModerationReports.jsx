import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flag, AlertTriangle, CheckCircle, XCircle, Clock, ShieldAlert,
  Search, Filter, RefreshCw, Eye, Ban, Check, User, Calendar, Briefcase, CalendarDays, ChevronRight
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const ModerationReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'resolved_banned', 'resolved_dismissed', ''
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState(null); // 'ban' or 'dismiss'
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page);

      const response = await apiClient.get(`/admin/reports?${params.toString()}`);
      if (response.data?.success) {
        const data = response.data.data;
        setReports(data.data || []);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;
    setSubmittingAction(true);
    try {
      const endpoint = actionType === 'ban' 
        ? `/admin/reports/${selectedReport.id}/ban`
        : `/admin/reports/${selectedReport.id}/dismiss`;

      const res = await apiClient.post(endpoint, { admin_notes: adminNotes });
      if (res.data?.success) {
        setSelectedReport(null);
        setActionType(null);
        setAdminNotes('');
        fetchReports();
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Erreur lors du traitement du signalement.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getReasonLabel = (reasonId) => {
    switch (reasonId) {
      case 'suspect_event':
        return { text: 'Événement / Offre suspecte', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'fake_organization':
        return { text: 'Fausse organisation / Entreprise fictive', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'incorrect_info':
        return { text: 'Information incorrecte', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'inappropriate':
        return { text: 'Contenu inapproprié ou haineux', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'fraud':
        return { text: 'Offre / Événement frauduleux ou arnaque', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'terms_violation':
        return { text: 'Violation des conditions', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      default:
        return { text: 'Autre motif', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} className="text-amber-500" />
            En attente
          </span>
        );
      case 'resolved_banned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} className="text-rose-500" />
            Contenu banni
          </span>
        );
      case 'resolved_dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} className="text-emerald-500" />
            Classé sans suite
          </span>
        );
      default:
        return null;
    }
  };

  const filteredReports = reports.filter(r => {
    if (!search) return true;
    const term = search.toLowerCase();
    const title = (r.reportable?.title || r.reportable?.name || '').toLowerCase();
    const reporter = (r.reporter?.first_name || r.reporter?.name || r.reporter?.email || '').toLowerCase();
    const reason = getReasonLabel(r.reason).text.toLowerCase();
    return title.includes(term) || reporter.includes(term) || reason.includes(term);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Modération des Signalements</h1>
            <p className="text-sm text-slate-500">Examinez les offres d'emploi et événements signalés par les utilisateurs</p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={16} />
            En attente de révision
          </button>
          <button
            onClick={() => { setStatusFilter('resolved_banned'); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'resolved_banned'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle size={16} />
            Contenus bannis
          </button>
          <button
            onClick={() => { setStatusFilter('resolved_dismissed'); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'resolved_dismissed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle size={16} />
            Classés sans suite
          </button>
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === ''
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tous les signalements
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, motif, utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-amber-500" />
            Chargement des signalements...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ShieldAlert size={40} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-semibold text-slate-700">Aucun signalement trouvé</h3>
            <p className="text-sm text-slate-400">Aucun contenu ne correspond au filtre sélectionné.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Contenu Signalé</th>
                  <th className="py-3.5 px-4">Motif de Signalement</th>
                  <th className="py-3.5 px-4">Signaleur</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const isOffer = report.reportable_type?.includes('JobOffer');
                  const targetTitle = report.reportable?.title || report.reportable?.name || 'Contenu supprimé';
                  const reasonBadge = getReasonLabel(report.reason);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isOffer ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {isOffer ? <Briefcase size={16} /> : <CalendarDays size={16} />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1">{targetTitle}</div>
                            <span className="text-xs text-slate-400 font-medium">
                              {isOffer ? "Offre d'emploi" : "Événement"} • ID #{report.reportable_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${reasonBadge.color}`}>
                            {reasonBadge.text}
                          </span>
                          {report.description && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xs">
                              "{report.description}"
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {report.reporter?.first_name ? `${report.reporter.first_name} ${report.reporter.last_name || ''}` : 'Utilisateur'}
                            </div>
                            <div className="text-[11px] text-slate-400">{report.reporter?.email || report.reporter?.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {report.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedReport(report); setActionType('ban'); setAdminNotes(''); }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm flex items-center gap-1.5"
                              title="Bannir le contenu"
                            >
                              <Ban size={14} />
                              Bannir
                            </button>
                            <button
                              onClick={() => { setSelectedReport(report); setActionType('dismiss'); setAdminNotes(''); }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
                              title="Classer sans suite"
                            >
                              <Check size={14} />
                              Classer sans suite
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Traité par {report.reviewer?.first_name || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedReport && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                actionType === 'ban' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {actionType === 'ban' ? <Ban size={20} /> : <CheckCircle size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {actionType === 'ban' ? 'Bannir ce contenu' : 'Classer sans suite'}
                </h3>
                <p className="text-xs text-slate-500">
                  {actionType === 'ban'
                    ? 'Le contenu sera banni du flux et l\'auteur sera notifié.'
                    : 'Le contenu restera en ligne et le signalement sera fermé.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
              <div className="font-semibold text-slate-700">
                {selectedReport.reportable?.title || selectedReport.reportable?.name || 'Contenu'}
              </div>
              <div className="text-slate-500">Motif : {getReasonLabel(selectedReport.reason).text}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarques administratives (facultatif)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Précisez la raison de votre décision..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setSelectedReport(null); setActionType(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={submittingAction}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition flex items-center gap-2 ${
                  actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submittingAction && <RefreshCw size={14} className="animate-spin" />}
                {actionType === 'ban' ? 'Confirmer le bannissement' : 'Confirmer le classement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationReportsPage;
