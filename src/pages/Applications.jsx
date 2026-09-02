import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  FileText, User, Briefcase, Calendar, Info, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, X, 
  AlertCircle, Clock, Phone, Mail, MapPin, Building2, 
  Sparkles, Video, Users, Check, RefreshCw, Send, 
  Globe, ExternalLink, Download, Search, Filter, 
  CalendarCheck, Award, MessageSquare, ChevronDown
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Helper d'extraction propre du titre de l'offre
const getOfferTitle = (jobOffer) => {
  if (!jobOffer) return 'Offre d\'emploi';
  if (jobOffer.title) return jobOffer.title;
  if (jobOffer.translations && jobOffer.translations.length > 0) {
    const fr = jobOffer.translations.find(t => t.locale === 'fr' || t.locale?.startsWith('fr'));
    if (fr?.title) return fr.title;
    return jobOffer.translations[0].title || 'Offre d\'emploi';
  }
  return 'Offre d\'emploi';
};

// Helper d'extraction propre du nom du candidat
const getCandidateName = (candidateProfile) => {
  if (!candidateProfile) return 'Candidat';
  const name = `${candidateProfile.first_name || ''} ${candidateProfile.last_name || ''}`.trim();
  if (name) return name;
  return candidateProfile.user?.display_name || candidateProfile.user?.name || candidateProfile.user?.phone || 'Candidat';
};

// Helper pour vérifier si le profil est féminin
const isFemaleCandidate = (candidateProfile) => {
  const g = (candidateProfile?.gender || candidateProfile?.sexe || '').toString().toLowerCase();
  return g === 'female' || g === 'femme' || g === 'f' || g === 'féminin' || g === 'feminin';
};

// Nettoyage et formatage grammatical sans parenthèses
const formatGenderedText = (text, isFemale = false) => {
  if (!text) return '';
  let str = String(text);
  if (isFemale) {
    str = str.replace(/([A-Za-zÀ-ÿ]+)eux\(se\)/gi, '$1euse');
    str = str.replace(/([A-Za-zÀ-ÿ]+)if\(ve\)/gi, '$1ive');
    str = str.replace(/([A-Za-zÀ-ÿ]+)el\(le\)/gi, '$1elle');
    str = str.replace(/([A-Za-zÀ-ÿ]+)te\(sse\)/gi, '$1tesse');
    str = str.replace(/([A-Za-zÀ-ÿ]+)o\(a\)/gi, '$1a');
    str = str.replace(/([A-Za-zÀ-ÿ]+)ó\(a\)/gi, '$1á');
    str = str.replace(/([A-Za-zÀ-ÿ]+)\(e\)/gi, '$1e');
    str = str.replace(/([A-Za-zÀ-ÿ]+)\(a\)/gi, '$1a');
    str = str.replace(/\b(u|U)n\(e\)\b/g, '$1ne');
    str = str.replace(/\bUN\(E\)\b/g, 'UNE');
    str = str.replace(/\b(l|L)e\/la\b/gi, (m, p1) => p1 === 'L' ? 'La' : 'la');
  } else {
    str = str.replace(/([A-Za-zÀ-ÿ]+)eux\(se\)/gi, '$1eux');
    str = str.replace(/([A-Za-zÀ-ÿ]+)if\(ve\)/gi, '$1if');
    str = str.replace(/([A-Za-zÀ-ÿ]+)el\(le\)/gi, '$1el');
    str = str.replace(/([A-Za-zÀ-ÿ]+)te\(sse\)/gi, '$1te');
    str = str.replace(/([A-Za-zÀ-ÿ]+)o\(a\)/gi, '$1o');
    str = str.replace(/([A-Za-zÀ-ÿ]+)ó\(a\)/gi, '$1ó');
    str = str.replace(/([A-Za-zÀ-ÿ]+)\(e\)/gi, '$1');
    str = str.replace(/([A-Za-zÀ-ÿ]+)\(a\)/gi, '$1');
    str = str.replace(/\b(u|U)n\(e\)\b/g, '$1n');
    str = str.replace(/\bUN\(E\)\b/g, 'UN');
    str = str.replace(/\b(l|L)e\/la\b/gi, (m, p1) => p1 === 'L' ? 'Le' : 'le');
  }
  return str;
};

