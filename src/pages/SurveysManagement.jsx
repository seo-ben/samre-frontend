import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
  Vote,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  Users,
  Building2,
  UserCheck,
  TrendingUp,
  BarChart3,
  PieChart,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Share2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAuth } from '../contexts/AuthContext';

// Helper de badge d'audience
const getAudienceBadge = (aud) => {
  switch (aud) {
    case 'candidate':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Users size={11} />
          Candidats
        </span>
      );
    case 'company':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Building2 size={11} />
          Entreprises
        </span>
      );
    case 'visitor':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <UserCheck size={11} />
          Visiteurs
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles size={11} />
          Tous
        </span>
      );
  }
};

export const SurveysManagementPage = () => {
  const { can } = useAuth();
  const canCreate = can('create', '/surveys');
  const canEdit = can('edit', '/surveys');
  const canDelete = can('delete', '/surveys');
  const { syncCounter, refreshNow } = useRealtime();

  const [surveys, setSurveys] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pagination, setPagination] = useState(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Modal de confirmation de suppression personnalisée (pas d'alerte javascript native)
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Formulaire de création / édition
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    description: '',
    category: 'SONDAGE',
    target_audience: 'all',
    is_multiple_choice: false,
    expires_in_days: 7,
    options: ['', '']
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fermeture des modales avec la touche Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setSelectedAnalytics(null);
        setSurveyToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSurveys = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(targetFilter && { target_audience: targetFilter })
      };

      const response = await apiClient.get('/v1/admin/surveys', { params });
      if (response.data?.status === 'success' || response.data?.success) {
        setSurveys(response.data.data || []);
        setPagination(response.data.meta);
        setKpis(response.data.kpis);
      }
    } catch (err) {
      console.error('Erreur chargement sondages:', err);
      if (!isSilent) {
        showToast('Impossible de charger les sondages.', 'error');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [page, perPage, search, statusFilter, targetFilter]);

  useEffect(() => {
    fetchSurveys(false);
  }, [fetchSurveys]);

  // Synchronisation en arrière-plan sans clignotement
  useEffect(() => {
    if (syncCounter > 0) {
      fetchSurveys(true);
    }
  }, [syncCounter, fetchSurveys]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSurveys(false);
  };

  // Ouvrir modal création
  const handleOpenCreate = () => {
    setEditingSurvey(null);
    setFormData({
      title: 'Sondage Officiel',
      question: '',
      description: '',
      category: 'SONDAGE',
      target_audience: 'all',
      is_multiple_choice: false,
      expires_in_days: 7,
      options: ['', '']
    });
    setShowCreateModal(true);
  };

  // Ouvrir modal édition
  const handleOpenEdit = (survey) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title || 'Sondage',
      question: survey.question,
      description: survey.description || '',
      category: survey.category || 'SONDAGE',
      target_audience: survey.target_audience,
      is_multiple_choice: survey.is_multiple_choice,
      expires_in_days: survey.expires_in_days || 7,
      options: survey.options?.map(o => o.text) || []
    });
    setShowCreateModal(true);
  };

  // Ouvrir modal Analytics
  const handleOpenAnalytics = async (survey) => {
    setSelectedAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const res = await apiClient.get(`/v1/admin/surveys/${survey.id}/analytics`);
      if (res.data?.status === 'success' || res.data?.success) {
        setSelectedAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Erreur analytics:', err);
      // Fallback local data
      setSelectedAnalytics({
        id: survey.id,
        question: survey.question,
        total_votes: survey.total_votes,
        target_audience: survey.target_audience,
        status: survey.status,
        votes_by_role: { candidate: 0, company: 0, visitor: 0, anonymous: 0 },
        options_breakdown: survey.options || []
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Soumission création / mise à jour
  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      showToast('La question du sondage est obligatoire.', 'error');
      return;
    }
    const filteredOptions = formData.options.map(o => o.trim()).filter(o => o.length > 0);
    if (!editingSurvey && filteredOptions.length < 2) {
      showToast('Veuillez renseigner au moins 2 options de réponse.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSurvey) {
        await apiClient.put(`/v1/admin/surveys/${editingSurvey.id}`, {
          question: formData.question,
          description: formData.description,
          target_audience: formData.target_audience,
          is_multiple_choice: formData.is_multiple_choice,
          expires_in_days: formData.expires_in_days
        });
        showToast('Sondage mis à jour avec succès !');
      } else {
        await apiClient.post('/v1/admin/surveys', {
          ...formData,
          options: filteredOptions
        });
        showToast('Sondage créé et publié avec succès !');
      }
      setShowCreateModal(false);
      fetchSurveys(false);
      refreshNow();
    } catch (err) {
      console.error('Erreur sauvegarde sondage:', err);
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Basculer statut actif/clôturé
  const handleToggleStatus = async (survey) => {
    try {
      await apiClient.patch(`/v1/admin/surveys/${survey.id}/status`);
      showToast(`Le sondage a été ${survey.status === 'active' ? 'clôturé' : 'réactivé'}.`);
      fetchSurveys(false);
      refreshNow();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      showToast('Action impossible.', 'error');
    }
  };

  // Confirmer et supprimer le sondage
  const confirmDeleteSurvey = async () => {
    if (!surveyToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/v1/admin/surveys/${surveyToDelete.id}`);
      showToast('Sondage supprimé définitivement avec succès.');
      setSurveyToDelete(null);
      fetchSurveys(false);
      refreshNow();
    } catch (err) {
      console.error('Erreur suppression:', err);
      showToast('Erreur lors de la suppression.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Calcul des numéros de page pour la pagination
  const renderPaginationButtons = () => {
    if (!pagination || pagination.last_page <= 1) return null;
    const totalPages = pagination.last_page;
    const currentPage = pagination.current_page;
    const pages = [];

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs select-none">
            ...
          </span>
        );
      }
      return (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${currentPage === p
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <MainLayout>
      <div className="space-y-4 pb-12">

        {/* Header Title & Bouton Nouveau Sondage Très Visible */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-poppins flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                <Vote size={22} />
              </div>
              Sondages & Enquêtes Publiques
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilotez, ciblez et analysez les sondages interactifs auprès des candidats, entreprises et visiteurs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchSurveys(false)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-orange-600' : ''} />
            </button>

            {/* Bouton Nouveau Sondage : Haute visibilité Orange */}
            {canCreate && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
              >
                <Plus size={16} className="text-white shrink-0" />
                <span className="text-white font-extrabold tracking-wide">Nouveau Sondage</span>
              </button>
            )}
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className={`p-3.5 rounded-xl flex items-center gap-3 shadow-md transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4 text-red-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        )}

        {/* KPIs Globaux - Compacts */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Vote size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sondages</p>
                <p className="text-lg font-black text-slate-900 font-poppins">{kpis.total_surveys || 0}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sondages Actifs</p>
                <p className="text-lg font-black text-slate-900 font-poppins">{kpis.active_surveys || 0}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Votes</p>
                <p className="text-lg font-black text-slate-900 font-poppins">{kpis.total_votes || 0}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moyenne / Sondage</p>
                <p className="text-lg font-black text-slate-900 font-poppins">{kpis.avg_participation || 0} votes</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres & Recherche Compacts */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
            >
              <option value="">Toutes les cibles</option>
              <option value="all">Tout le monde</option>
              <option value="candidate">Candidats uniquement</option>
              <option value="company">Entreprises uniquement</option>
              <option value="visitor">Visiteurs (Autre)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="active">En cours (Actifs)</option>
              <option value="closed">Clôturés</option>
            </select>
          </div>
        </div>

        {/* Tableau Dense & Compact des Sondages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto text-orange-500 mb-2" />
              <p className="text-xs font-medium">Chargement des sondages...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
              <Vote size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-800">Aucun sondage trouvé</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                Créez votre premier sondage interactif pour recueillir l'avis des utilisateurs.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
              >
                <Plus size={15} className="text-white" />
                <span>Créer un premier sondage</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Question & Intitulé</th>
                    <th className="py-2.5 px-3">Cible</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Créé le</th>
                    <th className="py-2.5 px-3">Total Votes</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {surveys.map((survey) => {
                    const date = new Date(survey.created_at);
                    const isActive = survey.status === 'active';

                    return (
                      <tr key={survey.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Question (Compact) */}
                        <td className="py-2 px-3.5 max-w-xs md:max-w-md">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1" title={survey.question}>
                            {survey.question}
                          </p>
                          {survey.description && (
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5" title={survey.description}>
                              {survey.description}
                            </p>
                          )}
                        </td>

                        {/* 2. Cible */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {getAudienceBadge(survey.target_audience)}
                        </td>

                        {/* 3. Mode */}
                        <td className="py-2 px-3 whitespace-nowrap text-[10px]">
                          {survey.is_multiple_choice ? (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                              Multiple
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              Unique
                            </span>
                          )}
                        </td>

                        {/* 4. Date */}
                        <td className="py-2 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          <span className="font-semibold text-slate-700">
                            {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* 5. Votes */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-slate-900 font-poppins">{survey.total_votes}</span>
                            <span className="text-[10px] text-slate-400">voix</span>
                          </div>
                        </td>

                        {/* 6. Statut */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} className="text-emerald-500" />
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle size={10} className="text-slate-400" />
                              Clôturé
                            </span>
                          )}
                        </td>

                        {/* 7. Actions (Icon Button Group) */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenAnalytics(survey)}
                              className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 transition cursor-pointer"
                              title="Analyser les résultats et graphiques"
                            >
                              <BarChart3 size={14} />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(survey)}
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Modifier"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}

                            {canEdit && (
                              <button
                                onClick={() => handleToggleStatus(survey)}
                                className={`p-1 rounded-md transition cursor-pointer ${isActive
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  }`}
                                title={isActive ? 'Clôturer le sondage' : 'Réactiver'}
                              >
                                {isActive ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                            )}

                            {/* Ouvre le modal de confirmation personnalisé (pas d'alerte JS) */}
                            {canDelete && (
                              <button
                                onClick={() => setSurveyToDelete(survey)}
                                className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 size={14} />
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

          {/* Pagination Riche & Complète */}
          {pagination && (
            <div className="p-3 bg-slate-50/75 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">

              {/* Info pagination */}
              <div className="flex items-center gap-3">
                <span>
                  Affichage de <strong className="text-slate-900">{((pagination.current_page - 1) * pagination.per_page) + (surveys.length > 0 ? 1 : 0)}</strong> à <strong className="text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</strong> sur <strong className="text-slate-900">{pagination.total}</strong> sondages
                </span>

                {/* Sélecteur de nombre de lignes par page */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Lignes :</span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Boutons de navigation */}
              {pagination.last_page > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => setPage(1)}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Première page"
                  >
                    <ChevronsLeft size={14} />
                  </button>

                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Page précédente"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1 mx-1">
                    {renderPaginationButtons()}
                  </div>

                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Page suivante"
                  >
                    <ChevronRight size={14} />
                  </button>

                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => setPage(pagination.last_page)}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Dernière page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── MODAL DE CONFIRMATION DE SUPPRESSION PERSONNALISÉ (PAS DE WINDOW.CONFIRM) ── */}
        {surveyToDelete && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleting) setSurveyToDelete(null);
            }}
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
              backdropFilter: 'blur(4px)',
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                maxWidth: '450px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0'
              }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={24} style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    Supprimer ce sondage ?
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
                    Êtes-vous sûr de vouloir supprimer définitivement le sondage :
                  </p>
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginTop: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}
                    className="line-clamp-2"
                  >
                    "{surveyToDelete.question}"
                  </div>
                  <p style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '600', marginTop: '8px' }}>
                    ⚠️ Cette action est irréversible et effacera tous les votes et statistiques associés.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setSurveyToDelete(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteSurvey}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)'
                  }}
                  className="hover:opacity-90 transition cursor-pointer"
                >
                  {deleting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-white" />
                      <span style={{ color: '#ffffff' }}>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} style={{ color: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Supprimer définitivement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL CRÉATION / ÉDITION DE SONDAGE ───────────────────────────── */}
        {showCreateModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false);
            }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
          >
            <div
              className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
              style={{ maxHeight: '88vh' }}
            >
              {/* Header FIXE */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                    <Vote size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-poppins">
                      {editingSurvey ? 'Modifier le Sondage' : 'Nouveau Sondage Public'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Définissez la question, le public ciblé et les options de vote.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps SCROLLABLE */}
              <form onSubmit={handleSubmitSurvey} id="survey-form" className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Question du sondage *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Ex: Quels sont les critères les plus importants pour choisir un stage ?"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Description ou contexte (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Votre réponse nous aidera à mieux vous proposer des opportunités adaptées."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Public Ciblé *
                    </label>
                    <select
                      value={formData.target_audience}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
                    >
                      <option value="all">🌟 Tout le monde (Tous)</option>
                      <option value="candidate">🎓 Candidats uniquement</option>
                      <option value="company">🏢 Entreprises uniquement</option>
                      <option value="visitor">👤 Visiteurs (Autre)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Durée d'expiration (Jours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.expires_in_days}
                      onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) || 7 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Autoriser le choix multiple</p>
                    <p className="text-[11px] text-slate-500">Permet aux votants de sélectionner plusieurs réponses.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_multiple_choice}
                    onChange={(e) => setFormData({ ...formData, is_multiple_choice: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 transition cursor-pointer"
                  />
                </div>

                {/* Options de réponse */}
                {!editingSurvey && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Options de réponse (2 minimum) :
                    </label>

                    {formData.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required={idx < 2}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx] = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = formData.options.filter((_, i) => i !== idx);
                              setFormData({ ...formData, options: newOpts });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    {formData.options.length < 8 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 pt-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        Ajouter une option supplémentaire
                      </button>
                    )}
                  </div>
                )}
              </form>

              {/* Footer FIXE */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  form="survey-form"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
                  style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="text-white" />
                      <span>{editingSurvey ? 'Enregistrer les modifications' : 'Publier le sondage'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL ANALYTICS & RÉSULTATS DÉTAILLÉS ─────────────────────────── */}
        {selectedAnalytics && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedAnalytics(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
          >
            <div
              className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
              style={{ maxHeight: '88vh' }}
            >
              {/* Header FIXE */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-poppins">
                      Analyse des Réponses & Statistiques
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedAnalytics.total_votes} votes enregistrés au total
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnalytics(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps SCROLLABLE */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">

                {/* Question */}
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Question posée</p>
                  <p className="text-base font-bold text-slate-900">{selectedAnalytics.question}</p>
                </div>

                {/* Répartition des votes par option */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Résultats par option :
                  </h4>
                  <div className="space-y-3">
                    {selectedAnalytics.options_breakdown?.map((opt, idx) => {
                      const pct = opt.percentage || 0;
                      return (
                        <div key={opt.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-black">
                                {idx + 1}
                              </span>
                              {opt.text}
                            </span>
                            <span className="text-orange-600 font-poppins">{opt.votes_count} votes ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Répartition par type de compte */}
                {selectedAnalytics.votes_by_role && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Profils des votants :
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                        <Users size={18} className="mx-auto text-blue-600 mb-1" />
                        <p className="text-lg font-black text-slate-900 font-poppins">{selectedAnalytics.votes_by_role.candidate || 0}</p>
                        <p className="text-[11px] font-semibold text-slate-500">Candidats</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                        <Building2 size={18} className="mx-auto text-purple-600 mb-1" />
                        <p className="text-lg font-black text-slate-900 font-poppins">{selectedAnalytics.votes_by_role.company || 0}</p>
                        <p className="text-[11px] font-semibold text-slate-500">Entreprises</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                        <UserCheck size={18} className="mx-auto text-amber-600 mb-1" />
                        <p className="text-lg font-black text-slate-900 font-poppins">{selectedAnalytics.votes_by_role.visitor || 0}</p>
                        <p className="text-[11px] font-semibold text-slate-500">Visiteurs</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                        <HelpCircle size={18} className="mx-auto text-slate-500 mb-1" />
                        <p className="text-lg font-black text-slate-900 font-poppins">{selectedAnalytics.votes_by_role.anonymous || 0}</p>
                        <p className="text-[11px] font-semibold text-slate-500">Anonymes</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer FIXE */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setSelectedAnalytics(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default SurveysManagementPage;
