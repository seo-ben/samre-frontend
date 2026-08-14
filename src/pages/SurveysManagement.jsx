import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Share2,
  X,
  Check
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const SurveysManagementPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
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

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(targetFilter && { target_audience: targetFilter })
      };

      const response = await apiClient.get('/admin/surveys', { params });
      if (response.data.status === 'success') {
        setSurveys(response.data.data || []);
        setPagination(response.data.meta);
        setKpis(response.data.kpis);
      }
    } catch (err) {
      console.error('Erreur chargement sondages:', err);
      showToast('Impossible de charger les sondages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [page, statusFilter, targetFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSurveys();
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
      title: survey.title || '',
      question: survey.question,
      description: survey.description || '',
      category: survey.category || 'SONDAGE',
      target_audience: survey.target_audience,
      is_multiple_choice: survey.is_multiple_choice,
      expires_in_days: survey.expires_in_days || 7,
      options: survey.options ? survey.options.map(o => o.text) : ['', '']
    });
    setShowCreateModal(true);
  };

  // Ouvrir modal Analytics
  const handleOpenAnalytics = async (survey) => {
    setSelectedAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const res = await apiClient.get(`/admin/surveys/${survey.id}/analytics`);
      if (res.data.status === 'success') {
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
        await apiClient.put(`/admin/surveys/${editingSurvey.id}`, {
          question: formData.question,
          description: formData.description,
          target_audience: formData.target_audience,
          is_multiple_choice: formData.is_multiple_choice,
          expires_in_days: formData.expires_in_days
        });
        showToast('Sondage mis à jour avec succès !');
      } else {
        await apiClient.post('/admin/surveys', {
          ...formData,
          options: filteredOptions
        });
        showToast('Sondage créé et publié avec succès !');
      }
      setShowCreateModal(false);
      fetchSurveys();
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
      await apiClient.patch(`/admin/surveys/${survey.id}/status`);
      showToast(`Le sondage a été ${survey.status === 'active' ? 'clôturé' : 'réactivé'}.`);
      fetchSurveys();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      showToast('Action impossible.', 'error');
    }
  };

  // Supprimer sondage
  const handleDeleteSurvey = async (survey) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ce sondage ?\n"${survey.question}"`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/surveys/${survey.id}`);
      showToast('Sondage supprimé avec succès.');
      fetchSurveys();
    } catch (err) {
      console.error('Erreur suppression:', err);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const getAudienceBadge = (aud) => {
    switch (aud) {
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Users size={12} />
            Candidats
          </span>
        );
      case 'company':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 size={12} />
            Entreprises
          </span>
        );
      case 'visitor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck size={12} />
            Visiteurs (Autre)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles size={12} />
            Tout le monde
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header Title & Bouton Nouveau */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-poppins flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-orange-500/10 text-orange-600">
                <Vote size={26} />
              </div>
              Sondages & Enquêtes Publiques
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pilotez, ciblez et analysez les sondages interactifs auprès des candidats, entreprises et visiteurs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchSurveys}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
              title="Actualiser les données"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition cursor-pointer"
            >
              <Plus size={18} />
              Nouveau Sondage
            </button>
          </div>
        </div>

        {/* KPIs Globaux */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Vote size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sondages</p>
                <p className="text-2xl font-black text-slate-900 font-poppins mt-0.5">{kpis.total_surveys || 0}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sondages Actifs</p>
                <p className="text-2xl font-black text-slate-900 font-poppins mt-0.5">{kpis.active_surveys || 0}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Votes</p>
                <p className="text-2xl font-black text-slate-900 font-poppins mt-0.5">{kpis.total_votes || 0}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Moyenne / Sondage</p>
                <p className="text-2xl font-black text-slate-900 font-poppins mt-0.5">{kpis.avg_participation || 0} votes</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres & Recherche */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="active">En cours (Actifs)</option>
              <option value="closed">Clôturés</option>
            </select>
          </div>
        </div>

        {/* Tableau des sondages (Trié du plus récent au plus ancien) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto text-orange-500 mb-3" />
              <p className="text-sm font-medium">Chargement des sondages...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Vote size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Aucun sondage trouvé</p>
              <p className="text-xs text-slate-400 mt-1">Créez votre premier sondage ou ajustez les filtres de recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Question & Intitulé</th>
                    <th className="py-3.5 px-4">Cible</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Créé le</th>
                    <th className="py-3.5 px-4">Total Votes</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {surveys.map((survey) => {
                    const date = new Date(survey.created_at);
                    const isActive = survey.status === 'active';

                    return (
                      <tr key={survey.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 max-w-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-900 line-clamp-2">
                              {survey.question}
                            </p>
                            {survey.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {survey.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getAudienceBadge(survey.target_audience)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          {survey.is_multiple_choice ? (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                              Choix multiple
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                              Choix unique
                            </span>
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 font-poppins">{survey.total_votes}</span>
                            <span className="text-xs text-slate-400 font-semibold">voix</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle size={12} className="text-slate-400" />
                              Clôturé
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAnalytics(survey)}
                              className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition"
                              title="Analyser les résultats et graphiques"
                            >
                              <BarChart3 size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(survey)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Modifier"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(survey)}
                              className={`p-1.5 rounded-lg transition ${
                                isActive 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'Clôturer le sondage' : 'Réactiver'}
                            >
                              {isActive ? <Clock size={15} /> : <CheckCircle2 size={15} />}
                            </button>

                            <button
                              onClick={() => handleDeleteSurvey(survey)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
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
          {pagination && pagination.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold">{pagination.current_page}</span> sur <span className="font-bold">{pagination.last_page}</span> ({pagination.total} sondages)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  Précédent
                </button>
                <button
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── MODAL CRÉATION / ÉDITION DE SONDAGE ───────────────────────────── */}
        {showCreateModal && (
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
                maxWidth: '680px',
                maxHeight: 'calc(100vh - 40px)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                margin: 'auto'
              }}
            >
              {/* Header FIXE */}
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
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps SCROLLABLE */}
              <form onSubmit={handleSubmitSurvey} id="survey-form" style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0 }} className="space-y-4">
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
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
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
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  form="survey-form"
                  disabled={submitting}
                  style={{
                    padding: '11px 22px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
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
                      {editingSurvey ? 'Enregistrer les modifications' : 'Publier le sondage'}
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
              {/* Header FIXE */}
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
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps SCROLLABLE */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0 }} className="space-y-6">
                
                {/* Question */}
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
                    Question posée :
                  </p>
                  <p className="text-base font-black text-slate-900 font-poppins leading-snug">
                    {selectedAnalytics.question}
                  </p>
                </div>

                {/* Graphique de répartition des options */}
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Répartition des voix par option :
                  </p>

                  <div className="space-y-3">
                    {selectedAnalytics.options_breakdown && selectedAnalytics.options_breakdown.map((opt, i) => {
                      return (
                        <div key={opt.id || i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{opt.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-500">{opt.votes_count} vote(s)</span>
                              <span className="font-black text-orange-600 text-sm">{opt.percentage}%</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-orange-500 transition-all duration-500"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>

                          {/* Réponses personnalisées / commentaires sur l'option */}
                          {opt.custom_answers && opt.custom_answers.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                              <p className="text-[11px] font-bold text-orange-700 mb-1.5 flex items-center gap-1">
                                💬 Précisions saisies par les utilisateurs ({opt.custom_answers.length}) :
                              </p>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {opt.custom_answers.map((ans, aIdx) => (
                                  <div key={aIdx} className="p-2 bg-white rounded-lg border border-orange-200/80 text-xs text-slate-800 shadow-xs font-medium">
                                    « {ans} »
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Répartition de l'audience votante */}
                {selectedAnalytics.votes_by_role && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Users size={14} />
                      Profil des Votants :
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[11px] font-bold text-slate-400 block">Candidats</span>
                        <span className="text-base font-black text-blue-600">{selectedAnalytics.votes_by_role.candidate || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[11px] font-bold text-slate-400 block">Entreprises</span>
                        <span className="text-base font-black text-purple-600">{selectedAnalytics.votes_by_role.company || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[11px] font-bold text-slate-400 block">Visiteurs</span>
                        <span className="text-base font-black text-amber-600">{selectedAnalytics.votes_by_role.visitor || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[11px] font-bold text-slate-400 block">Invités (IP)</span>
                        <span className="text-base font-black text-slate-600">{selectedAnalytics.votes_by_role.anonymous || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer FIXE */}
              <div 
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedAnalytics(null)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast de notification 100% opaque */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 999999,
              backgroundColor: toast.type === 'error' ? '#dc2626' : '#16a34a',
              color: '#ffffff',
              padding: '14px 20px',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SurveysManagementPage;