// Formatage de la date en français
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Formatage date et heure
const formatDateTime = (dateStr) => {
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
  if (!dateStr) {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    now.setMinutes(0);
    now.setSeconds(0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ApplicationsPage = () => {
  const { can } = useAuth();
  const canEdit = can('edit', '/applications');
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    in_progress: 0,
    accepted: 0,
    rejected: 0,
    with_appointments: 0
  });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const location = useLocation();
  const getInitialStatus = () => {
    if (location.pathname.includes('/applications/by-status')) return 'in_progress';
    return 'all';
  };
  const [filterStatus, setFilterStatus] = useState(getInitialStatus());
  const [filterAppointment, setFilterAppointment] = useState('all'); // 'all', 'yes', 'no'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Système de Toasts flottants
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Formulaires
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
    duration_minutes: 30,
    location_type: 'online', // 'online', 'in_person', 'phone'
    location_address: '',
    meeting_link: '',
    notes: ''
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Debounce de recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Chargement des candidatures
  const fetchApplications = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        per_page: 15,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        has_appointment: filterAppointment !== 'all' ? filterAppointment : undefined,
        search: debouncedSearch.trim() || undefined
      };
      const res = await apiClient.get('/v1/admin/applications', { params });
      if (res.data?.status === 'success' || res.data?.data) {
        const payload = res.data.data;
        setApplications(payload.data || []);
        setMeta({
          current_page: payload.current_page,
          last_page: payload.last_page,
          total: payload.total,
          per_page: payload.per_page,
        });
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (error) {
      console.error('Erreur chargement candidatures', error);
      showToast('Impossible de charger les candidatures.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterAppointment, debouncedSearch, showToast]);

  useEffect(() => {
    fetchApplications(1);
    setPage(1);
  }, [fetchApplications]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (meta?.last_page || 1)) {
      setPage(newPage);
      fetchApplications(newPage);
    }
  };

  // 1. Ouvrir Modal de changement de statut
  const openStatusModal = (app) => {
    setSelectedApp(app);
    setStatusForm({
      status: app.status || 'submitted',
      note: app.status_note || ''
    });
    setShowStatusModal(true);
  };

  // Soumission statut
  const submitStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!selectedApp) return;
    setSubmittingStatus(true);
    try {
      const res = await apiClient.put(`/v1/admin/applications/${selectedApp.id}/status`, {
        status: statusForm.status,
        status_note: statusForm.note
      });
      if (res.data?.status === 'success') {
        const updated = res.data.data;
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updated } : a));
        if (selectedApp.id === updated.id) {
          setSelectedApp(prev => ({ ...prev, ...updated }));
        }
        setShowStatusModal(false);
        showToast('Statut mis à jour et candidat notifié avec succès !', 'success');
        fetchApplications(page);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de statut.', 'error');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // 2. Ouvrir Modal de programmation d'entretien
  const openScheduleModal = (app) => {
    setSelectedApp(app);
    const existing = app.latest_appointment || (app.appointments && app.appointments[0]);
    setScheduleForm({
      scheduled_at: existing ? formatToDatetimeLocal(existing.scheduled_at) : formatToDatetimeLocal(),
      duration_minutes: existing?.duration_minutes || 30,
      location_type: existing?.location_type || 'online',
      location_address: existing?.location_address || '',
      meeting_link: existing?.meeting_link || '',
      notes: existing?.notes || ''
    });
    setShowScheduleModal(true);
  };

  // Soumission programmation d'entretien
  const submitScheduleAppointment = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!scheduleForm.scheduled_at) {
      showToast("Veuillez sélectionner la date et l'heure de l'entretien.", 'error');
      return;
    }

    setSubmittingSchedule(true);
    try {
      const res = await apiClient.post(`/v1/admin/applications/${selectedApp.id}/appointments`, {
        scheduled_at: scheduleForm.scheduled_at,
        duration_minutes: Number(scheduleForm.duration_minutes),
        location_type: scheduleForm.location_type,
        location_address: scheduleForm.location_address.trim() || null,
        meeting_link: scheduleForm.meeting_link.trim() || null,
        notes: scheduleForm.notes.trim() || null,
      });

      if (res.data?.status === 'success') {
        const updated = res.data.data;
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updated } : a));
        if (selectedApp.id === updated.id) {
          setSelectedApp(prev => ({ ...prev, ...updated }));
        }
        setShowScheduleModal(false);
        showToast("Entretien programmé avec succès ! Notifications envoyées au candidat et à l'entreprise.", 'success');
        fetchApplications(page);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la programmation de l'entretien.", 'error');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // 3. Ouvrir vue détaillée
  const openDetailModal = async (app) => {
    setSelectedApp(app);
    setShowDetailModal(true);
    try {
      const res = await apiClient.get(`/v1/admin/applications/${app.id}`);
      if (res.data?.status === 'success') {
        setSelectedApp(res.data.data);
      }
    } catch {
      // Keep basic app
    }
  };

  // Badges de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return { label: 'Soumise', bg: '#F1F5F9', color: '#334155', border: '#E2E8F0', dot: '#94A3B8' };
      case 'in_progress':
        return { label: 'En cours / Entretien', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' };
      case 'accepted':
        return { label: 'Retenue / Acceptée', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' };
      case 'rejected':
        return { label: 'Non retenue', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' };
      default:
        return { label: 'Soumise', bg: '#F1F5F9', color: '#334155', border: '#E2E8F0', dot: '#94A3B8' };
    }
  };

  return (
    <MainLayout>
      {/* ── TOASTS FLOTTANTS MODERNES ── */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: t.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${t.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: t.type === 'success' ? '#065F46' : '#991B1B',
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {t.type === 'success' ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#DC2626" />}
            </div>
            <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.4', fontWeight: '600' }}>
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: t.type === 'success' ? '#047857' : '#B91C1C',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 'calc(100vh - 100px)' }}>
        
        {/* ── EN-TÊTE DE LA PAGE ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  Candidatures & Postulations
                </h1>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Suivez les dossiers des candidates, filtrez les offres et programmez des entretiens en direct.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchApplications(page)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* ── KPI / CARTES DE STATISTIQUES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>Total Candidatures</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                {Number(stats.total || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>Nouvelles / Soumises</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#475569' }}>
                {Number(stats.submitted || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>Entretiens Fixés / En cours</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#9333EA' }}>
                {Number(stats.with_appointments || stats.in_progress || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600' }}>Retenues / Acceptées</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                {Number(stats.accepted || 0).toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        {/* ── BARRE D'OUTILS ET FILTRES ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Recherche textuelle */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par candidate, téléphone, offre ou entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#F8FAFC',
                color: '#0F172A'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtres déroulants */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            
            {/* Statut */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="#64748B" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumises (Nouvelles)</option>
                <option value="in_progress">En cours / Entretien</option>
                <option value="accepted">Retenues / Acceptées</option>
                <option value="rejected">Non retenues</option>
              </select>
            </div>

            {/* Filtre Entretiens */}
            <select
              value={filterAppointment}
              onChange={(e) => setFilterAppointment(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Tous les rendez-vous</option>
              <option value="yes">📅 Entretien Programmé</option>
              <option value="no">Sans entretien fixé</option>
            </select>

          </div>
        </div>

        {/* ── TABLEAU PRINCIPAL DES CANDIDATURES (LIGNES ÉPURÉES & AÉRÉES) ── */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Candidat
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Offre d'Emploi
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Entreprise
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Paiement
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Statut
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#4F46E5' }} />
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Chargement des candidatures...</div>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                      <FileText size={32} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>Aucune candidature trouvée</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Ajustez vos filtres de recherche.</div>
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => {
                    const isFemale = isFemaleCandidate(app.candidate_profile);
                    const candName = getCandidateName(app.candidate_profile);
                    const rawOfferTitle = getOfferTitle(app.job_offer);
                    const offerTitle = formatGenderedText(rawOfferTitle, isFemale);
                    const compName = app.job_offer?.company?.company_name || 'SAMRE & Partenaires';
                    const badge = getStatusBadge(app.status);
                    const avatarUrl = app.candidate_profile?.user?.avatar_url || app.candidate_profile?.photo_url || null;

                    return (
                      <tr 
                        key={app.id}
                        onClick={() => openDetailModal(app)}
                        style={{ 
                          borderBottom: '1px solid #F1F5F9', 
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F8FAFC';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        {/* Candidat (1 ligne propre) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {avatarUrl ? (
                              <img 
                                src={avatarUrl} 
                                alt={candName}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '11.5px',
                                flexShrink: 0
                              }}>
                                {candName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                              {candName}
                            </span>
                          </div>
                        </td>

                        {/* Offre d'emploi (1 ligne propre) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#1E293B',
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={offerTitle}>
                            {offerTitle}
                          </div>
                        </td>

                        {/* Entreprise (1 ligne propre) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          <div style={{ 
                            fontSize: '12.5px', 
                            color: '#64748B',
                            maxWidth: '200px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={compName}>
                            {compName}
                          </div>
                        </td>

                        {/* Paiement (Badge simple) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          {app.is_paid ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FAF5FF',
                              border: '1px solid #E9D5FF',
                              color: '#7E22CE',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              Payant
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              Gratuit
                            </span>
                          )}
                        </td>

                        {/* Statut (Badge simple 1 ligne) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badge.dot || '#64748B'
                            }} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Date (1 ligne propre) */}
                        <td style={{ padding: '12px 18px', verticalAlign: 'middle', fontSize: '12.5px', color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatDate(app.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 18px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            
                            {/* Bouton Voir Détails */}
                            <button
                              onClick={() => openDetailModal(app)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Consulter le dossier complet et les détails"
                            >
                              <Eye size={13} />
                              <span>Détails</span>
                            </button>

                            {/* Bouton Programmer Entretien */}
                            {canEdit && (
                              <button
                                onClick={() => openScheduleModal(app)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 9px',
                                  borderRadius: '7px',
                                  backgroundColor: '#FAF5FF',
                                  border: '1px solid #E9D5FF',
                                  color: '#7E22CE',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Programmer ou modifier un entretien"
                              >
                                <Calendar size={12} />
                                <span>Entretien</span>
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

          {/* ── PAGINATION ── */}
          {meta && meta.last_page > 1 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              fontSize: '12px',
              color: '#64748B'
            }}>
              <div>
                Affichage de <strong style={{ color: '#0F172A' }}>{(meta.current_page - 1) * meta.per_page + 1}</strong> à <strong style={{ color: '#0F172A' }}>{Math.min(meta.current_page * meta.per_page, meta.total)}</strong> sur <strong style={{ color: '#0F172A' }}>{meta.total}</strong> candidatures
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    cursor: meta.current_page === 1 ? 'not-allowed' : 'pointer',
                    opacity: meta.current_page === 1 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontWeight: '700', color: '#0F172A', padding: '0 4px' }}>
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    cursor: meta.current_page === meta.last_page ? 'not-allowed' : 'pointer',
                    opacity: meta.current_page === meta.last_page ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1 : PROGRAMMATION D'ENTRETIEN (INTERVIEW SCHEDULING) ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showScheduleModal && selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}>
            {/* Header modal */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#FAF5FF',
              borderBottom: '1px solid #E9D5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#F3E8FF',
                  color: '#7E22CE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#581C87', margin: 0 }}>
                    Programmer un Entretien d'Embauche
                  </h3>
                  <p style={{ fontSize: '12px', color: '#7E22CE', margin: '2px 0 0 0' }}>
                    Le candidat et l'entreprise recevront directement une notification push.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7E22CE' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Récapitulatif Candidat & Offre */}
            <div style={{ padding: '12px 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>CANDIDATE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{getCandidateName(selectedApp.candidate_profile)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>OFFRE VISÉE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#4F46E5' }}>{getOfferTitle(selectedApp.job_offer)}</div>
              </div>
            </div>

            {/* Formulaire de programmation */}
            <form onSubmit={submitScheduleAppointment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Date et heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Date & Heure de l'entretien *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_at}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Durée estimée
                  </label>
                  <select
                    value={scheduleForm.duration_minutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A'
                    }}
                  >
                    <option value={15}>15 minutes (Entretien express)</option>
                    <option value={30}>30 minutes (Standard)</option>
                    <option value={45}>45 minutes (Détaillé)</option>
                    <option value={60}>1 heure (Complet)</option>
                    <option value={90}>1 heure 30 minutes</option>
                  </select>
                </div>
              </div>

              {/* Mode d'entretien */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Modalité de l'entretien *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${scheduleForm.location_type === 'online' ? '#7E22CE' : '#CBD5E1'}`,
                    backgroundColor: scheduleForm.location_type === 'online' ? '#FAF5FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: scheduleForm.location_type === 'online' ? '#7E22CE' : '#334155'
                  }}>
                    <input
                      type="radio"
                      name="location_type"
                      value="online"
                      checked={scheduleForm.location_type === 'online'}
                      onChange={() => setScheduleForm({ ...scheduleForm, location_type: 'online' })}
                      style={{ display: 'none' }}
                    />
                    <Video size={14} />
                    Visio / Meet
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${scheduleForm.location_type === 'in_person' ? '#7E22CE' : '#CBD5E1'}`,
                    backgroundColor: scheduleForm.location_type === 'in_person' ? '#FAF5FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: scheduleForm.location_type === 'in_person' ? '#7E22CE' : '#334155'
                  }}>
                    <input
                      type="radio"
                      name="location_type"
                      value="in_person"
                      checked={scheduleForm.location_type === 'in_person'}
                      onChange={() => setScheduleForm({ ...scheduleForm, location_type: 'in_person' })}
                      style={{ display: 'none' }}
                    />
                    <Building2 size={14} />
                    Présentiel
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${scheduleForm.location_type === 'phone' ? '#7E22CE' : '#CBD5E1'}`,
                    backgroundColor: scheduleForm.location_type === 'phone' ? '#FAF5FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: scheduleForm.location_type === 'phone' ? '#7E22CE' : '#334155'
                  }}>
                    <input
                      type="radio"
                      name="location_type"
                      value="phone"
                      checked={scheduleForm.location_type === 'phone'}
                      onChange={() => setScheduleForm({ ...scheduleForm, location_type: 'phone' })}
                      style={{ display: 'none' }}
                    />
                    <Phone size={14} />
                    Téléphone
                  </label>

                </div>
              </div>

              {/* Champ conditionnel selon le mode */}
              {scheduleForm.location_type === 'online' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Lien de Visioconférence (Google Meet, Zoom, Teams...)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    value={scheduleForm.meeting_link}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                  />
                </div>
              )}

              {scheduleForm.location_type === 'in_person' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Lieu / Adresse du rendez-vous
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Siège de l'entreprise, 2ème étage, Salle B"
                    value={scheduleForm.location_address}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location_address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                  />
                </div>
              )}

              {/* Instructions & Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Instructions & Consignes pour le candidat et le recruteur
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Se munir d'une pièce d'identité et de son book professionnel..."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    outline: 'none',
                    resize: 'vertical',
                    color: '#0F172A'
                  }}
                />
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#7E22CE',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submittingSchedule ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(126, 34, 206, 0.2)'
                  }}
                >
                  {submittingSchedule ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CalendarCheck size={14} />
                  )}
                  {submittingSchedule ? 'Programmation...' : 'Confirmer & Notifier'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2 : CHANGEMENT RAPIDE DE STATUT ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showStatusModal && selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1E40AF', margin: 0 }}>
                Changer le Statut de la Candidature
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitStatusChange} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Nouveau Statut
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'submitted', label: 'Soumise (Nouvelle candidature)', color: '#475569', bg: '#F1F5F9' },
                    { value: 'in_progress', label: 'En cours d\'examen / Entretien', color: '#1D4ED8', bg: '#EFF6FF' },
                    { value: 'accepted', label: 'Retenue / Acceptée', color: '#047857', bg: '#ECFDF5' },
                    { value: 'rejected', label: 'Non retenue / Rejetée', color: '#B91C1C', bg: '#FEF2F2' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1.5px solid ${statusForm.status === opt.value ? opt.color : '#E2E8F0'}`,
                        backgroundColor: statusForm.status === opt.value ? opt.bg : '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: statusForm.status === opt.value ? '700' : '500',
                        color: opt.color
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>{opt.label}</span>
                      <input
                        type="radio"
                        name="status"
                        value={opt.value}
                        checked={statusForm.status === opt.value}
                        onChange={() => setStatusForm({ ...statusForm, status: opt.value })}
                        style={{ display: 'none' }}
                      />
                      {statusForm.status === opt.value && <Check size={16} />}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Note explicative (visible par l'admin et transmise dans la notif)
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Profil retenu pour la phase d'entretien technique..."
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    outline: 'none',
                    color: '#0F172A'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submittingStatus ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submittingStatus ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3 : DOSSIER COMPLET DU CANDIDAT & CV ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showDetailModal && selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Dossier de Candidature #{selectedApp.id}</span>
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Déposée le {formatDateTime(selectedApp.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ 
                  background: '#F1F5F9', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#64748B',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps du dossier bien organisé */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Statuts & Paiement résumés */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Statut actuel :</span>
                  {(() => {
                    const b = getStatusBadge(selectedApp.status);
                    return (
                      <span style={{
                        backgroundColor: b.bg,
                        color: b.color,
                        border: `1px solid ${b.border}`,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: b.dot || '#64748B' }} />
                        {b.label}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Paiement :</span>
                  {selectedApp.is_paid ? (
                    <span style={{
                      backgroundColor: '#FAF5FF',
                      border: '1px solid #E9D5FF',
                      color: '#7E22CE',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={12} />
                      Payant (1 500 F)
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#64748B',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700'
                    }}>
                      Quota Gratuit
                    </span>
                  )}
                </div>
              </div>

              {/* 1. Carte Candidat */}
              {(() => {
                const isFem = isFemaleCandidate(selectedApp.candidate_profile);
                const cName = getCandidateName(selectedApp.candidate_profile);
                const rawProf = selectedApp.candidate_profile?.profession || selectedApp.candidate_profile?.job_title || '';
                const cProf = formatGenderedText(rawProf, isFem);
                const cAvatar = selectedApp.candidate_profile?.user?.avatar_url || selectedApp.candidate_profile?.photo_url || null;
                const phone = selectedApp.candidate_profile?.user?.phone || selectedApp.candidate_profile?.phone || null;
                const email = selectedApp.candidate_profile?.user?.email || null;

                return (
                  <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      <span>Profil du Candidat</span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {cAvatar ? (
                        <img 
                          src={cAvatar} 
                          alt={cName} 
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EEF2FF', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '15px',
                          flexShrink: 0
                        }}>
                          {cName.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cName}</span>
                          {selectedApp.candidate_profile?.has_badge && (
                            <span style={{ fontSize: '10.5px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '1px 7px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Award size={11} />
                              Profil Vérifié
                            </span>
                          )}
                        </div>

                        {cProf && (
                          <div style={{ fontSize: '12px', color: '#4338CA', fontWeight: '700', marginTop: '2px' }}>
                            {cProf}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#475569' }}>
                          {phone && (
                            <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', textDecoration: 'none', fontWeight: '600' }}>
                              <Phone size={13} color="#64748B" />
                              <span>{phone}</span>
                            </a>
                          )}
                          {email && (
                            <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', textDecoration: 'none', fontWeight: '600' }}>
                              <Mail size={13} color="#64748B" />
                              <span>{email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Carte Offre & Entreprise */}
              {(() => {
                const isFem = isFemaleCandidate(selectedApp.candidate_profile);
                const rawTitle = getOfferTitle(selectedApp.job_offer);
                const oTitle = formatGenderedText(rawTitle, isFem);
                const cName = selectedApp.job_offer?.company?.company_name || 'SAMRE Global';
                const isInt = Boolean(selectedApp.job_offer?.is_international || selectedApp.job_offer?.country_id);

                return (
                  <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={14} />
                      <span>Poste & Entreprise</span>
                    </div>

                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#1E3A8A', lineHeight: 1.4 }}>
                      {oTitle}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {isInt && (
                        <span style={{ fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#1D4ED8', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Globe size={11} />
                          Offre Internationale
                        </span>
                      )}
                      {selectedApp.job_offer?.contract_type && (
                        <span style={{ fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#334155', fontWeight: '700', border: '1px solid #CBD5E1', textTransform: 'uppercase' }}>
                          {selectedApp.job_offer.contract_type}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#1E40AF', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={13} color="#3B82F6" />
                      <span style={{ fontWeight: '600' }}>{cName}</span>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Lettre de motivation */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} color="#64748B" />
                  <span>Lettre de Motivation / Message du Candidat</span>
                </div>
                {selectedApp.cover_letter ? (
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#334155',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedApp.cover_letter}
                  </div>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                    Aucune lettre de motivation rédigée pour cette candidature.
                  </div>
                )}
              </div>

              {/* 4. CV ou Document joint */}
              {selectedApp.cover_letter_file && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Document Joint (CV / Lettre)
                  </div>
                  <a
                    href={selectedApp.cover_letter_file}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#1E293B',
                      fontSize: '13px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Download size={15} color="#4F46E5" />
                    <span>Consulter / Télécharger le CV</span>
                    <ExternalLink size={13} color="#94A3B8" />
                  </a>
                </div>
              )}

              {/* 5. Entretien d'Embauche */}
              {selectedApp.latest_appointment ? (
                <div style={{ padding: '16px', backgroundColor: '#FAF5FF', borderRadius: '10px', border: '1px solid #E9D5FF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: '800', color: '#7E22CE' }}>
                      <CalendarCheck size={16} />
                      <span>Entretien d'Embauche Programmé</span>
                    </div>
                    <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                      {selectedApp.latest_appointment.location_type === 'video' || selectedApp.latest_appointment.location_type === 'online' ? 'Visioconférence' : selectedApp.latest_appointment.location_type === 'phone' ? 'Téléphonique' : 'Présentiel'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', color: '#581C87' }}>
                    <div>
                      <strong style={{ color: '#3B0764' }}>Date & Heure :</strong> {formatDateTime(selectedApp.latest_appointment.scheduled_at)}
                    </div>
                    <div>
                      <strong style={{ color: '#3B0764' }}>Durée prévue :</strong> {selectedApp.latest_appointment.duration_minutes} minutes
                    </div>
                  </div>

                  {selectedApp.latest_appointment.meeting_link && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', color: '#7E22CE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                        <strong>Lien :</strong> {selectedApp.latest_appointment.meeting_link}
                      </div>
                      <a 
                        href={selectedApp.latest_appointment.meeting_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ padding: '4px 10px', backgroundColor: '#7E22CE', color: '#FFFFFF', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', textDecoration: 'none' }}
                      >
                        Rejoindre
                      </a>
                    </div>
                  )}

                  {selectedApp.latest_appointment.location_address && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#581C87' }}>
                      <strong style={{ color: '#3B0764' }}>Lieu :</strong> {selectedApp.latest_appointment.location_address}
                    </div>
                  )}

                  {selectedApp.latest_appointment.notes && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B21A8', fontStyle: 'italic' }}>
                      <strong>Consignes :</strong> {selectedApp.latest_appointment.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                    Aucun entretien n'a encore été programmé pour cette candidature.
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openScheduleModal(selectedApp);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      backgroundColor: '#FAF5FF',
                      border: '1px solid #E9D5FF',
                      color: '#7E22CE',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Calendar size={13} />
                    <span>Programmer maintenant</span>
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer avec actions rapides */}
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {canEdit && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openScheduleModal(selectedApp);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#7E22CE',
                        color: '#FFFFFF',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <Calendar size={14} />
                      <span>{selectedApp.latest_appointment ? 'Modifier l\'entretien' : 'Programmer un Entretien'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openStatusModal(selectedApp);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        borderRadius: '7px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Changer le statut</span>
                      <ChevronDown size={13} />
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
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
