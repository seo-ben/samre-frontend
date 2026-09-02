import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Handshake, Building2, MessageSquare, Search, RefreshCw, 
  CheckCircle2, XCircle, Clock, Trash2, Eye, ExternalLink, 
  Filter, Shield, ArrowRight, Send, User, Calendar, MapPin, 
  Phone, Layers, Check, AlertTriangle, MessageCircle, FileText, 
  ChevronRight, CheckCheck, Paperclip, Image as ImageIcon, Download, X,
  Users, ChevronDown, ArrowDown
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAuth } from '../contexts/AuthContext';

// Helper pour grouper les messages par date
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
  const { can } = useAuth();
  const canDelete = can('delete', '/service-exchanges');
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

  // Modal de confirmation de suppression personnalisé
  const [exchangeToDelete, setExchangeToDelete] = useState(null);
  const [deletingExchange, setDeletingExchange] = useState(false);

  // Modal des discussions spécifiques à un partenariat (Modern Chat UI)
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

  // Refs de conteneurs de messages avec scroll
  const modalMessagesContainerRef = useRef(null);
  const globalMessagesContainerRef = useRef(null);
  const lastScrolledModalConvId = useRef(null);
  const lastScrolledGlobalConvId = useRef(null);

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

  // Défilement automatique vers le bas UNIQUEMENT lors de la sélection initiale d'une conversation
  useEffect(() => {
    if (selectedExchangeConv?.id && selectedExchangeConv.id !== lastScrolledModalConvId.current) {
      lastScrolledModalConvId.current = selectedExchangeConv.id;
      setTimeout(() => {
        if (modalMessagesContainerRef.current) {
          modalMessagesContainerRef.current.scrollTop = modalMessagesContainerRef.current.scrollHeight;
        }
      }, 60);
    }
  }, [selectedExchangeConv?.id]);

  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== lastScrolledGlobalConvId.current) {
      lastScrolledGlobalConvId.current = selectedConversation.id;
      setTimeout(() => {
        if (globalMessagesContainerRef.current) {
          globalMessagesContainerRef.current.scrollTop = globalMessagesContainerRef.current.scrollHeight;
        }
      }, 60);
    }
  }, [selectedConversation?.id]);

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
    lastScrolledModalConvId.current = null;
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

  // Synchronisation en arrière-plan sans clignotement ni perturbation du scroll
  useEffect(() => {
    if (syncCounter > 0) {
      fetchExchanges(true);
      if (activeTab === 'conversations') {
        fetchConversations(true);
      }
      // Actualiser les conversations en arrière-plan sans forcer le scroll
      if (exchangeChatModal) {
        apiClient.get(`/v1/admin/service-exchanges/conversations?exchange_id=${exchangeChatModal.id}`)
          .then(res => {
            if (res.data?.success) {
              const list = res.data.data || [];
              setExchangeConversations(list);
              if (selectedExchangeConv) {
                const updated = list.find(c => c.id === selectedExchangeConv.id);
                if (updated) {
                  // Mettre à jour les messages uniquement si de nouveaux messages sont arrivés
                  if (updated.messages?.length !== selectedExchangeConv.messages?.length) {
                    setSelectedExchangeConv(updated);
                  }
                }
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

  // Delete / Moderate an exchange via custom modal
  const handleDeleteExchange = (itemOrId) => {
    const item = typeof itemOrId === 'object' ? itemOrId : exchanges.find(e => e.id === itemOrId) || { id: itemOrId, title: 'cette offre' };
    setExchangeToDelete(item);
  };

  const confirmDeleteExchange = async () => {
    if (!exchangeToDelete) return;
    setDeletingExchange(true);
    try {
      await apiClient.delete(`/v1/admin/service-exchanges/${exchangeToDelete.id}`);
      showToast('Offre de partenariat supprimée avec succès.');
      setSelectedExchange(null);
      if (exchangeChatModal?.id === exchangeToDelete.id) setExchangeChatModal(null);
      setExchangeToDelete(null);
      fetchExchanges();
      refreshNow();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    } finally {
      setDeletingExchange(false);
    }
  };

  // Filtrer les candidats dans le modal
  const filteredModalConversations = exchangeConversations.filter(c => {
    if (!modalSearch.trim()) return true;
    const name = c.creator_user?.company_profile?.company_name || c.creator_user?.name || '';
    return name.toLowerCase().includes(modalSearch.toLowerCase());
  });

  // Trier les messages du plus ancien au plus récent (Haut = Ancien, Bas = Nouveau)
  const getSortedMessages = (messagesList) => {
    if (!messagesList || !Array.isArray(messagesList)) return [];
    return [...messagesList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const scrollToBottomModal = () => {
    if (modalMessagesContainerRef.current) {
      modalMessagesContainerRef.current.scrollTo({
        top: modalMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

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
              Gérez les opportunités de partenariats et supervisez l'intégralité des échanges et négociations inter-entreprises en direct.
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

                          {/* 3. Discussions */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleOpenExchangeDiscussions(item)}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                convCount > 0
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Superviser les discussions complètes"
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
                                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden sm:inline">Discussions</span>
                              </button>
                              <button
                                onClick={() => setSelectedExchange(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Voir la fiche détaillée"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteExchange(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer / Modérer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

        {/* TAB 2 : SUPERVISION GLOBALE DES DISCUSSIONS */}
        {activeTab === 'conversations' && (
          <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row h-[680px] min-h-[500px]">
              
              {/* Left sidebar */}
              <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col min-h-0 h-full bg-slate-50/50 shrink-0">
                <div className="shrink-0 p-3 border-b border-slate-200/80 bg-white">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une discussion..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
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
                              ? 'bg-white shadow-sm border-l-4 border-blue-600'
                              : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {creatorName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {creatorName} ↔ {recipientName}
                              </span>
                              {lastTime && (
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                  {lastTime}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-blue-600 font-medium mt-0.5 truncate">
                              🏷️ {exchangeTitle}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-slate-500 line-clamp-1 italic">
                                {lastMsg ? lastMsg.message : 'Aucun message'}
                              </p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0 ml-1">
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

              {/* Right panel: Full Chat */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full bg-[#F8FAFC]">
                {selectedConversation ? (
                  <>
                    {/* Header */}
                    <div className="shrink-0 px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            Partenariat : <span className="text-slate-700 font-semibold">{selectedConversation.service_exchange?.title}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Supervision Active
                        </span>
                      </div>
                    </div>

                    {/* Messages Container */}
                    <div 
                      ref={globalMessagesContainerRef}
                      className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 py-5"
                      style={{ overscrollBehavior: 'contain' }}
                    >
                      {(!selectedConversation.messages || selectedConversation.messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                          <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="text-xs font-medium">Aucun message échangé dans cette discussion.</p>
                        </div>
                      ) : (
                        getSortedMessages(selectedConversation.messages).map((msg, index, arr) => {
                          const isCreator = msg.sender_id === selectedConversation.creator_user_id;
                          const creatorName = selectedConversation.creator_user?.company_profile?.company_name || selectedConversation.creator_user?.name || 'Candidat';
                          const recipientName = selectedConversation.recipient_user?.company_profile?.company_name || selectedConversation.recipient_user?.name || 'Annonceur';
                          const senderDisplayName = isCreator ? creatorName : recipientName;

                          const showDate = index === 0 || formatMessageDate(msg.created_at) !== formatMessageDate(arr[index - 1].created_at);

                          return (
                            <React.Fragment key={msg.id}>
                              {showDate && (
                                <div className="relative flex py-2 items-center justify-center my-2">
                                  <div className="flex-grow border-t border-slate-200/80"></div>
                                  <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-xs">
                                    {formatMessageDate(msg.created_at)}
                                  </span>
                                  <div className="flex-grow border-t border-slate-200/80"></div>
                                </div>
                              )}

                              {isCreator ? (
                                <div className="flex items-start gap-3 justify-start max-w-[82%]">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                    {creatorName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-slate-900">{senderDisplayName}</span>
                                      <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(msg.created_at)}</span>
                                    </div>
                                    <div className="bg-white text-slate-800 text-[13px] leading-relaxed p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/70 shadow-xs whitespace-pre-wrap select-text">
                                      {msg.attachment_url && (
                                        <div className="mb-2">
                                          {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                              <img 
                                                src={msg.attachment_url} 
                                                alt={msg.attachment_name || 'Pièce jointe'} 
                                                className="rounded-xl max-h-48 w-full object-cover border border-slate-200 hover:opacity-95"
                                              />
                                            </a>
                                          ) : (
                                            <a 
                                              href={msg.attachment_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                                            >
                                              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{msg.attachment_name || 'Document joint'}</p>
                                                <span className="text-[10px] text-slate-400">Cliquer pour ouvrir</span>
                                              </div>
                                              <Download className="w-4 h-4 text-slate-400" />
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      <p>{msg.message}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3 justify-end ml-auto max-w-[82%]">
                                  <div className="flex-1 min-w-0 flex flex-col items-end">
                                    <div className="flex items-center justify-end gap-2 mb-1">
                                      <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(msg.created_at)}</span>
                                      <span className="text-xs font-bold text-blue-700">{senderDisplayName}</span>
                                    </div>
                                    <div className="bg-blue-600 text-white text-[13px] leading-relaxed p-3.5 rounded-2xl rounded-tr-sm shadow-xs whitespace-pre-wrap select-text">
                                      {msg.attachment_url && (
                                        <div className="mb-2">
                                          {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                              <img 
                                                src={msg.attachment_url} 
                                                alt={msg.attachment_name || 'Pièce jointe'} 
                                                className="rounded-xl max-h-48 w-full object-cover border border-white/20 hover:opacity-95"
                                              />
                                            </a>
                                          ) : (
                                            <a 
                                              href={msg.attachment_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2.5 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
                                            >
                                              <FileText className="w-5 h-5 text-white shrink-0" />
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-white truncate">{msg.attachment_name || 'Document joint'}</p>
                                                <span className="text-[10px] text-blue-100">Cliquer pour ouvrir</span>
                                              </div>
                                              <Download className="w-4 h-4 text-white" />
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      <p>{msg.message}</p>
                                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-200">
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span>Lu</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                    {recipientName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom Bar */}
                    <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-xs">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Mode supervision administrateur en direct (Lecture seule)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
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

        {/* MODAL PRO : DISCUSSIONS COMPLÈTES DE PARTENARIAT */}
        {exchangeChatModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setExchangeChatModal(null);
            }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          >
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 relative animate-in fade-in zoom-in-95 duration-200"
              style={{ height: '650px', maxHeight: '88vh' }}
            >
              
              {/* 1. Modal Header (Pinned Top) */}
              <div className="shrink-0 px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {(selectedExchangeConv?.creator_user?.company_profile?.company_name || selectedExchangeConv?.creator_user?.name || exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">
                        {selectedExchangeConv?.creator_user?.company_profile?.company_name || selectedExchangeConv?.creator_user?.name || 'Discussion Partenariat'}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Partenaire B2B
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                      Offre : <strong className="text-slate-800">{exchangeChatModal.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Phone contact if available */}
                  {(selectedExchangeConv?.creator_user?.phone || selectedExchangeConv?.creator_user?.company_profile?.phone) && (
                    <a 
                      href={`tel:${selectedExchangeConv.creator_user?.phone || selectedExchangeConv.creator_user?.company_profile?.phone}`}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                      title="Contacter par téléphone"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedExchangeConv.creator_user?.phone || selectedExchangeConv.creator_user?.company_profile?.phone}</span>
                    </a>
                  )}

                  {/* Clean Close Button */}
                  <button
                    onClick={() => setExchangeChatModal(null)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                    title="Fermer la discussion (ou touche Échap)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 2. Context Deal Bar (Pinned) */}
              <div className="shrink-0 px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-emerald-700 shrink-0">🟢 Offre :</span>
                  <span className="text-slate-700 truncate">{exchangeChatModal.offer}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-blue-700 shrink-0">🔵 Besoin :</span>
                  <span className="text-slate-700 truncate">{exchangeChatModal.need}</span>
                </div>
              </div>

              {/* 3. Main Split Body */}
              <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
                
                {/* Left: Candidates list */}
                <div className="w-72 sm:w-80 border-r border-slate-100 flex flex-col min-h-0 h-full bg-slate-50/40 shrink-0">
                  <div className="shrink-0 p-3 border-b border-slate-100 bg-white">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrer les candidats..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 divide-y divide-slate-100/80 overflow-y-auto p-2 space-y-1">
                    {loadingExchangeChat ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
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
                            className={`p-3 cursor-pointer transition-all rounded-2xl flex items-start gap-3 ${
                              isSelected
                                ? 'bg-white shadow-sm border border-slate-200/80 text-blue-600'
                                : 'hover:bg-slate-100/70 text-slate-800'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {partnerName.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs truncate">
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
                                  {lastMsg ? `"${lastMsg.message}"` : 'Discussion engagée'}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0 ml-1">
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

                {/* Right: Modern Chat Body with guaranteed inner scroll */}
                <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full bg-[#F8FAFC] relative">
                  {selectedExchangeConv ? (
                    <>
                      {/* Messages Thread: Chronological Order (Oldest at top -> Newest at bottom) */}
                      <div 
                        ref={modalMessagesContainerRef}
                        className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 py-5"
                        style={{ overscrollBehavior: 'contain' }}
                      >
                        {(!selectedExchangeConv.messages || selectedExchangeConv.messages.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-medium">Aucun message pour cette discussion.</p>
                          </div>
                        ) : (
                          getSortedMessages(selectedExchangeConv.messages).map((msg, index, arr) => {
                            const isCreator = msg.sender_id === selectedExchangeConv.creator_user_id;
                            const creatorName = selectedExchangeConv.creator_user?.company_profile?.company_name || selectedExchangeConv.creator_user?.name || 'Candidat';
                            const recipientName = exchangeChatModal.company_profile?.company_name || exchangeChatModal.user?.name || 'Annonceur';
                            const senderDisplayName = isCreator ? creatorName : recipientName;

                            // Groupement par date
                            const showDate = index === 0 || formatMessageDate(msg.created_at) !== formatMessageDate(arr[index - 1].created_at);

                            return (
                              <React.Fragment key={msg.id}>
                                {showDate && (
                                  <div className="relative flex py-2 items-center justify-center my-2">
                                    <div className="flex-grow border-t border-slate-200/80"></div>
                                    <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-xs">
                                      {formatMessageDate(msg.created_at)}
                                    </span>
                                    <div className="flex-grow border-t border-slate-200/80"></div>
                                  </div>
                                )}

                                {isCreator ? (
                                  /* Incoming Message (Party A / Candidat - Gauche) */
                                  <div className="flex items-start gap-3 justify-start max-w-[84%]">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      {creatorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-900">{senderDisplayName}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(msg.created_at)}</span>
                                      </div>
                                      <div className="bg-white text-slate-800 text-[13.5px] leading-relaxed p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/70 shadow-xs whitespace-pre-wrap select-text">
                                        {/* Attachment if present */}
                                        {msg.attachment_url && (
                                          <div className="mb-2">
                                            {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                  src={msg.attachment_url} 
                                                  alt={msg.attachment_name || 'Pièce jointe'} 
                                                  className="rounded-xl max-h-48 w-full object-cover border border-slate-200 hover:opacity-95"
                                                />
                                              </a>
                                            ) : (
                                              <a 
                                                href={msg.attachment_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                                              >
                                                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-xs font-semibold text-slate-800 truncate">{msg.attachment_name || 'Document joint'}</p>
                                                  <span className="text-[10px] text-slate-400">Cliquer pour ouvrir</span>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-400" />
                                              </a>
                                            )}
                                          </div>
                                        )}
                                        <p>{msg.message}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Outgoing Message (Party B / Annonceur - Droite) */
                                  <div className="flex items-start gap-3 justify-end ml-auto max-w-[84%]">
                                    <div className="flex-1 min-w-0 flex flex-col items-end">
                                      <div className="flex items-center justify-end gap-2 mb-1">
                                        <span className="text-[10px] text-slate-400 font-medium">{formatMessageTime(msg.created_at)}</span>
                                        <span className="text-xs font-bold text-blue-700">{senderDisplayName}</span>
                                      </div>
                                      <div className="bg-blue-600 text-white text-[13.5px] leading-relaxed p-3.5 rounded-2xl rounded-tr-sm shadow-xs whitespace-pre-wrap select-text">
                                        {/* Attachment if present */}
                                        {msg.attachment_url && (
                                          <div className="mb-2">
                                            {msg.attachment_type?.startsWith('image') || msg.attachment_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                  src={msg.attachment_url} 
                                                  alt={msg.attachment_name || 'Pièce jointe'} 
                                                  className="rounded-xl max-h-48 w-full object-cover border border-white/20 hover:opacity-95"
                                                />
                                              </a>
                                            ) : (
                                              <a 
                                                href={msg.attachment_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2.5 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
                                              >
                                                <FileText className="w-5 h-5 text-white shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-xs font-semibold text-white truncate">{msg.attachment_name || 'Document joint'}</p>
                                                  <span className="text-[10px] text-blue-100">Cliquer pour ouvrir</span>
                                                </div>
                                                <Download className="w-4 h-4 text-white" />
                                              </a>
                                            )}
                                          </div>
                                        )}
                                        <p>{msg.message}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-200">
                                          <CheckCheck className="w-3.5 h-3.5" />
                                          <span>Lu</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                      {recipientName.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </div>

                      {/* Scroll to bottom quick button */}
                      <button
                        onClick={scrollToBottomModal}
                        className="absolute bottom-16 right-6 p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 rounded-full shadow-md border border-slate-200/80 transition-all opacity-80 hover:opacity-100 flex items-center gap-1 text-[11px] font-semibold"
                        title="Aller tout en bas aux derniers messages"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Derniers messages</span>
                      </button>

                      {/* 4. Bottom Footer (Pinned) */}
                      <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 shadow-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Supervision administrateur (Lecture seule des messages en direct)</span>
                        </div>
                        <button
                          onClick={() => setExchangeChatModal(null)}
                          className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-xs"
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
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Fiche de Partenariat B2B</h3>
                </div>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedExchange.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publié par : <span className="font-semibold text-slate-800">{selectedExchange.company_profile?.company_name || selectedExchange.user?.name}</span>
                </p>
              </div>

              {/* 🟢 Offer */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ce que cette entreprise PROPOSE :
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">{selectedExchange.offer}</p>
              </div>

              {/* 🔵 Need */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
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
                  className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Voir les discussions ({selectedExchange.proposals_count || 0})
                </button>

                <div className="flex items-center gap-2">
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteExchange(selectedExchange)}
                      className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedExchange(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL DE CONFIRMATION DE SUPPRESSION (PAS DE JAVASCRIPT ALERT) ── */}
        {exchangeToDelete && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget && !deletingExchange) setExchangeToDelete(null);
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
                    Supprimer ce partenariat ?
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
                    Êtes-vous sûr de vouloir supprimer définitivement l'offre de partenariat :
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
                    "{exchangeToDelete.title || 'Cette offre'}"
                  </div>
                  <p style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '600', marginTop: '8px' }}>
                    ⚠️ Cette action supprimera également les messages et propositions associés.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  disabled={deletingExchange}
                  onClick={() => setExchangeToDelete(null)}
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
                  disabled={deletingExchange}
                  onClick={confirmDeleteExchange}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: deletingExchange ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)'
                  }}
                  className="hover:opacity-90 transition cursor-pointer"
                >
                  {deletingExchange ? (
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

      </div>
    </MainLayout>
  );
};

export default ServiceExchangesManagement;
