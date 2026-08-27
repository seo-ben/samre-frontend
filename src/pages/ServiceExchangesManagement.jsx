import React, { useState, useEffect, useCallback } from 'react';
import { 
  Handshake, Building2, MessageSquare, Search, RefreshCw, 
  CheckCircle2, XCircle, Clock, Trash2, Eye, ExternalLink, 
  Filter, Shield, ArrowRight, Send, User, Calendar, MapPin, 
  Phone, Layers, Check, AlertTriangle, MessageCircle, FileText, ChevronRight
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';
import { useRealtime } from '../contexts/RealtimeContext';

export const ServiceExchangesManagement = () => {
  const { syncCounter, refreshNow } = useRealtime();

  // Tab: 'exchanges' or 'conversations'
  const [activeTab, setActiveTab] = useState('exchanges');

  // Exchanges list state
  const [exchanges, setExchanges] = useState([]);
  const [stats, setStats] = useState({
    total_exchanges: 0,
    b2b_exchanges: 0,
    student_exchanges: 0,
    total_conversations: 0,
    active_deals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Selected Exchange Modal (Détails de l'offre)
  const [selectedExchange, setSelectedExchange] = useState(null);

  // Modal des discussions spécifiques à un partenariat
  const [exchangeChatModal, setExchangeChatModal] = useState(null);
  const [exchangeConversations, setExchangeConversations] = useState([]);
  const [selectedExchangeConv, setSelectedExchangeConv] = useState(null);
  const [loadingExchangeChat, setLoadingExchangeChat] = useState(false);

  // Supervision globale Conversations state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch exchanges list
  const fetchExchanges = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page);

      const res = await apiClient.get(`/v1/admin/service-exchanges?${params.toString()}`);
      if (res.data?.success) {
        setExchanges(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.meta) setPagination(res.data.meta);
      }
    } catch (err) {
      console.error('Error fetching partnerships:', err);
      if (!isSilent) {
        showToast('Erreur lors du chargement des annonces de partenariat.', 'error');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [typeFilter, categoryFilter, statusFilter, search, page]);

  // Fetch conversations for supervision globale
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingConversations(true);
    try {
      const res = await apiClient.get('/v1/admin/service-exchanges/conversations');
      if (res.data?.success) {
        const list = res.data.data || [];
        setConversations(list);
        if (list.length > 0 && !selectedConversation) {
          setSelectedConversation(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!isSilent) setLoadingConversations(false);
    }
  }, [selectedConversation]);

  // Ouvrir les discussions complètes d'un partenariat spécifique
  const handleOpenExchangeDiscussions = async (item) => {
    setExchangeChatModal(item);
    setLoadingExchangeChat(true);
    setExchangeConversations([]);
    setSelectedExchangeConv(null);

    try {
      const res = await apiClient.get(`/v1/admin/service-exchanges/conversations?exchange_id=${item.id}`);
      if (res.data?.success) {
        const list = res.data.data || [];
        setExchangeConversations(list);
        if (list.length > 0) {
          setSelectedExchangeConv(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching exchange conversations:', err);
      showToast('Impossible de charger les discussions pour ce partenariat.', 'error');
    } finally {
      setLoadingExchangeChat(false);
    }
  };

  // Initialisation et rechargement lors des changements de filtres / page
  useEffect(() => {
    fetchExchanges(false);
  }, [fetchExchanges]);

  // Synchronisation en arrière-plan sans clignotement
  useEffect(() => {
    if (syncCounter > 0) {
      fetchExchanges(true);
      if (activeTab === 'conversations') {
        fetchConversations(true);
      }
      // Actualiser le chat en cours si modal ouvert
      if (exchangeChatModal) {
        apiClient.get(`/v1/admin/service-exchanges/conversations?exchange_id=${exchangeChatModal.id}`)
          .then(res => {
            if (res.data?.success) {
              const list = res.data.data || [];
              setExchangeConversations(list);
              if (selectedExchangeConv) {
                const updated = list.find(c => c.id === selectedExchangeConv.id);
                if (updated) setSelectedExchangeConv(updated);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [syncCounter, activeTab, fetchExchanges, fetchConversations, exchangeChatModal, selectedExchangeConv]);

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations(false);
    }
  }, [activeTab, fetchConversations]);

  // Delete / Moderate an exchange
  const handleDeleteExchange = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette offre de partenariat ?')) return;
    try {
      await apiClient.delete(`/v1/admin/service-exchanges/${id}`);
      showToast('Offre de partenariat supprimée avec succès.');
      setSelectedExchange(null);
      if (exchangeChatModal?.id === id) setExchangeChatModal(null);
      fetchExchanges();
      refreshNow();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  // Update exchange status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient.put(`/v1/admin/service-exchanges/${id}/status`, { status: newStatus });
      showToast(`Statut mis à jour : ${newStatus}`);
      fetchExchanges();
    } catch (err) {
      showToast('Erreur lors du changement de statut.', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Handshake className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Partenariats B2B & Inter-Entreprises
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les opportunités de partenariats de services et supervisez l'intégralité des discussions et négociations inter-entreprises en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchExchanges();
                if (activeTab === 'conversations') fetchConversations();
              }}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className={`p-4 rounded-xl flex items-center gap-3 shadow-md transition-all ${
            toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Partenariats</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_exchanges}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">{stats.b2b_exchanges} Partenariats B2B Entreprises</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discussions & Négociations</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_conversations}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Supervisées par l'Admin</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partenariats Actifs en Ligne</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.active_deals}</h3>
              <p className="text-xs text-slate-400 mt-1">Disponibles à la collaboration</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entraide & Compétences</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.student_exchanges}</h3>
              <p className="text-xs text-slate-400 mt-1">Étudiants & Soutien</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
          <button
            onClick={() => setActiveTab('exchanges')}
            className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'exchanges'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Handshake className="w-4 h-4" />
            Toutes les Annonces de Partenariat ({exchanges.length})
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'conversations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Supervision Globale des Discussions ({conversations.length})
          </button>
        </div>

        {/* TAB 1 : PARTNERSHIPS LIST */}
        {activeTab === 'exchanges' && (
          <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm">
            {/* Filters bar */}
            <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une entreprise, un partenariat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types (B2B & Étudiants)</option>
                <option value="b2b">🏢 Partenariats B2B Entreprises</option>
                <option value="student">🎓 Entraide Étudiants</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les catégories</option>
                <option value="tech">💻 Tech & Digital</option>
                <option value="finance">⚖️ Juridique & Finance</option>
                <option value="marketing">📢 Marketing & Com</option>
                <option value="logistics">🚚 Logistique & Locaux</option>
                <option value="equipment">🔧 Matériel & Équipement</option>
                <option value="hr">👥 RH & Formation</option>
                <option value="tutoring">📚 Soutien Scolaire</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">🟢 Actif</option>
                <option value="in_discussion">🟡 En discussion</option>
                <option value="completed">🔵 Conclu / Terminé</option>
                <option value="cancelled">🔴 Annulé</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Entreprise / Auteur</th>
                    <th className="px-5 py-3.5">Titre de l'échange</th>
                    <th className="px-5 py-3.5">Discussions</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Chargement des offres de partenariat...
                      </td>
                    </tr>
                  ) : exchanges.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400">
                        Aucune opportunité de partenariat trouvée avec ces critères.
                      </td>
                    </tr>
                  ) : (
                    exchanges.map((item) => {
                      const isB2B = item.type === 'b2b';
                      const authorName = item.company_profile?.company_name || item.user?.name || item.user?.first_name || 'Utilisateur';
                      const convCount = item.proposals_count || item.conversations?.length || 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                          {/* 1. Entreprise / Auteur */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isB2B ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isB2B ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{authorName}</p>
                                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                                  isB2B ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {isB2B ? 'PARTENARIAT B2B' : 'ENTRAIDE'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Titre de l'échange / Partenariat */}
                          <td className="px-5 py-4 max-w-md">
                            <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                            
                            {/* Aperçu offre vs besoin */}
                            <div className="mt-1.5 space-y-1">
                              <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/50 line-clamp-1">
                                <span className="font-bold text-emerald-900">Offre : </span>
                                {item.offer}
                              </div>
                              <div className="text-[11px] text-blue-800 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/50 line-clamp-1">
                                <span className="font-bold text-blue-900">Besoin : </span>
                                {item.need}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                              <MapPin className="w-3 h-3" />
                              <span>{item.city || 'Guinée'}</span>
                              <span>•</span>
                              <span>{item.location_type === 'physical' ? 'Présentiel' : item.location_type === 'hybrid' ? 'Mixte' : 'En ligne'}</span>
                            </div>
                          </td>

                          {/* 3. Discussions (Cliquable pour ouvrir directement les discussions complètes) */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleOpenExchangeDiscussions(item)}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                convCount > 0
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Voir l'intégralité des discussions faites autour de ce partenariat"
                            >
                              <MessageSquare className={`w-3.5 h-3.5 ${convCount > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span>{convCount} discussion{convCount > 1 ? 's' : ''}</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
                            </button>
                          </td>

                          {/* 4. Statut */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'in_discussion' ? 'bg-amber-100 text-amber-800' :
                              item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {item.status === 'active' ? '🟢 Actif' :
                               item.status === 'in_discussion' ? '🟡 En cours' :
                               item.status === 'completed' ? '🔵 Conclu' : 'Annulé'}
                            </span>
                          </td>

                          {/* 5. Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenExchangeDiscussions(item)}
                                className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 border border-blue-200 transition-colors"
                                title="Voir les discussions complètes"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Discussions</span>
                              </button>
                              <button
                                onClick={() => setSelectedExchange(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Voir la fiche détaillée"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExchange(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer / Modérer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2 : SUPERVISION GLOBALE DES DISCUSSIONS INTER-ENTREPRISES */}
        {activeTab === 'conversations' && (
          <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
              
              {/* Left sidebar: Conversations list */}
              <div className="lg:col-span-4 border-r border-slate-200 p-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par entreprise..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[520px]">
                  {loadingConversations ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Chargement des conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Aucune discussion enregistrée.
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isSelected = selectedConversation?.id === conv.id;
                      const creatorName = conv.creator_user?.company_profile?.company_name || conv.creator_user?.name || 'Entreprise A';
                      const recipientName = conv.recipient_user?.company_profile?.company_name || conv.recipient_user?.name || 'Entreprise B';
                      const exchangeTitle = conv.service_exchange?.title || 'Offre de partenariat';

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-slate-900 text-xs truncate max-w-[120px]">{creatorName}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-900 text-xs truncate max-w-[120px]">{recipientName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {conv.messages?.length || 0} msg
                            </span>
                          </div>

                          <p className="text-xs font-medium text-slate-700 mt-2 truncate">
                            🏷️ {exchangeTitle}
                          </p>

                          {conv.latest_message && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                              "{conv.latest_message.message}"
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right panel: Full Chat Thread Viewer for Admin */}
              <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-slate-50/50">
                {selectedConversation ? (
                  <>
                    {/* Header */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {selectedConversation.creator_user?.company_profile?.company_name || selectedConversation.creator_user?.name}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">↔</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {selectedConversation.recipient_user?.company_profile?.company_name || selectedConversation.recipient_user?.name}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">
                          Partenariat : {selectedConversation.service_exchange?.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                          Supervision Admin Active
                        </span>
                      </div>
                    </div>

                    {/* Messages bubbles */}
                    <div className="space-y-3 overflow-y-auto flex-1 p-2 max-h-[420px]">
                      {(!selectedConversation.messages || selectedConversation.messages.length === 0) ? (
                        <p className="text-center text-slate-400 text-sm py-12">Aucun message dans cette conversation.</p>
                      ) : (
                        selectedConversation.messages.map((msg) => {
                          const isCreator = msg.sender_id === selectedConversation.creator_user_id;
                          const senderName = msg.sender?.name || msg.sender?.first_name || (isCreator ? 'Initiateur' : 'Destinataire');

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isCreator ? 'items-start' : 'items-end'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[11px] font-bold text-slate-600">{senderName}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`p-3.5 rounded-2xl max-w-lg text-sm shadow-sm ${
                                isCreator
                                  ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                  : 'bg-blue-600 text-white rounded-tr-sm'
                              }`}>
                                <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Admin notice */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mt-4 flex items-center gap-2 text-xs text-blue-800">
                      <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        En tant qu'administrateur, vous avez accès à l'intégralité des discussions pour assurer la qualité des collaborations et prévenir les litiges inter-entreprises.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-semibold text-sm">Sélectionnez une discussion à gauche pour afficher tous les messages.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* MODAL : DISCUSSIONS COMPLÈTES AUTOUR D'UN PARTENARIAT SPÉCIFIQUE */}
        {exchangeChatModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-blue-300" />
                    <h3 className="font-bold text-lg text-white">Discussions du Partenariat</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/20 text-white">
                      {exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1 font-medium line-clamp-1">
                    Opportunité : <strong className="text-white">{exchangeChatModal.title}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setExchangeChatModal(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Offer & Need Reminder Banner */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-200/80">
                  <span className="font-bold block mb-0.5">🟢 Offre proposée :</span>
                  <p className="line-clamp-2">{exchangeChatModal.offer}</p>
                </div>
                <div className="bg-blue-50 text-blue-900 p-2.5 rounded-lg border border-blue-200/80">
                  <span className="font-bold block mb-0.5">🔵 Recherche en contrepartie :</span>
                  <p className="line-clamp-2">{exchangeChatModal.need}</p>
                </div>
              </div>

              {/* Content Body: Conversations split */}
              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-[420px]">
                
                {/* Left: Companies that engaged discussion on this deal */}
                <div className="md:col-span-4 border-r border-slate-200 p-4 overflow-y-auto bg-slate-50/50 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Entreprises candidates ({exchangeConversations.length})
                  </h4>

                  {loadingExchangeChat ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Chargement des discussions...
                    </div>
                  ) : exchangeConversations.length === 0 ? (
                    <div className="text-center py-12 px-4 text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucune entreprise n'a encore formulé de proposition sur cette offre.
                    </div>
                  ) : (
                    exchangeConversations.map((conv) => {
                      const isSelected = selectedExchangeConv?.id === conv.id;
                      const partnerName = conv.creator_user?.company_profile?.company_name || conv.creator_user?.name || 'Entreprise Partenaire';
                      
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedExchangeConv(conv)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs truncate">{partnerName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {conv.messages?.length || 0} msg
                            </span>
                          </div>
                          {conv.latest_message && (
                            <p className={`text-[11px] mt-1.5 line-clamp-1 italic ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}>
                              "{conv.latest_message.message}"
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right: Messages Thread */}
                <div className="md:col-span-8 p-4 flex flex-col justify-between overflow-y-auto bg-white">
                  {selectedExchangeConv ? (
                    <>
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-900 text-sm">
                            Discussion avec {selectedExchangeConv.creator_user?.company_profile?.company_name || selectedExchangeConv.creator_user?.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Total : {selectedExchangeConv.messages?.length || 0} message(s)
                        </span>
                      </div>

                      {/* Chat Messages */}
                      <div className="space-y-3 overflow-y-auto flex-1 p-2 max-h-[360px]">
                        {(!selectedExchangeConv.messages || selectedExchangeConv.messages.length === 0) ? (
                          <p className="text-center text-slate-400 text-xs py-10">Aucun message pour cette discussion.</p>
                        ) : (
                          selectedExchangeConv.messages.map((msg) => {
                            const isCreator = msg.sender_id === selectedExchangeConv.creator_user_id;
                            const senderName = msg.sender?.company_profile?.company_name || msg.sender?.name || (isCreator ? 'Candidat' : 'Auteur du partenariat');

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isCreator ? 'items-start' : 'items-end'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                  <span className="text-[11px] font-bold text-slate-600">{senderName}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                                  isCreator
                                    ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                    : 'bg-blue-600 text-white rounded-tr-sm'
                                }`}>
                                  <p className="whitespace-pre-line">{msg.message}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl mt-3 flex items-center gap-2 text-[11px] text-blue-800">
                        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Supervision administrateur active en lecture intégrale.</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
                      <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Sélectionnez une discussion à gauche pour afficher les messages.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setExchangeChatModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-sm"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DETAILS MODAL : FICHE DE PARTENARIAT */}
        {selectedExchange && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Fiche de Partenariat B2B</h3>
                </div>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedExchange.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publié par : <span className="font-semibold text-slate-800">{selectedExchange.company_profile?.company_name || selectedExchange.user?.name}</span>
                </p>
              </div>

              {/* 🟢 Offer */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ce que cette entreprise PROPOSE :
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">{selectedExchange.offer}</p>
              </div>

              {/* 🔵 Need */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  <Handshake className="w-4 h-4 text-blue-600" />
                  Ce qu'elle RECHERCHE en partenariat :
                </p>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">{selectedExchange.need}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2">
                <div><strong>Ville :</strong> {selectedExchange.city || 'Non renseigné'}</div>
                <div><strong>Modalité :</strong> {selectedExchange.location_type}</div>
                <div><strong>Contact :</strong> {selectedExchange.contact_phone || 'Non renseigné'}</div>
                <div><strong>Discussions :</strong> {selectedExchange.proposals_count || 0}</div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    const ex = selectedExchange;
                    setSelectedExchange(null);
                    handleOpenExchangeDiscussions(ex);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Voir les discussions ({selectedExchange.proposals_count || 0})
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteExchange(selectedExchange.id)}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                  <button
                    onClick={() => setSelectedExchange(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default ServiceExchangesManagement;
