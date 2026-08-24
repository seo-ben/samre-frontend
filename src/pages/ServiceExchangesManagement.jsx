import React, { useState, useEffect, useCallback } from 'react';
import { 
  Handshake, Building2, MessageSquare, Search, RefreshCw, 
  CheckCircle2, XCircle, Clock, Trash2, Eye, ExternalLink, 
  Filter, Shield, ArrowRight, Send, User, Calendar, MapPin, 
  Phone, Layers, Check, AlertTriangle
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

  // Selected Exchange Modal
  const [selectedExchange, setSelectedExchange] = useState(null);

  // Supervision Conversations state
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
  const fetchExchanges = useCallback(async () => {
    setLoading(true);
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
      console.error('Error fetching service exchanges:', err);
      showToast('Erreur lors du chargement des annonces de troc.', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, statusFilter, search, page]);

  // Fetch conversations for supervision
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
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
      setLoadingConversations(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges, syncCounter]);

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations();
    }
  }, [activeTab, fetchConversations]);

  // Delete / Moderate an exchange
  const handleDeleteExchange = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette offre de troc ?')) return;
    try {
      await apiClient.delete(`/v1/admin/service-exchanges/${id}`);
      showToast('Offre de troc supprimée avec succès.');
      setSelectedExchange(null);
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
                Troc B2B & Échanges Inter-Entreprises
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les propositions de troc de services et supervisez toutes les discussions entre entreprises en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchExchanges();
                if (activeTab === 'conversations') fetchConversations();
              }}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm"
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Annonces Troc</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_exchanges}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">{stats.b2b_exchanges} Troc B2B Entreprises</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discussions Inter-Entreprises</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_conversations}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Supervisées par l'Admin</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offres Actives en Ligne</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.active_deals}</h3>
              <p className="text-xs text-slate-400 mt-1">Disponibles au troc</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entraide Étudiants</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.student_exchanges}</h3>
              <p className="text-xs text-slate-400 mt-1">Soutien & Covoiturage</p>
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
            Toutes les Annonces de Troc ({exchanges.length})
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
            Supervision des Discussions & Messages ({conversations.length})
          </button>
        </div>

        {/* TAB 1 : EXCHANGES LIST */}
        {activeTab === 'exchanges' && (
          <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm">
            {/* Filters bar */}
            <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une entreprise, un service..."
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
                <option value="b2b">🏢 Troc B2B Entreprises</option>
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
                    <th className="px-5 py-3.5">🟢 Offre vs 🔵 Besoin</th>
                    <th className="px-5 py-3.5">Discussions</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Chargement des offres de troc...
                      </td>
                    </tr>
                  ) : exchanges.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        Aucune proposition de troc trouvée avec ces critères.
                      </td>
                    </tr>
                  ) : (
                    exchanges.map((item) => {
                      const isB2B = item.type === 'b2b';
                      const authorName = item.company_profile?.company_name || item.user?.name || item.user?.first_name || 'Utilisateur';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                          {/* Company / Author */}
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
                                  {isB2B ? 'TROC B2B' : 'ENTRAIDE'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900 max-w-xs line-clamp-2">{item.title}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{item.city || 'Guinée'}</span>
                              <span>•</span>
                              <span>{item.location_type === 'physical' ? 'Présentiel' : item.location_type === 'hybrid' ? 'Mixte' : 'En ligne'}</span>
                            </div>
                          </td>

                          {/* Offer vs Need */}
                          <td className="px-5 py-4 max-w-sm">
                            <div className="space-y-1.5">
                              <div className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200/60 line-clamp-1">
                                <span className="font-bold text-emerald-900">Offre : </span>
                                {item.offer}
                              </div>
                              <div className="text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200/60 line-clamp-1">
                                <span className="font-bold text-blue-900">Besoin : </span>
                                {item.need}
                              </div>
                            </div>
                          </td>

                          {/* Proposals & Discussions count */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                              {item.proposals_count || item.conversations?.length || 0} discussion(s)
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                          {/* Actions */}
                          <td className="px-5 py-4 text-right space-x-1">
                            <button
                              onClick={() => setSelectedExchange(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExchange(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Supprimer / Modérer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* TAB 2 : SUPERVISION DES DISCUSSIONS INTER-ENTREPRISES */}
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
                      const exchangeTitle = conv.service_exchange?.title || 'Troc de services';

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
                          Deal : {selectedConversation.service_exchange?.title}
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

        {/* DETAILS MODAL */}
        {selectedExchange && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Fiche de Troc B2B</h3>
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
                  Ce que cette entreprise OFFRE :
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">{selectedExchange.offer}</p>
              </div>

              {/* 🔵 Need */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  Ce qu'elle RECHERCHE en échange :
                </p>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">{selectedExchange.need}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2">
                <div><strong>Ville :</strong> {selectedExchange.city || 'Non renseigné'}</div>
                <div><strong>Modalité :</strong> {selectedExchange.location_type}</div>
                <div><strong>Contact :</strong> {selectedExchange.contact_phone || 'Non renseigné'}</div>
                <div><strong>Propositions :</strong> {selectedExchange.proposals_count || 0}</div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteExchange(selectedExchange.id)}
                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
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
