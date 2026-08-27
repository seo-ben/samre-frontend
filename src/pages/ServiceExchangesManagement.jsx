import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Handshake, Building2, MessageSquare, Search, RefreshCw, 
  CheckCircle2, XCircle, Clock, Trash2, Eye, ExternalLink, 
  Filter, Shield, ArrowRight, Send, User, Calendar, MapPin, 
  Phone, Layers, Check, AlertTriangle, MessageCircle, FileText, 
  ChevronRight, CheckCheck, Paperclip, Image as ImageIcon, Download, X
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';
import { useRealtime } from '../contexts/RealtimeContext';

// Helper pour grouper les messages par date façon WhatsApp
const formatMessageDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  } else {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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

  // Modal des discussions spécifiques à un partenariat (WhatsApp style)
  const [exchangeChatModal, setExchangeChatModal] = useState(null);
  const [exchangeConversations, setExchangeConversations] = useState([]);
  const [selectedExchangeConv, setSelectedExchangeConv] = useState(null);
  const [loadingExchangeChat, setLoadingExchangeChat] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Supervision globale Conversations state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // Scroll to bottom refs
  const chatBottomRef = useRef(null);
  const modalChatBottomRef = useRef(null);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fermeture des modales avec la touche Echap (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExchangeChatModal(null);
        setSelectedExchange(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll automatique en bas de discussion
  useEffect(() => {
    if (modalChatBottomRef.current) {
      modalChatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedExchangeConv, exchangeConversations]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation, conversations]);

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
    setModalSearch('');

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

  // Filtrer les candidats dans le modal
  const filteredModalConversations = exchangeConversations.filter(c => {
    if (!modalSearch.trim()) return true;
    const name = c.creator_user?.company_profile?.company_name || c.creator_user?.name || '';
    return name.toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
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
              <p className="text-xs text-emerald-600 font-medium mt-1">{stats.b2b_exchanges} Partenariats B2B Entreprises</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discussions & Négociations</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_conversations}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">Supervisées par l'Admin</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
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
                ? 'border-emerald-600 text-emerald-700'
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
                ? 'border-emerald-600 text-emerald-700'
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
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tous les types (B2B & Étudiants)</option>
                <option value="b2b">🏢 Partenariats B2B Entreprises</option>
                <option value="student">🎓 Entraide Étudiants</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
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
                                isB2B ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isB2B ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{authorName}</p>
                                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                                  isB2B ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-blue-50 text-blue-600 border border-blue-200/60'
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
                              <div className="text-[11px] text-emerald-900 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200/60 line-clamp-1">
                                <span className="font-bold text-emerald-950">Offre : </span>
                                {item.offer}
                              </div>
                              <div className="text-[11px] text-blue-900 bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200/60 line-clamp-1">
                                <span className="font-bold text-blue-950">Besoin : </span>
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
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Voir l'intégralité des discussions WhatsApp faites autour de ce partenariat"
                            >
                              <MessageSquare className={`w-3.5 h-3.5 ${convCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
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
                                className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 border border-emerald-200 transition-colors"
                                title="Voir les discussions complètes (WhatsApp)"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
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

        {/* TAB 2 : SUPERVISION GLOBALE DES DISCUSSIONS (WHATSAPP WEB STYLE) */}
        {activeTab === 'conversations' && (
          <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 h-[680px] min-h-[500px]">
              
              {/* Left sidebar: Conversations list */}
              <div className="lg:col-span-4 border-r border-slate-200 flex flex-col min-h-0 h-full bg-white">
                <div className="shrink-0 p-3 border-b border-slate-100 bg-slate-50/75">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une discussion..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                      Chargement des conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      Aucune discussion enregistrée.
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isSelected = selectedConversation?.id === conv.id;
                      const creatorName = conv.creator_user?.company_profile?.company_name || conv.creator_user?.name || 'Candidat';
                      const recipientName = conv.recipient_user?.company_profile?.company_name || conv.recipient_user?.name || 'Annonceur';
                      const exchangeTitle = conv.service_exchange?.title || 'Partenariat';
                      const lastMsg = conv.latest_message;
                      const lastTime = lastMsg ? formatMessageTime(lastMsg.created_at) : '';

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-[#f0f2f5] border-l-4 border-emerald-600'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                            {creatorName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-900 text-xs truncate">
                                {creatorName} ↔ {recipientName}
                              </span>
                              {lastTime && (
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                  {lastTime}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                              🏷️ {exchangeTitle}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-slate-500 line-clamp-1 italic">
                                {lastMsg ? lastMsg.message : 'Aucun message'}
                              </p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold shrink-0 ml-1">
                                {conv.messages?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right panel: Full WhatsApp Thread Viewer */}
              <div className="lg:col-span-8 flex flex-col min-h-0 h-full justify-between" style={{
                backgroundColor: '#efeae2',
                backgroundImage: 'radial-gradient(#d1d7db 0.85px, transparent 0.85px)',
                backgroundSize: '18px 18px',
              }}>
                {selectedConversation ? (
                  <>
                    {/* WhatsApp Top Header */}
                    <div className="shrink-0 p-3.5 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {(selectedConversation.creator_user?.company_profile?.company_name || selectedConversation.creator_user?.name || 'C').charAt(0).toUpperCase()}
                        </div>
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
                          <p className="text-xs text-emerald-700 font-medium mt-0.5">
                            Partenariat : <span className="text-slate-800">{selectedConversation.service_exchange?.title}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Supervision Active
                        </span>
                      </div>
                    </div>

                    {/* Messages bubbles (WhatsApp Left / Right) */}
                    <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4">
                      {(!selectedConversation.messages || selectedConversation.messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                          <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-xs font-medium">Aucun message échangé dans cette discussion.</p>
                        </div>
                      ) : (
                        selectedConversation.messages.map((msg, index) => {
                          const isCreator = msg.sender_id === selectedConversation.creator_user_id;
                          const creatorName = selectedConversation.creator_user?.company_profile?.company_name || selectedConversation.creator_user?.name || 'Candidat';
                          const recipientName = selectedConversation.recipient_user?.company_profile?.company_name || selectedConversation.recipient_user?.name || 'Annonceur';
                          const senderDisplayName = isCreator ? creatorName : recipientName;

                          // Groupement de date
                          const showDate = index === 0 || formatMessageDate(msg.created_at) !== formatMessageDate(selectedConversation.messages[index - 1].created_at);

                          return (
                            <React.Fragment key={msg.id}>
                              {showDate && (
                                <div className="flex justify-center my-3 sticky top-1 z-10">
                                  <span className="bg-white/90 backdrop-blur text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm border border-slate-200/80">
                                    {formatMessageDate(msg.created_at)}
                                  </span>
                                </div>
                              )}

                              <div className={`flex ${isCreator ? 'justify-start' : 'justify-end'} mb-2`}>
                                <div className={`relative max-w-[78%] px-4 py-2.5 shadow-sm ${
                                  isCreator
                                    ? 'bg-white text-slate-900 rounded-2xl rounded-tl-none border border-slate-200/70'
                                    : 'bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-none border border-[#bbf7d0]'
                                }`}>
                                  {/* Sender Label */}
                                  <div className={`text-[11px] font-bold mb-1 ${
                                    isCreator ? 'text-blue-700' : 'text-emerald-800'
                                  }`}>
                                    {senderDisplayName}
                                  </div>

                                  {/* Attachment if present */}
                                  {msg.attachment_url && (
                                    <div className="mb-2">
                                      {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                          <img 
                                            src={msg.attachment_url} 
                                            alt={msg.attachment_name || 'Pièce jointe'} 
                                            className="rounded-lg max-h-48 w-full object-cover border border-black/10 hover:opacity-95"
                                          />
                                        </a>
                                      ) : (
                                        <a 
                                          href={msg.attachment_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 bg-black/5 hover:bg-black/10 rounded-lg border border-black/5 transition-colors"
                                        >
                                          <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-800 truncate">{msg.attachment_name || 'Document joint'}</p>
                                            <span className="text-[10px] text-slate-500">Télécharger</span>
                                          </div>
                                          <Download className="w-4 h-4 text-slate-500" />
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {/* Message Text */}
                                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap select-text">
                                    {msg.message}
                                  </p>

                                  {/* Bottom Timestamp & Checks */}
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {formatMessageTime(msg.created_at)}
                                    </span>
                                    {!isCreator && (
                                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* WhatsApp Bottom Bar (Supervision notice) */}
                    <div className="shrink-0 p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-inner">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Mode supervision administrateur (Lecture seule des messages en direct)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {selectedConversation.messages?.length || 0} messages échangés
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

        {/* MODAL : DISCUSSIONS COMPLÈTES STYLE VRAI CHAT WHATSAPP (GAUCHE / DROITE) */}
        {exchangeChatModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setExchangeChatModal(null);
            }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          >
            <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] max-h-[88vh] min-h-[500px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* WhatsApp Modal Header (Always pinned at top with shrink-0) */}
              <div className="shrink-0 p-4 bg-emerald-800 text-white flex items-center justify-between shadow-md select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {(exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">
                        Discussions WhatsApp du Partenariat
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/20 text-white">
                        Annonceur : {exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100 mt-0.5 line-clamp-1 font-medium">
                      Offre : <strong className="text-white">{exchangeChatModal.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExchangeChatModal(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition-all shadow-sm"
                    title="Fermer la fenêtre (ou appuyez sur Échap)"
                  >
                    <X className="w-4 h-4" />
                    <span>Fermer</span>
                  </button>
                </div>
              </div>

              {/* Offer & Need Compact Banner (shrink-0) */}
              <div className="shrink-0 bg-emerald-50/90 border-b border-emerald-200/80 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60 flex items-start gap-2">
                  <span className="font-bold text-emerald-950 shrink-0">🟢 Offre :</span>
                  <span className="text-emerald-900 line-clamp-1">{exchangeChatModal.offer}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-200/60 flex items-start gap-2">
                  <span className="font-bold text-blue-950 shrink-0">🔵 Besoin :</span>
                  <span className="text-blue-900 line-clamp-1">{exchangeChatModal.need}</span>
                </div>
              </div>

              {/* Content Body: WhatsApp Split View with Strict Heights */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                
                {/* Left: Candidates List (WhatsApp Chat List Style) */}
                <div className="md:col-span-4 border-r border-slate-200 flex flex-col min-h-0 h-full bg-white">
                  <div className="shrink-0 p-3 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrer les candidats..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
                    {loadingExchangeChat ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Chargement des discussions...
                      </div>
                    ) : filteredModalConversations.length === 0 ? (
                      <div className="text-center py-12 px-4 text-slate-400 text-xs">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Aucune entreprise n'a encore formulé de proposition.
                      </div>
                    ) : (
                      filteredModalConversations.map((conv) => {
                        const isSelected = selectedExchangeConv?.id === conv.id;
                        const partnerName = conv.creator_user?.company_profile?.company_name || conv.creator_user?.name || 'Entreprise Partenaire';
                        const lastMsg = conv.latest_message;
                        const lastTime = lastMsg ? formatMessageTime(lastMsg.created_at) : '';

                        return (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedExchangeConv(conv)}
                            className={`p-3 cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-[#f0f2f5] border-l-4 border-emerald-600'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                              {partnerName.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900 text-xs truncate">
                                  {partnerName}
                                </span>
                                {lastTime && (
                                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                    {lastTime}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-slate-500 line-clamp-1 italic">
                                  {lastMsg ? `"${lastMsg.message}"` : 'Discussion ouverte'}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold shrink-0 ml-1">
                                  {conv.messages?.length || 0} msg
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: WhatsApp Chat Box */}
                <div className="md:col-span-8 flex flex-col min-h-0 h-full justify-between" style={{
                  backgroundColor: '#efeae2',
                  backgroundImage: 'radial-gradient(#d1d7db 0.85px, transparent 0.85px)',
                  backgroundSize: '18px 18px',
                }}>
                  {selectedExchangeConv ? (
                    <>
                      {/* Chat Contact Header (shrink-0) */}
                      <div className="shrink-0 p-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            {(selectedExchangeConv.creator_user?.company_profile?.company_name || selectedExchangeConv.creator_user?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">
                                {selectedExchangeConv.creator_user?.company_profile?.company_name || selectedExchangeConv.creator_user?.name}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Candidat
                              </span>
                              <span className="text-xs text-slate-400">↔</span>
                              <span className="font-bold text-slate-900 text-xs">
                                {exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name}
                              </span>
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                Annonceur
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Supervision de négociation • {selectedExchangeConv.messages?.length || 0} message(s)
                            </p>
                          </div>
                        </div>

                        {/* Phone if available */}
                        {(selectedExchangeConv.creator_user?.phone || selectedExchangeConv.creator_user?.company_profile?.phone) && (
                          <a 
                            href={`tel:${selectedExchangeConv.creator_user?.phone || selectedExchangeConv.creator_user?.company_profile?.phone}`}
                            className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{selectedExchangeConv.creator_user?.phone || selectedExchangeConv.creator_user?.company_profile?.phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Chat Messages (WhatsApp Left / Right with strict inner overflow-y-auto) */}
                      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4">
                        {(!selectedExchangeConv.messages || selectedExchangeConv.messages.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-medium">Aucun message pour cette discussion.</p>
                          </div>
                        ) : (
                          selectedExchangeConv.messages.map((msg, index) => {
                            const isCreator = msg.sender_id === selectedExchangeConv.creator_user_id;
                            const creatorName = selectedExchangeConv.creator_user?.company_profile?.company_name || selectedExchangeConv.creator_user?.name || 'Candidat';
                            const recipientName = exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name || 'Annonceur';
                            const senderDisplayName = isCreator ? creatorName : recipientName;

                            // Groupement par date
                            const showDate = index === 0 || formatMessageDate(msg.created_at) !== formatMessageDate(selectedExchangeConv.messages[index - 1].created_at);

                            return (
                              <React.Fragment key={msg.id}>
                                {showDate && (
                                  <div className="flex justify-center my-3 sticky top-1 z-10">
                                    <span className="bg-white/90 backdrop-blur text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm border border-slate-200/80">
                                      {formatMessageDate(msg.created_at)}
                                    </span>
                                  </div>
                                )}

                                <div className={`flex ${isCreator ? 'justify-start' : 'justify-end'} mb-2`}>
                                  <div className={`relative max-w-[78%] px-4 py-2.5 shadow-sm ${
                                    isCreator
                                      ? 'bg-white text-slate-900 rounded-2xl rounded-tl-none border border-slate-200/70'
                                      : 'bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-none border border-[#bbf7d0]'
                                  }`}>
                                    {/* Sender Label */}
                                    <div className={`text-[11px] font-bold mb-1 ${
                                      isCreator ? 'text-blue-700' : 'text-emerald-800'
                                    }`}>
                                      {senderDisplayName}
                                    </div>

                                    {/* Attachment if present */}
                                    {msg.attachment_url && (
                                      <div className="mb-2">
                                        {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                            <img 
                                              src={msg.attachment_url} 
                                              alt={msg.attachment_name || 'Pièce jointe'} 
                                              className="rounded-lg max-h-48 w-full object-cover border border-black/10 hover:opacity-95"
                                            />
                                          </a>
                                        ) : (
                                          <a 
                                            href={msg.attachment_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-black/5 hover:bg-black/10 rounded-lg border border-black/5 transition-colors"
                                          >
                                            <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold text-slate-800 truncate">{msg.attachment_name || 'Document joint'}</p>
                                              <span className="text-[10px] text-slate-500">Télécharger</span>
                                            </div>
                                            <Download className="w-4 h-4 text-slate-500" />
                                          </a>
                                        )}
                                      </div>
                                    )}

                                    {/* Message Text */}
                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap select-text">
                                      {msg.message}
                                    </p>

                                    {/* Bottom Timestamp & Checks */}
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {formatMessageTime(msg.created_at)}
                                      </span>
                                      {!isCreator && (
                                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })
                        )}
                        <div ref={modalChatBottomRef} />
                      </div>

                      {/* WhatsApp Bottom Bar (shrink-0) */}
                      <div className="shrink-0 p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-inner">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span>Mode supervision administrateur (Lecture seule des messages en direct)</span>
                        </div>
                        <button
                          onClick={() => setExchangeChatModal(null)}
                          className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-sm"
                        >
                          Fermer
                        </button>
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
          </div>
        )}

        {/* DETAILS MODAL : FICHE DE PARTENARIAT */}
        {selectedExchange && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedExchange(null);
            }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Fiche de Partenariat B2B</h3>
                </div>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
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
                  className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
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
