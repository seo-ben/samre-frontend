import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Send, Clock, Users, ShieldAlert, Sparkles, 
  MapPin, Globe, CheckCircle2, AlertCircle, RefreshCw, 
  Calendar, Smartphone, Check, X, ChevronRight, ChevronLeft, 
  Trash2, RotateCcw, Radio, Info, MessageSquare, ArrowRight, Eye,
  Edit3, Pencil
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { MainLayout } from '../components/layout/MainLayout';

// Formatage de la date pour affichage
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Formatage pour input datetime-local (YYYY-MM-DDTHH:mm)
const formatToDatetimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const NotificationsCenter = () => {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history'
  
  // États de l'historique
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    total_campaigns: 0,
    sent_campaigns: 0,
    scheduled_campaigns: 0,
    total_recipients_reached: 0,
  });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filtres Historique
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Données géographiques pour ciblage
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);

  // Formulaire de Composition
  const [form, setForm] = useState({
    title: '',
    body: '',
    target_audience: 'all', // 'all', 'candidates', 'companies', 'visitors'
    country_id: '',
    region_id: '',
    prefecture_id: '',
    commune_id: '',
    channel: 'both', // 'push', 'in_app', 'both'
    action_url: '',
    image_url: '',
    is_scheduled: false,
    scheduled_at: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [estimatedAudience, setEstimatedAudience] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // État de modification d'une notification existante
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Configuration du Modal de confirmation personnalisé (sans alertes JS natives)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary', // 'primary' | 'danger' | 'warning'
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    loading: false,
    onConfirm: null,
  });

  // 1. Charger les données géographiques complètes
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const [cRes, rRes, pRes, mRes] = await Promise.all([
          apiClient.get('/v1/content/countries?all=1').catch(() => ({ data: { data: [] } })),
          apiClient.get('/v1/content/regions').catch(() => ({ data: { data: [] } })),
          apiClient.get('/v1/content/prefectures').catch(() => ({ data: { data: [] } })),
          apiClient.get('/v1/content/communes').catch(() => ({ data: { data: [] } })),
        ]);
        setCountries(cRes.data?.data || []);
        setRegions(rRes.data?.data || []);
        setPrefectures(pRes.data?.data || []);
        setCommunes(mRes.data?.data || []);
      } catch (err) {
        console.error('Erreur chargement localisations', err);
      }
    };
    fetchGeo();
  }, []);

  // 2. Charger les statistiques et l'historique
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (audienceFilter !== 'all') params.target_audience = audienceFilter;

      const res = await apiClient.get('/v1/admin/notifications/campaigns', { params });
      if (res.data?.success) {
        setCampaigns(res.data.data?.campaigns || []);
        if (res.data.data?.stats) {
          setStats(res.data.data.stats);
        }
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (err) {
      console.error('Erreur chargement campagnes', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, audienceFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // 3. Estimer l'audience en direct
  useEffect(() => {
    let timer = setTimeout(async () => {
      setEstimating(true);
      try {
        const params = {
          target_audience: form.target_audience,
        };
        if (form.country_id) params.country_id = form.country_id;
        if (form.region_id) params.region_id = form.region_id;
        if (form.prefecture_id) params.prefecture_id = form.prefecture_id;
        if (form.commune_id) params.commune_id = form.commune_id;

        const res = await apiClient.get('/v1/admin/notifications/estimate-audience', { params });
        if (res.data?.success) {
          setEstimatedAudience(res.data.data.estimated_recipients);
        }
      } catch (err) {
        console.error("Erreur d'estimation", err);
      } finally {
        setEstimating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.target_audience, form.country_id, form.region_id, form.prefecture_id, form.commune_id]);

  // 4. Soumission de l'envoi / programmation / mise à jour
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('Veuillez saisir un titre pour la notification.');
      return;
    }
    if (!form.body.trim()) {
      setErrorMessage('Veuillez saisir le contenu du message.');
      return;
    }
    if (form.is_scheduled && !form.scheduled_at) {
      setErrorMessage("Veuillez sélectionner la date et l'heure de programmation.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        target_audience: form.target_audience,
        channel: form.channel,
        action_url: form.action_url.trim() || null,
        image_url: form.image_url.trim() || null,
        country_id: form.country_id ? Number(form.country_id) : null,
        region_id: form.region_id ? Number(form.region_id) : null,
        prefecture_id: form.prefecture_id ? Number(form.prefecture_id) : null,
        commune_id: form.commune_id ? Number(form.commune_id) : null,
        scheduled_at: form.is_scheduled ? form.scheduled_at : null,
      };

      const isUpdatingScheduled = editingCampaign && editingCampaign.status === 'scheduled';
      let res;

      if (isUpdatingScheduled) {
        // Mise à jour de la notification programmée existante
        res = await apiClient.put(`/v1/admin/notifications/campaigns/${editingCampaign.id}`, payload);
      } else {
        // Création / Nouvel envoi direct
        res = await apiClient.post('/v1/admin/notifications/campaigns', payload);
      }

      if (res.data?.success) {
        setSuccessMessage(res.data.message || (isUpdatingScheduled ? 'Notification programmée mise à jour avec succès !' : 'Notification enregistrée avec succès !'));
        // Réinitialiser formulaire et état d'édition
        setEditingCampaign(null);
        setForm({
          title: '',
          body: '',
          target_audience: 'all',
          country_id: '',
          region_id: '',
          prefecture_id: '',
          commune_id: '',
          channel: 'both',
          action_url: '',
          image_url: '',
          is_scheduled: false,
          scheduled_at: '',
        });
        fetchCampaigns();
        // Basculer vers l'onglet historique après 1.2s
        setTimeout(() => {
          setActiveTab('history');
        }, 1200);
      } else {
        setErrorMessage(res.data?.message || "Une erreur est survenue lors de l'opération.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Erreur de communication avec le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Charger une notification dans le formulaire pour édition ou republication
  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setForm({
      title: campaign.title || '',
      body: campaign.body || '',
      target_audience: campaign.target_audience || 'all',
      country_id: campaign.country_id ? String(campaign.country_id) : '',
      region_id: campaign.region_id ? String(campaign.region_id) : '',
      prefecture_id: campaign.prefecture_id ? String(campaign.prefecture_id) : '',
      commune_id: campaign.commune_id ? String(campaign.commune_id) : '',
      channel: campaign.channel || 'both',
      action_url: campaign.action_url || '',
      image_url: campaign.image_url || '',
      is_scheduled: campaign.status === 'scheduled',
      scheduled_at: campaign.scheduled_at ? formatToDatetimeLocal(campaign.scheduled_at) : '',
    });
    setActiveTab('compose');
    setSuccessMessage(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. Annuler le mode édition
  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setForm({
      title: '',
      body: '',
      target_audience: 'all',
      country_id: '',
      region_id: '',
      prefecture_id: '',
      commune_id: '',
      channel: 'both',
      action_url: '',
      image_url: '',
      is_scheduled: false,
      scheduled_at: '',
    });
  };

  // 7. Annulation d'une notification programmée via Modal de confirmation
  const handleCancelCampaign = (campaign) => {
    setModalConfig({
      isOpen: true,
      title: 'Annuler cette programmation ?',
      message: `La notification "${campaign.title}" ne sera pas diffusée aux utilisateurs ciblés. Cette action est irréversible.`,
      type: 'danger',
      confirmText: 'Oui, annuler la programmation',
      cancelText: 'Conserver',
      loading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await apiClient.post(`/v1/admin/notifications/campaigns/${campaign.id}/cancel`);
          if (res.data?.success) {
            setSuccessMessage(`La notification #${campaign.id} a été annulée avec succès.`);
            fetchCampaigns();
          }
        } catch (err) {
          setErrorMessage("Erreur lors de l'annulation : " + (err.response?.data?.message || err.message));
        } finally {
          setModalConfig(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  // 8. Renvoyer une notification via Modal de confirmation
  const handleResendCampaign = (campaign) => {
    setModalConfig({
      isOpen: true,
      title: 'Renvoyer la notification maintenant ?',
      message: `Voulez-vous rediffuser immédiatement la notification "${campaign.title}" à tous les utilisateurs concernés ?`,
      type: 'primary',
      confirmText: 'Oui, diffuser maintenant',
      cancelText: 'Annuler',
      loading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await apiClient.post(`/v1/admin/notifications/campaigns/${campaign.id}/resend`);
          if (res.data?.success) {
            setSuccessMessage(res.data.message || `Notification #${campaign.id} renvoyée avec succès.`);
            fetchCampaigns();
          }
        } catch (err) {
          setErrorMessage("Erreur lors du renvoi : " + (err.response?.data?.message || err.message));
        } finally {
          setModalConfig(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  // Helpers de badges de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return { label: 'Envoyée', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
      case 'scheduled':
        return { label: 'Programmée', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
      case 'sending':
        return { label: 'En cours', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'cancelled':
        return { label: 'Annulée', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
      case 'failed':
        return { label: 'Échouée', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
      default:
        return { label: status, bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
  };

  // Helpers audience
  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'candidates':
        return '👩‍💼 Secrétaires (Candidats)';
      case 'companies':
        return '🏢 Entreprises & Recruteurs';
      case 'visitors':
        return '👤 Visiteurs';
      default:
        return '🌐 Tous les utilisateurs';
    }
  };

  // Calculs dynamiques de cascade géographique
  const availableRegions = form.country_id
    ? regions.filter(r => String(r.country_id) === String(form.country_id))
    : regions;

  const availablePrefectures = form.region_id
    ? prefectures.filter(p => String(p.region_id) === String(form.region_id))
    : (form.country_id
        ? prefectures.filter(p => availableRegions.some(r => r.id === p.region_id))
        : prefectures);

  const availableCommunes = form.prefecture_id
    ? communes.filter(c => String(c.prefecture_id) === String(form.prefecture_id))
    : (form.region_id
        ? communes.filter(c => availablePrefectures.some(p => p.id === c.prefecture_id))
        : (form.country_id
            ? communes.filter(c => availablePrefectures.some(p => p.id === c.prefecture_id))
            : communes));

  const hasGeoFilter = Boolean(form.country_id || form.region_id || form.prefecture_id || form.commune_id);

  const handleResetGeo = () => {
    setForm(prev => ({
      ...prev,
      country_id: '',
      region_id: '',
      prefecture_id: '',
      commune_id: ''
    }));
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* ── En-tête Compact ── */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#1A6FD4" />
              Centre de Notifications Push & Ciblage
            </h1>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Diffusez des alertes instantanées ou programmées vers les secrétaires, entreprises et zones géographiques.
            </p>
          </div>

          {/* Onglets de navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('compose')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: activeTab === 'compose' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'compose' ? '#1A6FD4' : '#64748B',
                boxShadow: activeTab === 'compose' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Send size={14} />
              Nouvel Envoi & Ciblage
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: activeTab === 'history' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'history' ? '#1A6FD4' : '#64748B',
                boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Clock size={14} />
              Historique & Programmations ({stats.total_campaigns})
            </button>
          </div>
        </div>

        {/* ── Cartes KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Campagnes Diffusées</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                {Number(stats.sent_campaigns || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1A6FD4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Destinataires Touchés</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A6FD4' }}>
                {Number(stats.total_recipients_reached || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>En Attente de Déclenchement</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#D97706' }}>
                {Number(stats.scheduled_campaigns || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Canaux Supportés</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#9333EA' }}>
                Push Mobile + In-App
              </div>
            </div>
          </div>

        </div>

        {/* ── Messages d'alerte ── */}
        {successMessage && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* ── VUE 1 : COMPOSITEUR DE NOTIFICATION & CIBLAGE ── */}
        {activeTab === 'compose' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)', gap: '12px' }}>
            
            {/* Formulaire de composition */}
            <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Bannière Mode Édition */}
              {editingCampaign && (
                <div style={{
                  backgroundColor: editingCampaign.status === 'scheduled' ? '#FFFBEB' : '#EFF6FF',
                  border: `1px solid ${editingCampaign.status === 'scheduled' ? '#FDE68A' : '#BFDBFE'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: editingCampaign.status === 'scheduled' ? '#FEF3C7' : '#DBEAFE',
                      color: editingCampaign.status === 'scheduled' ? '#D97706' : '#1A6FD4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Pencil size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: editingCampaign.status === 'scheduled' ? '#92400E' : '#1E40AF' }}>
                        {editingCampaign.status === 'scheduled'
                          ? `Modification de la notification programmée #${editingCampaign.id}`
                          : `Édition & Rediffusion de la notification #${editingCampaign.id}`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {editingCampaign.status === 'scheduled'
                          ? "Vous pouvez ajuster le texte, le ciblage et la date/heure avant son envoi automatique."
                          : "Vous pouvez modifier le texte ou l'audience puis envoyer cette nouvelle version."}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✕ Annuler l'édition
                  </button>
                </div>
              )}

              {/* Section 1 : Message */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} color="#1A6FD4" />
                  1. Message de la Notification
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Titre de la notification <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 📢 Nouvelles opportunités de stage disponibles !"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px',
                        outline: 'none',
                        backgroundColor: '#F8FAFC'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
                        Texte du message <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{form.body.length}/500 caractères</span>
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Saisissez le texte complet reçu par les utilisateurs sur leur smartphone..."
                      value={form.body}
                      onChange={e => setForm({ ...form, body: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px',
                        outline: 'none',
                        backgroundColor: '#F8FAFC',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '3px' }}>
                        Lien d'action / Deep Link (Optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: samre://offers ou /events"
                        value={form.action_url}
                        onChange={e => setForm({ ...form, action_url: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '11.5px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '3px' }}>
                        Image de bannière URL (Optionnel)
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../banner.png"
                        value={form.image_url}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '11.5px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2 : Ciblage & Audience */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="#1A6FD4" />
                  2. Ciblage des Destinataires
                </h3>

                {/* Sélecteur de type d'utilisateur */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Type de profils ciblés :
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                    {[
                      { id: 'all', label: 'Tous', desc: 'Tout le réseau', icon: '🌐' },
                      { id: 'candidates', label: 'Secrétaires', desc: 'Candidats actifs', icon: '👩‍💼' },
                      { id: 'companies', label: 'Entreprises', desc: 'Recruteurs', icon: '🏢' },
                      { id: 'visitors', label: 'Visiteurs', desc: 'Grand public', icon: '👤' },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setForm({ ...form, target_audience: t.id })}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: form.target_audience === t.id ? '2px solid #1A6FD4' : '1px solid #E2E8F0',
                          backgroundColor: form.target_audience === t.id ? '#EFF6FF' : '#F8FAFC',
                          color: form.target_audience === t.id ? '#1A6FD4' : '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: '700' }}>{t.label}</div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>{t.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtres géographiques en cascade */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
                      Filtre Géographique en Cascade (Optionnel) :
                    </label>
                    {hasGeoFilter && (
                      <button
                        type="button"
                        onClick={handleResetGeo}
                        style={{
                          fontSize: '11px',
                          color: '#DC2626',
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ✕ Réinitialiser la zone
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    
                    {/* 1. Pays */}
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        1. Pays {countries.length > 0 && `(${countries.length})`}
                      </span>
                      <select
                        value={form.country_id}
                        onChange={e => setForm({ 
                          ...form, 
                          country_id: e.target.value, 
                          region_id: '', 
                          prefecture_id: '', 
                          commune_id: '' 
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          border: form.country_id ? '1.5px solid #1A6FD4' : '1px solid #CBD5E1', 
                          fontSize: '11.5px', 
                          backgroundColor: form.country_id ? '#EFF6FF' : '#F8FAFC',
                          fontWeight: form.country_id ? '700' : 'normal'
                        }}
                      >
                        <option value="">Tous les pays</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.translations?.[0]?.name || c.name || `Pays #${c.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Région */}
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        2. Région {availableRegions.length > 0 && `(${availableRegions.length})`}
                      </span>
                      <select
                        value={form.region_id}
                        onChange={e => setForm({ 
                          ...form, 
                          region_id: e.target.value, 
                          prefecture_id: '', 
                          commune_id: '' 
                        })}
                        disabled={form.country_id && availableRegions.length === 0}
                        style={{ 
                          width: '100%', 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          border: form.region_id ? '1.5px solid #1A6FD4' : '1px solid #CBD5E1', 
                          fontSize: '11.5px', 
                          backgroundColor: form.region_id ? '#EFF6FF' : '#F8FAFC',
                          fontWeight: form.region_id ? '700' : 'normal',
                          opacity: (form.country_id && availableRegions.length === 0) ? 0.6 : 1
                        }}
                      >
                        <option value="">
                          {form.country_id && availableRegions.length === 0 ? 'Aucune région' : 'Toutes les régions'}
                        </option>
                        {availableRegions.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.translations?.[0]?.name || r.name || `Région #${r.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Préfecture */}
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        3. Préfecture {availablePrefectures.length > 0 && `(${availablePrefectures.length})`}
                      </span>
                      <select
                        value={form.prefecture_id}
                        onChange={e => setForm({ 
                          ...form, 
                          prefecture_id: e.target.value, 
                          commune_id: '' 
                        })}
                        disabled={(form.region_id && availablePrefectures.length === 0) || (form.country_id && availablePrefectures.length === 0)}
                        style={{ 
                          width: '100%', 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          border: form.prefecture_id ? '1.5px solid #1A6FD4' : '1px solid #CBD5E1', 
                          fontSize: '11.5px', 
                          backgroundColor: form.prefecture_id ? '#EFF6FF' : '#F8FAFC',
                          fontWeight: form.prefecture_id ? '700' : 'normal',
                          opacity: (form.country_id && availablePrefectures.length === 0) ? 0.6 : 1
                        }}
                      >
                        <option value="">
                          {(form.region_id || form.country_id) && availablePrefectures.length === 0 ? 'Aucune préfecture' : 'Toutes les préfectures'}
                        </option>
                        {availablePrefectures.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.translations?.[0]?.name || p.name || `Préfecture #${p.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Commune */}
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '2px' }}>
                        4. Commune / Ville {availableCommunes.length > 0 && `(${availableCommunes.length})`}
                      </span>
                      <select
                        value={form.commune_id}
                        onChange={e => setForm({ ...form, commune_id: e.target.value })}
                        disabled={(form.prefecture_id && availableCommunes.length === 0) || (form.country_id && availableCommunes.length === 0)}
                        style={{ 
                          width: '100%', 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          border: form.commune_id ? '1.5px solid #1A6FD4' : '1px solid #CBD5E1', 
                          fontSize: '11.5px', 
                          backgroundColor: form.commune_id ? '#EFF6FF' : '#F8FAFC',
                          fontWeight: form.commune_id ? '700' : 'normal',
                          opacity: (form.prefecture_id && availableCommunes.length === 0) ? 0.6 : 1
                        }}
                      >
                        <option value="">
                          {(form.prefecture_id || form.country_id) && availableCommunes.length === 0 ? 'Aucune commune' : 'Toutes les communes'}
                        </option>
                        {availableCommunes.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.translations?.[0]?.name || m.name || `Commune #${m.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* Boîte d'estimation d'audience */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#1A6FD4" />
                    <span style={{ fontSize: '11.5px', color: '#1E40AF', fontWeight: '600' }}>
                      Audience estimée :
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1D4ED8' }}>
                    {estimating ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      `~ ${Number(estimatedAudience || 0).toLocaleString()} utilisateur(s)`
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3 : Programmation */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#1A6FD4" />
                  3. Moment de Déclenchement
                </h3>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: !form.is_scheduled ? '#1A6FD4' : '#64748B', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="schedule_mode"
                      checked={!form.is_scheduled}
                      onChange={() => setForm({ ...form, is_scheduled: false })}
                    />
                    ⚡ Envoi Immédiat
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: form.is_scheduled ? '#1A6FD4' : '#64748B', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="schedule_mode"
                      checked={form.is_scheduled}
                      onChange={() => setForm({ ...form, is_scheduled: true })}
                    />
                    ⏰ Programmer à une date et heure précise
                  </label>
                </div>

                {form.is_scheduled && (
                  <div style={{ backgroundColor: '#FFFBEB', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#92400E' }}>
                      Date et heure exacte de déclenchement :
                    </label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #FCD34D',
                        fontSize: '12px',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        maxWidth: '260px'
                      }}
                    />
                    <span style={{ fontSize: '10.5px', color: '#B45309' }}>
                      💡 Le système enverra automatiquement le message push à tous les utilisateurs ciblés dès que l'heure sera atteinte.
                    </span>
                  </div>
                )}
              </div>

              {/* Bouton de Soumission */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: form.is_scheduled ? '#D97706' : '#1A6FD4',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Traitement en cours...
                    </>
                  ) : editingCampaign?.status === 'scheduled' ? (
                    form.is_scheduled ? (
                      <>
                        <Clock size={16} />
                        Enregistrer les modifications de la programmation
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enregistrer et Diffuser Maintenant
                      </>
                    )
                  ) : form.is_scheduled ? (
                    <>
                      <Clock size={16} />
                      {editingCampaign ? 'Programmer cette version' : 'Enregistrer la Programmation'}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {editingCampaign ? 'Diffuser cette nouvelle version' : 'Diffuser la Notification Maintenant'}
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* ── Aperçu en direct du Rendu Mobile (Mockup Smartphone) ── */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', width: '100%' }}>
                <Smartphone size={16} color="#1A6FD4" />
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Aperçu Réel sur Smartphone
                </h3>
              </div>

              {/* Cadre de téléphone */}
              <div style={{
                width: '280px',
                minHeight: '420px',
                backgroundColor: '#0F172A',
                borderRadius: '32px',
                padding: '12px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
                border: '4px solid #334155',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Notch / Speaker */}
                <div style={{ width: '80px', height: '4px', backgroundColor: '#334155', borderRadius: '2px', margin: '4px auto 14px auto' }} />

                {/* Écran du téléphone */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#1E293B',
                  borderRadius: '22px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Heure / Statut */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8', fontSize: '10px', padding: '0 4px' }}>
                    <span>12:45</span>
                    <span>📶 4G  🔋 95%</span>
                  </div>

                  {/* Notification Push Card */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '14px',
                    padding: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginTop: '20px'
                  }}>
                    {/* Header App */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#1A6FD4', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900' }}>
                          S
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0F172A' }}>SAMRE</span>
                      </div>
                      <span style={{ fontSize: '9.5px', color: '#64748B' }}>maintenant</span>
                    </div>

                    {/* Titre */}
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0F172A', lineHeight: '1.2' }}>
                      {form.title.trim() || 'Titre de votre notification'}
                    </div>

                    {/* Corps du message */}
                    <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.3', wordBreak: 'break-word' }}>
                      {form.body.trim() || 'Le contenu de votre message apparaîtra ici tel qu\'affiché sur l\'écran de verrouillage.'}
                    </div>

                    {/* Bannière d'image si présente */}
                    {form.image_url && (
                      <div style={{ width: '100%', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#E2E8F0', marginTop: '2px' }}>
                        <img src={form.image_url} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 'auto', padding: '10px', color: '#64748B', fontSize: '10px' }}>
                    Glisser vers le haut pour déverrouiller
                  </div>
                </div>

                {/* Home Indicator */}
                <div style={{ width: '90px', height: '3px', backgroundColor: '#64748B', borderRadius: '2px', margin: '10px auto 2px auto' }} />
              </div>
            </div>

          </div>
        )}

        {/* ── VUE 2 : HISTORIQUE & PROGRAMMATIONS ── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Barre de filtres */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              {/* Recherche */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <input
                  type="text"
                  placeholder="Rechercher par titre ou contenu..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    outline: 'none',
                    backgroundColor: '#F8FAFC'
                  }}
                />
              </div>

              {/* Filtre Statut */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF', outline: 'none' }}
              >
                <option value="all">Tous les statuts</option>
                <option value="sent">Diffusées (Envoyées)</option>
                <option value="scheduled">Programmées à venir</option>
                <option value="cancelled">Annulées</option>
                <option value="failed">Échouées</option>
              </select>

              {/* Filtre Audience */}
              <select
                value={audienceFilter}
                onChange={e => { setAudienceFilter(e.target.value); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF', outline: 'none' }}
              >
                <option value="all">Toutes les audiences</option>
                <option value="candidates">Secrétaires</option>
                <option value="companies">Entreprises</option>
                <option value="visitors">Visiteurs</option>
              </select>

              <button
                onClick={fetchCampaigns}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Actualiser
              </button>
            </div>

            {/* Tableau compact */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Date / Programmation</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Notification (Titre & Corps)</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Audience & Zone</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Statut</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700' }}>Destinataires</th>
                      <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                          <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                          Chargement des campagnes...
                        </td>
                      </tr>
                    ) : campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                          <AlertCircle size={24} color="#94A3B8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                          Aucune campagne de notification enregistrée.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((c) => {
                        const statusBadge = getStatusBadge(c.status);
                        const isScheduled = c.status === 'scheduled';

                        return (
                          <tr
                            key={c.id}
                            style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                          >
                            {/* Date */}
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>
                                {isScheduled ? formatDate(c.scheduled_at) : formatDate(c.sent_at || c.created_at)}
                              </div>
                              <span style={{ fontSize: '10.5px', color: isScheduled ? '#D97706' : '#64748B' }}>
                                {isScheduled ? '⏰ Prévu' : 'Diffusé'}
                              </span>
                            </td>

                            {/* Titre & Message */}
                            <td style={{ padding: '8px 12px', maxWidth: '280px' }}>
                              <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                                {c.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.body}
                              </div>
                              {c.action_url && (
                                <span style={{ fontSize: '10px', color: '#1A6FD4', marginTop: '2px', display: 'block' }}>
                                  🔗 {c.action_url}
                                </span>
                              )}
                            </td>

                            {/* Audience & Zone */}
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '11.5px' }}>
                                {getAudienceLabel(c.target_audience)}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                                {c.commune?.translations?.[0]?.name || c.commune?.name ||
                                 c.prefecture?.translations?.[0]?.name || c.prefecture?.name ||
                                 c.country?.translations?.[0]?.name || c.country?.name || 'Toutes zones'}
                              </div>
                            </td>

                            {/* Statut */}
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: statusBadge.bg,
                                color: statusBadge.color,
                                border: `1px solid ${statusBadge.border}`
                              }}>
                                {statusBadge.label}
                              </span>
                            </td>

                            {/* Destinataires */}
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ fontWeight: '800', color: '#0F172A' }}>
                                {isScheduled ? '—' : Number(c.recipients_count || 0).toLocaleString()}
                              </span>
                              {!isScheduled && (
                                <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '4px' }}>
                                  reçus
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                
                                {/* 1. Modifier / Éditer */}
                                <button
                                  onClick={() => handleEditCampaign(c)}
                                  title={isScheduled ? "Modifier cette notification programmée" : "Éditer et renvoyer cette notification"}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#F8FAFC',
                                    color: '#334155',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.color = '#1A6FD4'; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#334155'; }}
                                >
                                  <Pencil size={12} />
                                  {isScheduled ? 'Modifier' : 'Éditer'}
                                </button>

                                {/* 2. Annuler (si programmée) */}
                                {isScheduled && (
                                  <button
                                    onClick={() => handleCancelCampaign(c)}
                                    title="Annuler cette programmation"
                                    style={{
                                      padding: '4px 8px',
                                      backgroundColor: '#FEF2F2',
                                      color: '#DC2626',
                                      border: '1px solid #FECACA',
                                      borderRadius: '5px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <X size={12} />
                                    Annuler
                                  </button>
                                )}

                                {/* 3. Renvoyer (si passée) */}
                                {!isScheduled && (
                                  <button
                                    onClick={() => handleResendCampaign(c)}
                                    title="Renvoyer cette notification à l'identique"
                                    style={{
                                      padding: '4px 8px',
                                      backgroundColor: '#EFF6FF',
                                      color: '#1A6FD4',
                                      border: '1px solid #BFDBFE',
                                      borderRadius: '5px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <RotateCcw size={12} />
                                    Renvoyer
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

              {/* Pagination compacte */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                fontSize: '12px'
              }}>
                <span style={{ color: '#64748B' }}>
                  Affichage de <strong>{meta.from || 0}</strong> à <strong>{meta.to || 0}</strong> sur <strong>{meta.total || 0}</strong> campagnes
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '5px',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      opacity: page <= 1 ? 0.5 : 1,
                      fontSize: '11.5px',
                      fontWeight: '600'
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span style={{ padding: '0 8px', fontWeight: '700', color: '#1E293B' }}>
                    {page} / {meta.last_page || 1}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page || 1, p + 1))}
                    disabled={page >= (meta.last_page || 1) || loading}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '5px',
                      cursor: page >= (meta.last_page || 1) ? 'not-allowed' : 'pointer',
                      opacity: page >= (meta.last_page || 1) ? 0.5 : 1,
                      fontSize: '11.5px',
                      fontWeight: '600'
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── Modal de Confirmation Élégant (Sans alert/confirm JS natifs) ── */}
        {modalConfig.isOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: modalConfig.type === 'danger' ? '#FEE2E2' : '#EFF6FF',
                    color: modalConfig.type === 'danger' ? '#DC2626' : '#1A6FD4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {modalConfig.type === 'danger' ? <AlertCircle size={22} /> : <Send size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
                      {modalConfig.title}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      {modalConfig.message}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '12px 20px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  disabled={modalConfig.loading}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {modalConfig.cancelText || 'Annuler'}
                </button>

                <button
                  type="button"
                  onClick={modalConfig.onConfirm}
                  disabled={modalConfig.loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: modalConfig.type === 'danger' ? '#DC2626' : '#1A6FD4',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    cursor: modalConfig.loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: modalConfig.type === 'danger' ? '0 2px 4px rgba(220, 38, 38, 0.2)' : '0 2px 4px rgba(26, 111, 212, 0.2)'
                  }}
                >
                  {modalConfig.loading && <RefreshCw size={13} className="animate-spin" />}
                  {modalConfig.confirmText || 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default NotificationsCenter;
