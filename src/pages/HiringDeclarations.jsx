import React, { useState, useCallback } from 'react';
import {
  Briefcase, CheckCircle2, Clock, XCircle, Search,
  Filter, RefreshCw, DollarSign, UserCheck, Building2,
  Phone, Mail, Calendar, Eye, CreditCard, Wallet,
  FileText, ArrowUpRight, Award, AlertCircle, Sparkles, Check
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useRealtime } from '../contexts/RealtimeContext';

export const HiringDeclarationsPage = () => {
  const { refreshNow, isSyncing, lastSyncTime } = useRealtime();

  // État des données
  const [declarations, setDeclarations] = useState([]);
  const [stats, setStats] = useState({
    total_declarations: 0,
    pending_review_count: 0,
    validated_count: 0,
    paid_count: 0,
    unpaid_count: 0,
    rejected_count: 0,
    total_paid_reward_cfa: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');

  // Modals
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_status: 'paid',
    reward_amount_cfa: 5000,
    payment_method: 'Portefeuille SAMRE',
    payment_reference: '',
    decision_notes: '',
    credit_wallet: true,
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Fonction de récupération des données
  const fetchDeclarations = useCallback(async ({ isBackgroundSync = false } = {}) => {
    if (!isBackgroundSync) setLoading(true);
    try {
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.payment_status = paymentFilter;
      if (originFilter !== 'all') params.hiring_origin = originFilter;

      const res = await apiClient.get('/v1/admin/hiring-declarations', { params });
      if (res.data?.data) {
        setDeclarations(res.data.data.declarations || []);
        if (res.data.data.stats) setStats(res.data.data.stats);
        if (res.data.data.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des déclarations d\'embauche', err);
    } finally {
      if (!isBackgroundSync) setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, search, statusFilter, paymentFilter, originFilter]);

  // Synchronisation en temps réel via le hook
  useRealtimeSync(fetchDeclarations, [pagination.current_page, search, statusFilter, paymentFilter, originFilter]);

  // Actions de statut
  const handleUpdateStatus = async (declarationId, newStatus) => {
    setStatusUpdatingId(declarationId);
    try {
      await apiClient.put(`/v1/admin/hiring-declarations/${declarationId}/status`, {
        status: newStatus,
      });
      await fetchDeclarations({ isBackgroundSync: true });
      refreshNow();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Ouvrir modal de paiement
  const openPaymentModal = (dec) => {
    setSelectedDeclaration(dec);
    setPaymentForm({
      payment_status: dec.payment_status === 'paid' ? 'paid' : 'paid',
      reward_amount_cfa: dec.reward_amount_cfa > 0 ? dec.reward_amount_cfa : 5000,
      payment_method: dec.payment_method || 'Portefeuille SAMRE',
      payment_reference: dec.payment_reference || '',
      decision_notes: dec.decision_notes || '',
      credit_wallet: true,
    });
    setShowPaymentModal(true);
  };

  // Soumettre décision de paiement
  const handleSavePaymentDecision = async (e) => {
    e.preventDefault();
    if (!selectedDeclaration) return;
    setSubmittingPayment(true);
    try {
      await apiClient.put(`/v1/admin/hiring-declarations/${selectedDeclaration.id}/payment`, paymentForm);
      setShowPaymentModal(false);
      await fetchDeclarations({ isBackgroundSync: true });
      refreshNow();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement de la décision de paiement');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatCFA = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header avec indicateur temps réel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Déclarations d'Embauche & Primes
                </h1>
                <p className="text-sm text-slate-500">
                  Vérification des renseignements d'embauche déclarés par les candidats et gestion des décisions de paiement.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronisation continue active
            </div>
            <button
              onClick={() => {
                refreshNow();
                fetchDeclarations();
              }}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Cartes KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Déclarations
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.total_declarations}
                </h3>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">{stats.validated_count} validées</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">{stats.rejected_count} rejetées</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  En Attente de Traitement
                </p>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                  {stats.pending_review_count}
                </h3>
              </div>
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-amber-700 font-medium">
              Nécessite la validation ou paiement admin
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Primes Payées
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {stats.paid_count}
                </h3>
              </div>
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-700 font-medium">
              {stats.unpaid_count} déclarations sans prime versée
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                  Montant Total Primes
                </p>
                <h3 className="text-xl font-extrabold text-purple-700 mt-1">
                  {formatCFA(stats.total_paid_reward_cfa)}
                </h3>
              </div>
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-purple-700 font-medium">
              Versé aux candidats déclarés embauchés
            </p>
          </div>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher candidat, entreprise, poste..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Statut embauche */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tous statuts embauche</option>
              <option value="validated">Validés ✅</option>
              <option value="pending">En attente ⏳</option>
              <option value="rejected">Rejetés ❌</option>
            </select>

            {/* Statut paiement */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tous statuts prime</option>
              <option value="paid">Payé 💰</option>
              <option value="unpaid">Non payé ⏳</option>
              <option value="pending">En cours d'examen</option>
              <option value="rejected">Refusé</option>
            </select>

            {/* Origine */}
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Toutes origines</option>
              <option value="SAMRE">Grâce à SAMRE</option>
              <option value="Externe">Autre canal / Externe</option>
            </select>
          </div>
        </div>

        {/* Tableau principal des déclarations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading && declarations.length === 0 ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Chargement des déclarations d'embauche...</p>
            </div>
          ) : declarations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Aucune déclaration d'embauche trouvée</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Les déclarations renseignées par les utilisateurs ayant trouvé un emploi s'afficheront ici en direct.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-bold uppercase text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-4">Candidat</th>
                    <th className="px-5 py-4">Embauche / Poste</th>
                    <th className="px-5 py-4">Contrat & Salaire</th>
                    <th className="px-5 py-4">Origine & Date</th>
                    <th className="px-5 py-4">Statut Embauche</th>
                    <th className="px-5 py-4">Prime & Paiement</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {declarations.map((dec) => {
                    const cand = dec.candidate_profile;
                    const u = dec.user || cand?.user;
                    const candidateName = cand
                      ? `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidat'
                      : u?.phone || 'Candidat';

                    return (
                      <tr key={dec.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Candidat */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {cand?.profile_photo_url ? (
                              <img
                                src={cand.profile_photo_url}
                                alt={candidateName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm border border-amber-200">
                                {candidateName[0]?.toUpperCase() || 'C'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{candidateName}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                {cand?.profession && <span>{cand.profession}</span>}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                {u?.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {u.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Embauche / Poste */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {dec.company_name || 'Entreprise non précisée'}
                          </div>
                          <div className="text-xs text-slate-600 font-semibold mt-0.5">
                            {dec.position || 'Poste non précisé'}
                          </div>
                          {dec.sector && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                              {dec.sector}
                            </span>
                          )}
                        </td>

                        {/* Contrat & Salaire */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-800">
                            {dec.contract_type || 'Contrat N/A'}
                          </div>
                          <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                            {dec.salary_range || 'Salaire non renseigné'}
                          </div>
                          {dec.location && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              📍 {dec.location}
                            </div>
                          )}
                        </td>

                        {/* Origine & Date */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-700">
                            {dec.hiring_origin ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {dec.hiring_origin}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dec.start_date ? new Date(dec.start_date).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
                          </div>
                        </td>

                        {/* Statut Embauche */}
                        <td className="px-5 py-4">
                          {dec.status === 'validated' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Validée
                            </span>
                          ) : dec.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Rejetée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" /> En attente
                            </span>
                          )}
                        </td>

                        {/* Statut Paiement & Prime */}
                        <td className="px-5 py-4">
                          {dec.payment_status === 'paid' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                💰 Payé : {formatCFA(dec.reward_amount_cfa)}
                              </span>
                              {dec.payment_method && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  via {dec.payment_method}
                                </div>
                              )}
                            </div>
                          ) : dec.payment_status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              ⏳ Prime en cours
                            </span>
                          ) : dec.payment_status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              ❌ Refusée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                              Non payée
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bouton Décision de paiement */}
                            <button
                              onClick={() => openPaymentModal(dec)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                              title="Prendre une décision de paiement / prime"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Paiement
                            </button>

                            {/* Bouton Détails */}
                            <button
                              onClick={() => {
                                setSelectedDeclaration(dec);
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Voir la fiche complète de renseignement"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Quick status validation toggle */}
                            {dec.status !== 'validated' && (
                              <button
                                onClick={() => handleUpdateStatus(dec.id, 'validated')}
                                disabled={statusUpdatingId === dec.id}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Valider directement l'embauche"
                              >
                                <Check className="w-4 h-4" />
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

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Affichage de {declarations.length} sur {pagination.total} déclarations
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, current_page: p.current_page - 1 }))}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Précédent
                </button>
                <span className="text-xs font-bold text-slate-700">
                  Page {pagination.current_page} sur {pagination.last_page}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, current_page: p.current_page + 1 }))}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── MODAL DE DÉCISION DE PAIEMENT ────────────────── */}
      {showPaymentModal && selectedDeclaration && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Décision de Paiement & Prime
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidat : {selectedDeclaration.candidate_profile?.first_name} {selectedDeclaration.candidate_profile?.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentDecision} className="p-6 space-y-4">
              {/* Récapitulatif de l'embauche */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Entreprise :</span>
                  <span className="font-bold text-slate-800">{selectedDeclaration.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Poste / Métier :</span>
                  <span className="font-bold text-slate-800">{selectedDeclaration.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Origine déclarée :</span>
                  <span className="font-semibold text-blue-600">{selectedDeclaration.hiring_origin || 'Non précisé'}</span>
                </div>
              </div>

              {/* Décision Statut Paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Statut du paiement *
                </label>
                <select
                  value={paymentForm.payment_status}
                  onChange={(e) => setPaymentForm(f => ({ ...f, payment_status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                >
                  <option value="paid">✅ Payé (Validation & déboursement de la prime)</option>
                  <option value="pending">⏳ En attente de vérification / validation</option>
                  <option value="unpaid">⚪ Non payé (Pas de prime due)</option>
                  <option value="rejected">❌ Rejeté / Refusé</option>
                </select>
              </div>

              {/* Montant de la prime */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Montant de la prime (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={paymentForm.reward_amount_cfa}
                    onChange={(e) => setPaymentForm(f => ({ ...f, reward_amount_cfa: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    XOF
                  </span>
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mode de règlement / Canal
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="Portefeuille SAMRE">Portefeuille SAMRE (Crédit instantané)</option>
                  <option value="T-Money">T-Money (Togocom)</option>
                  <option value="Flooz">Flooz (Moov Africa)</option>
                  <option value="Wave">Wave</option>
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Espèces / Agence">Paiement en espèces / En agence</option>
                </select>
              </div>

              {/* Référence de paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Référence de transaction / Numéro de reçu
                </label>
                <input
                  type="text"
                  placeholder="Ex: TX-98427928 ou Numéro de bordereau"
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm(f => ({ ...f, payment_reference: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Option Crédit Portefeuille */}
              {paymentForm.payment_method === 'Portefeuille SAMRE' && paymentForm.payment_status === 'paid' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="credit_wallet"
                    checked={paymentForm.credit_wallet}
                    onChange={(e) => setPaymentForm(f => ({ ...f, credit_wallet: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="credit_wallet" className="text-xs font-bold text-emerald-800 cursor-pointer">
                    Créditer automatiquement le solde du portefeuille du candidat
                  </label>
                </div>
              )}

              {/* Notes administratives */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes / Justification de la décision
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes de contrôle interne, contrat vérifié..."
                  value={paymentForm.decision_notes}
                  onChange={(e) => setPaymentForm(f => ({ ...f, decision_notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingPayment ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Valider la décision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL DE FICHE COMPLÈTE DE RENSEIGNEMENT ────────────────── */}
      {showDetailModal && selectedDeclaration && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Fiche Complète de Renseignement d'Embauche
                  </h3>
                  <p className="text-xs text-slate-500">
                    Déclaration #{selectedDeclaration.id} soumise le {new Date(selectedDeclaration.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Candidat */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Informations sur le Candidat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Nom & Prénom : </span>
                    <strong className="text-slate-900">
                      {selectedDeclaration.candidate_profile?.first_name} {selectedDeclaration.candidate_profile?.last_name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Métier / Titre : </span>
                    <strong className="text-slate-900">{selectedDeclaration.candidate_profile?.profession || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Téléphone : </span>
                    <strong className="text-slate-900">{selectedDeclaration.user?.phone || selectedDeclaration.candidate_profile?.user?.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Email : </span>
                    <strong className="text-slate-900">{selectedDeclaration.user?.email || selectedDeclaration.candidate_profile?.user?.email || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Renseignements d'embauche */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Détails du Contrat & de l'Embauche
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Entreprise d'accueil : </span>
                    <strong className="text-slate-900">{selectedDeclaration.company_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Poste occupé : </span>
                    <strong className="text-slate-900">{selectedDeclaration.position}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Secteur d'activité : </span>
                    <strong className="text-slate-900">{selectedDeclaration.sector || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Type de contrat : </span>
                    <strong className="text-slate-900">{selectedDeclaration.contract_type || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Fourchette salariale : </span>
                    <strong className="text-emerald-700 font-bold">{selectedDeclaration.salary_range || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Date de prise de fonction : </span>
                    <strong className="text-slate-900">
                      {selectedDeclaration.start_date ? new Date(selectedDeclaration.start_date).toLocaleDateString('fr-FR') : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Origine de l'embauche : </span>
                    <strong className="text-blue-700">{selectedDeclaration.hiring_origin || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Localisation du poste : </span>
                    <strong className="text-slate-900">{selectedDeclaration.location || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Notes et commentaires fournis par l'utilisateur */}
              {selectedDeclaration.notes && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider mb-1">
                    Explications & Notes du Candidat
                  </h4>
                  <p className="text-xs text-amber-900 whitespace-pre-wrap">
                    {selectedDeclaration.notes}
                  </p>
                </div>
              )}

              {/* Historique décision et paiement */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 text-xs">
                <h4 className="text-xs font-bold uppercase text-purple-800 tracking-wider mb-2">
                  Statut de Traitement & Décision Admin
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Validation embauche : </span>
                    <strong className="text-slate-900">{selectedDeclaration.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Paiement Prime : </span>
                    <strong className="text-slate-900">{selectedDeclaration.payment_status} ({formatCFA(selectedDeclaration.reward_amount_cfa)})</strong>
                  </div>
                  {selectedDeclaration.payment_method && (
                    <div>
                      <span className="text-slate-500">Méthode : </span>
                      <strong className="text-slate-900">{selectedDeclaration.payment_method}</strong>
                    </div>
                  )}
                  {selectedDeclaration.payment_reference && (
                    <div>
                      <span className="text-slate-500">Réf. transaction : </span>
                      <strong className="text-slate-900">{selectedDeclaration.payment_reference}</strong>
                    </div>
                  )}
                  {selectedDeclaration.decided_by && (
                    <div className="md:col-span-2">
                      <span className="text-slate-500">Traité par l'administrateur : </span>
                      <strong className="text-slate-900">{selectedDeclaration.decided_by.first_name} {selectedDeclaration.decided_by.last_name}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openPaymentModal(selectedDeclaration);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Prendre décision de paiement
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default HiringDeclarationsPage;
