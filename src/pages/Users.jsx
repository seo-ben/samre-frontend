import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';
import {
  Search, Users, UserCheck, Building2, UserX,
  Clock, ShieldAlert, ArrowRight, ArrowLeft, Eye,
  Lock, Unlock, Trash2, X, FileText, MapPin, Globe,
  Briefcase, Activity, Landmark, Edit, Save, Printer,
  Camera, ImageIcon, User
} from 'lucide-react';

const staticCountries = [
  { id: 1, name: 'Togo', code: 'TG' },
  { id: 2, name: 'Bénin', code: 'BJ' },
  { id: 3, name: 'Burkina Faso', code: 'BF' },
  { id: 4, name: 'Côte d\'Ivoire', code: 'CI' },
  { id: 5, name: 'Niger', code: 'NE' },
  { id: 6, name: 'Sénégal', code: 'SN' }
];

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }
  
  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats rapides
  const [stats, setStats] = useState({
    total: 0,
    candidates: 0,
    companies: 0,
    visitors: 0,
    pending: 0,
    suspended: 0
  });

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, candidate, company, visitor, pending, suspended

  // Modal détails
  const { user: currentAdmin } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', message: '', targetId: null });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const canEdit = currentAdmin?.role === 'super_admin' || currentAdmin?.permissions?.includes('users.update');
  const canSuspend = currentAdmin?.role === 'super_admin' || currentAdmin?.permissions?.includes('users.suspend');
  const canDelete = currentAdmin?.role === 'super_admin' || currentAdmin?.permissions?.includes('users.delete');

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: '#ffffff',
    border: '1px solid var(--gray-border)',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-inter)',
    color: '#0f172a',
    outline: 'none',
    marginTop: '4px',
    boxSizing: 'border-box'
  };

  const textareaStyle = {
    width: '100%',
    height: '80px',
    padding: '8px 12px',
    background: '#ffffff',
    border: '1px solid var(--gray-border)',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-inter)',
    color: '#0f172a',
    outline: 'none',
    marginTop: '4px',
    resize: 'none',
    boxSizing: 'border-box'
  };

  // Charger les stats globales (depuis le dashboard ou calculées)
  const fetchGlobalStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/v1/admin/dashboard');
      const d = data.data;
      setStats({
        total: d.users_count || 0,
        candidates: d.candidates_count || 0,
        companies: d.companies_count || 0,
        visitors: d.visitors_count || 0,
        pending: d.users_count_pending || 0,
        suspended: d.users_count_suspended || 0
      });
    } catch {
      // Ignorer ou fallback silencieux
    }
  }, []);

  // Fetch des utilisateurs paginés et filtrés
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (search) params.search = search;

      // Déduire le type ou statut selon l'onglet actif ou les dropdowns
      let type = selectedType;
      let status = selectedStatus;

      if (activeTab === 'candidate') type = 'candidate';
      else if (activeTab === 'company') type = 'company';
      else if (activeTab === 'visitor') type = 'visitor';
      else if (activeTab === 'pending') status = 'pending';
      else if (activeTab === 'suspended') status = 'suspended';

      if (type) params.user_type = type;
      if (status) params.status = status;

      const { data } = await apiClient.get('/v1/admin/users', { params });
      
      // Axios paginated response mapping
      const normalizedUsers = (data.data || []).map(u => ({
        ...u,
        candidateProfile: u.candidate_profile || u.candidateProfile,
        companyProfile: u.company_profile || u.companyProfile,
        visitorProfile: u.visitor_profile || u.visitorProfile,
        adminStaffProfile: u.admin_staff_profile || u.adminStaffProfile
      }));
      setUsers(normalizedUsers);
      setPage(data.meta?.current_page ?? 1);
      setLastPage(data.meta?.last_page ?? 1);
      setTotal(data.meta?.total ?? 0);
    } catch (err) {
      setError('Impossible de charger la liste des utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedType, selectedStatus, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchGlobalStats();
    
    // Charger toutes les listes de contenu pour l'édition et l'affichage
    const loadAllContent = async () => {
      try {
        const cacheBuster = `_t=${Date.now()}`;
        const [resCountries, resRegions, resPrefectures, resCommunes] = await Promise.all([
          apiClient.get(`/v1/content/countries?${cacheBuster}`),
          apiClient.get(`/v1/content/regions?${cacheBuster}`),
          apiClient.get(`/v1/content/prefectures?${cacheBuster}`),
          apiClient.get(`/v1/content/communes?${cacheBuster}`)
        ]);
        
        // Helper to extract data from any response format
        const extractData = (res) => {
          let data = res?.data?.data || [];
          
          if (Array.isArray(data)) return data;
          
          if (typeof data === 'object' && data !== null) {
            // Check for common array patterns inside objects
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.values)) return data.values;
            
            // If it's a plain object with numeric keys
            const keys = Object.keys(data);
            if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
              return Object.values(data);
            }
            
            // If it looks like it has ID properties as values
            const values = Object.values(data);
            if (values.length > 0 && typeof values[0] === 'object' && values[0]?.id) {
              return values;
            }
          }
          
          return [];
        };
        
        setCountries(extractData(resCountries));
        setRegions(extractData(resRegions));
        setPrefectures(extractData(resPrefectures));
        setCommunes(extractData(resCommunes));
      } catch (err) {
        console.error('Error loading content:', err);
      }
    };
    loadAllContent();
  }, [fetchGlobalStats]);

  // Réinitialiser la page lors d'un changement de filtre
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Actions de suspension / réactivation
  const handleSuspend = (userId) => {
    setConfirmModal({
      isOpen: true,
      type: 'suspend',
      message: 'Êtes-vous sûr de vouloir suspendre cet utilisateur ?',
      targetId: userId
    });
  };

  const executeSuspend = async (userId) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/v1/admin/users/${userId}/suspend`);
      fetchUsers();
      fetchGlobalStats();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, status: 'suspended' }));
      }
      showToast('Utilisateur suspendu avec succès.', 'success');
    } catch {
      showToast('Une erreur est survenue lors de la suspension.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = (userId) => {
    setConfirmModal({
      isOpen: true,
      type: 'reactivate',
      message: 'Êtes-vous sûr de vouloir activer ce compte ?',
      targetId: userId
    });
  };

  const executeReactivate = async (userId) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/v1/admin/users/${userId}/reactivate`);
      fetchUsers();
      fetchGlobalStats();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, status: 'active' }));
      }
      showToast('Compte utilisateur réactivé avec succès.', 'success');
    } catch {
      showToast("Une erreur est survenue lors de l'activation.", 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (userId) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      message: 'ATTENTION: Cette action va supprimer définitivement cet utilisateur. Continuer ?',
      targetId: userId
    });
  };

  const executeDelete = async (userId) => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/v1/admin/users/${userId}`);
      setShowModal(false);
      fetchUsers();
      fetchGlobalStats();
      showToast('Utilisateur supprimé définitivement.', 'success');
    } catch {
      showToast('Une erreur est survenue lors de la suppression.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmAction = async () => {
    const { type, targetId } = confirmModal;
    setConfirmModal({ isOpen: false, type: '', message: '', targetId: null });
    
    if (type === 'suspend') {
      await executeSuspend(targetId);
    } else if (type === 'reactivate') {
      await executeReactivate(targetId);
    } else if (type === 'delete') {
      await executeDelete(targetId);
    }
  };

  const openUserDetails = (user) => {
    const normalizedUser = {
      ...user,
      candidateProfile: user.candidate_profile || user.candidateProfile,
      companyProfile: user.company_profile || user.companyProfile,
      visitorProfile: user.visitor_profile || user.visitorProfile,
      adminStaffProfile: user.admin_staff_profile || user.adminStaffProfile
    };
    setSelectedUser(normalizedUser);
    setIsEditing(false);
    setShowModal(true);
  };

  const getCountryName = (id) => {
    const found = countries.find(c => String(c.id) === String(id));
    if (found) {
      if (found.name) return found.name;
      if (found.translations && found.translations.length > 0) {
        return found.translations[0]?.name || found.translations.find(t => t.language_id === 1)?.name || found.code;
      }
    }
    const fallbackMap = {
      '1': 'Togo',
      '2': 'Bénin',
      '3': 'Burkina Faso',
      '4': 'Côte d\'Ivoire',
      '5': 'Niger',
      '6': 'Sénégal'
    };
    return fallbackMap[String(id)] || id || '—';
  };

  const getCountryCode = (id) => {
    const found = countries.find(c => String(c.id) === String(id));
    if (found?.code) return found.code;
    const fallbackMap = {
      '1': 'TG',
      '2': 'BJ',
      '3': 'BF',
      '4': 'CI',
      '5': 'NE',
      '6': 'SN'
    };
    return fallbackMap[String(id)] || id || '—';
  };
  const getRegionName = (id) => { const r = regions.find(r => String(r.id) === String(id)); return r ? (r.translations?.[0]?.name || r.name || id) : (id || '—'); };
  const getPrefectureName = (id) => { const p = prefectures.find(p => String(p.id) === String(id)); return p ? (p.translations?.[0]?.name || p.name || id) : (id || '—'); };
  const getCommuneName = (id) => { const c = communes.find(c => String(c.id) === String(id)); return c ? (c.translations?.[0]?.name || c.name || id) : (id || '—'); };

  const startEditing = () => {
    if (!selectedUser) return;
    const usr = selectedUser;
    const form = {
      email: usr.email || '',
      phone: usr.phone || '',
      country_id: usr.country_id || '',
      status: usr.status || 'active',
    };

    if (usr.user_type === 'candidate') {
      const prof = usr.candidateProfile || {};
      form.first_name = prof.first_name || '';
      form.last_name = prof.last_name || '';
      form.birth_date = prof.birth_date ? prof.birth_date.substring(0, 10) : '';
      form.gender = prof.gender || 'unspecified';
      form.bio = prof.bio || '';
      form.has_transport = !!prof.has_transport;
      form.transport_type = prof.transport_type || '';
      form.is_hired = !!prof.is_hired;
      form.hired_at = prof.hired_at ? prof.hired_at.substring(0, 10) : '';
      form.has_badge = !!prof.has_badge;
      form.badge_granted_at = prof.badge_granted_at ? prof.badge_granted_at.substring(0, 19).replace('T', ' ') : '';
      form.prefecture_id = prof.prefecture_id || '';
      form.region_id = form.prefecture_id ? (prefectures.find(p => String(p.id) === String(form.prefecture_id))?.region_id || '') : '';
      form.commune_id = prof.commune_id || '';
      form.latitude = prof.latitude || '';
      form.longitude = prof.longitude || '';
    } else if (usr.user_type === 'company') {
      const prof = usr.companyProfile || {};
      form.company_name = prof.company_name || '';
      form.sector = prof.sector || '';
      form.employee_count_range = prof.employee_count_range || '';
      form.address = prof.address || '';
      form.website_url = prof.website_url || '';
      form.is_viable = !!prof.is_viable;
      form.profile_email = prof.email || '';
      form.description = prof.description || '';
      form.has_badge = !!prof.has_badge;
      form.badge_granted_at = prof.badge_granted_at ? prof.badge_granted_at.substring(0, 19).replace('T', ' ') : '';
      form.prefecture_id = prof.prefecture_id || '';
      form.region_id = form.prefecture_id ? (prefectures.find(p => String(p.id) === String(form.prefecture_id))?.region_id || '') : '';
      form.commune_id = prof.commune_id || '';
      form.latitude = prof.latitude || '';
      form.longitude = prof.longitude || '';
    } else if (usr.user_type === 'visitor') {
      const prof = usr.visitorProfile || {};
      form.first_name = prof.first_name || '';
      form.last_name = prof.last_name || '';
      form.profile_email = prof.email || '';
      form.interests = Array.isArray(prof.interests) ? prof.interests.join(', ') : '';
      form.region_id = prof.region_id || '';
      form.prefecture_id = prof.prefecture_id || '';
      form.commune_id = prof.commune_id || '';
    }

    setEditForm(form);
    setIsEditing(true);
  };

  const handleSaveUser = async () => {
    setActionLoading(true);
    try {
      const data = {
        email: editForm.email || null,
        phone: editForm.phone,
        country_id: Number(editForm.country_id),
        status: editForm.status,
      };

      if (selectedUser.user_type === 'candidate') {
        data.first_name = editForm.first_name || null;
        data.last_name = editForm.last_name || null;
        data.birth_date = editForm.birth_date || null;
        data.gender = editForm.gender;
        data.bio = editForm.bio || null;
        data.has_transport = editForm.has_transport ? 1 : 0;
        data.transport_type = editForm.transport_type || null;
        data.is_hired = editForm.is_hired ? 1 : 0;
        data.hired_at = editForm.hired_at || null;
        data.has_badge = editForm.has_badge ? 1 : 0;
        data.badge_granted_at = editForm.badge_granted_at || null;
        data.prefecture_id = editForm.prefecture_id ? Number(editForm.prefecture_id) : null;
        data.commune_id = editForm.commune_id ? Number(editForm.commune_id) : null;
        data.latitude = editForm.latitude ? Number(editForm.latitude) : null;
        data.longitude = editForm.longitude ? Number(editForm.longitude) : null;
      } else if (selectedUser.user_type === 'company') {
        data.company_name = editForm.company_name || null;
        data.sector = editForm.sector || null;
        data.employee_count_range = editForm.employee_count_range || null;
        data.address = editForm.address || null;
        data.website_url = editForm.website_url || null;
        data.is_viable = editForm.is_viable ? 1 : 0;
        data.description = editForm.description || null;
        data.profile_email = editForm.profile_email || null;
        data.has_badge = editForm.has_badge ? 1 : 0;
        data.badge_granted_at = editForm.badge_granted_at || null;
        data.prefecture_id = editForm.prefecture_id ? Number(editForm.prefecture_id) : null;
        data.commune_id = editForm.commune_id ? Number(editForm.commune_id) : null;
        data.latitude = editForm.latitude ? Number(editForm.latitude) : null;
        data.longitude = editForm.longitude ? Number(editForm.longitude) : null;
      } else if (selectedUser.user_type === 'visitor') {
        data.first_name = editForm.first_name || null;
        data.last_name = editForm.last_name || null;
        data.profile_email = editForm.profile_email || null;
        data.region_id = editForm.region_id ? Number(editForm.region_id) : null;
        data.prefecture_id = editForm.prefecture_id ? Number(editForm.prefecture_id) : null;
        data.commune_id = editForm.commune_id ? Number(editForm.commune_id) : null;
        data.interests = editForm.interests
          ? editForm.interests.split(',').map(s => s.trim()).filter(Boolean)
          : [];
      }

      const res = await apiClient.put(`/v1/admin/users/${selectedUser.id}`, data);
      const updatedUser = res.data.data;
      const normalizedUser = {
        ...updatedUser,
        candidateProfile: updatedUser.candidate_profile || updatedUser.candidateProfile,
        companyProfile: updatedUser.company_profile || updatedUser.companyProfile,
        visitorProfile: updatedUser.visitor_profile || updatedUser.visitorProfile,
        adminStaffProfile: updatedUser.admin_staff_profile || updatedUser.adminStaffProfile
      };
      
      setSelectedUser(normalizedUser);
      setUsers(prev => prev.map(u => u.id === normalizedUser.id ? normalizedUser : u));
      setIsEditing(false);
      fetchGlobalStats();
      showToast('Utilisateur mis à jour avec succès.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderField = (label, val, fallback = 'Non renseigné(e)') => {
    const displayVal = val !== undefined && val !== null && String(val).trim() !== '' ? val : fallback;
    const isEmpty = displayVal === fallback || displayVal === 'Non renseigné(e)' || displayVal === 'Non renseignée' || displayVal === 'Non renseigné' || displayVal === '—';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>{label}</span>
        <span style={{ fontSize: '13.5px', color: isEmpty ? 'var(--gray-medium)' : 'var(--black-deep)', fontWeight: '600', fontStyle: isEmpty ? 'italic' : 'normal', textAlign: 'right' }}>
          {displayVal}
        </span>
      </div>
    );
  };

  const renderDetailRow = (label, val) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray-medium)', fontWeight: '500' }}>{label}</span>
        <span style={{ fontSize: '13.5px', color: 'var(--black-deep)', fontWeight: '600', textAlign: 'right' }}>
          {val}
        </span>
      </div>
    );
  };

  const safeFormatDate = (dateStr, options = null, fallback = '—') => {
    if (!dateStr) return fallback;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    try {
      if (options) {
        return d.toLocaleDateString('fr-FR', options);
      }
      return d.toLocaleDateString('fr-FR');
    } catch {
      return fallback;
    }
  };

  const safeFormatDateTime = (dateStr, fallback = 'Jamais') => {
    if (!dateStr) return fallback;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    try {
      return d.toLocaleString('fr-FR');
    } catch {
      return fallback;
    }
  };

  const getUserDisplayName = (usr) => {
    if (!usr) return '';
    let name = '';
    if (usr.user_type === 'candidate' && usr.candidateProfile) {
      name = `${usr.candidateProfile.first_name ?? ''} ${usr.candidateProfile.last_name ?? ''}`.trim();
    } else if (usr.user_type === 'company' && usr.companyProfile) {
      name = (usr.companyProfile.company_name ?? '').trim();
    } else if (usr.user_type === 'visitor' && usr.visitorProfile) {
      name = `${usr.visitorProfile.first_name ?? ''} ${usr.visitorProfile.last_name ?? ''}`.trim();
    } else if (usr.user_type === 'admin_staff' && usr.adminStaffProfile) {
      name = `${usr.adminStaffProfile.first_name ?? ''} ${usr.adminStaffProfile.last_name ?? ''}`.trim();
    }

    if (name) return name;

    if (usr.user_type === 'candidate') return 'Candidat';
    if (usr.user_type === 'company') return 'Entrepreneur';
    if (usr.user_type === 'visitor') return 'Visiteur';
    if (usr.user_type === 'admin_staff') return 'Admin Staff';
    return 'Utilisateur';
  };

  const getUserInitials = (usr) => {
    if (!usr) return 'US';
    if (usr.user_type === 'candidate' && usr.candidateProfile) {
      return `${usr.candidateProfile.first_name?.[0] ?? ''}${usr.candidateProfile.last_name?.[0] ?? ''}`.toUpperCase() || 'CA';
    }
    if (usr.user_type === 'company' && usr.companyProfile) {
      return usr.companyProfile.company_name?.[0]?.toUpperCase() || 'EN';
    }
    if (usr.user_type === 'visitor' && usr.visitorProfile) {
      return `${usr.visitorProfile.first_name?.[0] ?? ''}${usr.visitorProfile.last_name?.[0] ?? ''}`.toUpperCase() || 'VI';
    }
    return 'US';
  };

  const generateUserPdf = async (usr) => {
    try {
      const response = await apiClient.get(`/v1/admin/users/${usr.id}/pdf`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      // When server returns an error with responseType='blob', we need to read the blob to get the message
      let message = "Impossible de générer le PDF. Veuillez réessayer.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          // keep default message
        }
      } else {
        message = err.response?.data?.message || message;
      }
      console.error("Erreur lors de la génération du PDF :", err);
      showToast(message, 'error');
    }
  };

  // Formatage des rôles et statuts
  const getTypeBadge = (type) => {
    const badges = {
      candidate: { label: 'Candidat', bg: '#eef2ff', color: '#4f46e5' },
      company: { label: 'Entreprise', bg: '#ecfdf5', color: '#059669' },
      visitor: { label: 'Visiteur', bg: '#f0fdfa', color: '#0d9488' },
      admin_staff: { label: 'Admin Staff', bg: '#fff7ed', color: '#ea580c' }
    };
    const b = badges[type] ?? { label: type, bg: '#f3f4f6', color: '#374151' };
    return (
      <span style={{
        padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
        background: b.bg, color: b.color, display: 'inline-block'
      }}>
        {b.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Actif', bg: '#ecfdf5', color: '#059669' },
      pending: { label: 'En attente', bg: '#fffbeb', color: '#d97706' },
      suspended: { label: 'Suspendu', bg: '#fef2f2', color: '#dc2626' },
      deleted: { label: 'Supprimé', bg: '#f3f4f6', color: '#9ca3af' }
    };
    const b = badges[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
    return (
      <span style={{
        padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
        background: b.bg, color: b.color, textTransform: 'uppercase', letterSpacing: '0.03em'
      }}>
        {b.label}
      </span>
    );
  };

  return (
    <MainLayout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(120%) scale(0.95); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Premium Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '12px',
            background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'var(--font-inter)',
            animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            maxWidth: '380px',
            border: toast.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {toast.type === 'success' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}>
              <UserCheck size={18} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}>
              <ShieldAlert size={18} />
            </div>
          )}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumbs & Title */}
      <div style={{ marginBottom: '28px', animation: 'fadeIn 0.2s ease-out' }}>
        
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)' }}>
          Gestion des Utilisateurs
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
          Supervisez tous les profils inscrits sur SAMRE (Candidats, Entreprises et Visiteurs).
        </p>
      </div>

      {/* Bar des statistiques rapides */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: '12px',
        marginBottom: '28px',
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {[
          { label: 'Utilisateurs', value: total, icon: Users, color: '#0052ff' },
          { label: 'Candidats', value: stats.candidates, icon: UserCheck, color: '#4f46e5' },
          { label: 'Entreprises', value: stats.companies, icon: Building2, color: '#059669' },
          { label: 'Visiteurs', value: stats.visitors, icon: Globe, color: '#0d9488' },
          { label: 'En attente', value: stats.pending, icon: Clock, color: '#d97706' },
          { label: 'Suspendus', value: stats.suspended, icon: UserX, color: '#dc2626' }
        ].map((s, idx) => (
          <div key={idx} style={{
            background: '#ffffff', border: '1px solid var(--gray-border)', borderRadius: '12px',
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '500' }}>{s.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '700', color: 'var(--black-deep)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Zone de filtres et d'onglets */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--gray-border)', borderRadius: '12px 12px 0 0',
        padding: '20px 24px 0 24px', borderBottom: 'none', animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Ligne filtres */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--gray-medium)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '10px 16px 10px 38px', borderRadius: '8px',
                border: '1px solid var(--gray-border)', background: 'var(--gray-light)',
                fontSize: '13.5px', outline: 'none', fontFamily: 'var(--font-inter)', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sélections supplémentaires */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={selectedType}
              onChange={e => { setSelectedType(e.target.value); setPage(1); }}
              style={{
                padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                background: '#ffffff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="">Tous les types</option>
              <option value="candidate">Candidats</option>
              <option value="company">Entreprises</option>
              <option value="visitor">Visiteurs</option>
              <option value="admin_staff">Staff Admin</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
              style={{
                padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                background: '#ffffff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>

        {/* Tabs de filtres */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--gray-border)', overflowX: 'auto', paddingBottom: '1px' }}>
          {[
            { id: 'all', label: 'Tous', icon: Users },
            { id: 'candidate', label: 'Candidats', icon: UserCheck },
            { id: 'company', label: 'Entreprises', icon: Building2 },
            { id: 'visitor', label: 'Visiteurs', icon: Globe },
            { id: 'pending', label: 'En attente', icon: Clock },
            { id: 'suspended', label: 'Suspendus', icon: UserX }
          ].map(t => {
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 18px', border: 'none', background: 'transparent',
                  borderBottom: isSel ? '2px solid #0052ff' : '2px solid transparent',
                  color: isSel ? '#0052ff' : 'var(--gray-medium)',
                  fontSize: '13.5px', fontWeight: isSel ? '600' : '500',
                  cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap'
                }}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteneur principal Table */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--gray-border)', borderRadius: '0 0 12px 12px',
        padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', marginBottom: '24px',
        animation: 'fadeIn 0.35s ease-out'
      }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--gray-medium)' }}>
            <Activity size={32} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Chargement de la liste des utilisateurs...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--danger)' }}>
            <ShieldAlert size={32} style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--gray-medium)' }}>
            <Users size={36} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Aucun utilisateur ne correspond à ces critères.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-inter)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-border)' }}>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Utilisateur</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Statut</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Complétude</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase' }}>Inscription</th>
                    <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-medium)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const initials = getUserInitials(user);
                    const name = getUserDisplayName(user);

                    const isComplete = user.is_profile_complete;
                    // Get the actual computed completeness score from the profile
                    const completenessScore = user.user_type === 'candidate'
                      ? (user.candidateProfile?.completeness_score ?? 0)
                      : user.user_type === 'company'
                        ? (user.companyProfile?.completeness_score ?? 0)
                        : null; // visitors don't have a completeness score
                    
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--gray-border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        
                        {/* Utilisateur */}
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {user.user_type === 'candidate' ? (
                              user.candidateProfile?.profile_photo_url ? (
                                <img
                                  src={user.candidateProfile.profile_photo_url}
                                  alt="Photo"
                                  style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    objectFit: 'cover', border: '1px solid var(--gray-border)'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '38px', height: '38px', borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <User size={18} color="#ffffff" />
                                </div>
                              )
                            ) : user.user_type === 'company' ? (
                              user.companyProfile?.logo_url ? (
                                <img
                                  src={user.companyProfile.logo_url}
                                  alt="Logo"
                                  style={{
                                    width: '38px', height: '38px', borderRadius: '10px',
                                    objectFit: 'cover', border: '1px solid var(--gray-border)'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '38px', height: '38px', borderRadius: '10px',
                                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <Building2 size={18} color="#ffffff" />
                                </div>
                              )
                            ) : (
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1A6FD4, #0052ff)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: '700', color: '#ffffff'
                              }}>
                                {initials}
                              </div>
                            )}
                            <div>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--black-deep)', display: 'block' }}>{name}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ fontSize: '13.5px', color: 'var(--black-deep)', display: 'block' }}>{user.email || '—'}</span>
                          <span style={{ fontSize: '12px', color: 'var(--gray-medium)', display: 'block' }}>{user.phone}</span>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '14px 12px' }}>
                          {getTypeBadge(user.user_type)}
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '14px 12px' }}>
                          {getStatusBadge(user.status)}
                        </td>

                        {/* Complétude */}
                        <td style={{ padding: '14px 12px' }}>
                          {completenessScore === null ? (
                            <span style={{ fontSize: '12px', color: 'var(--gray-medium)' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, minWidth: '60px', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${completenessScore}%`,
                                  height: '100%',
                                  background: completenessScore >= 80 ? '#10b981' : completenessScore >= 40 ? '#f59e0b' : '#ef4444',
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '12px', fontWeight: '600', minWidth: '34px',
                                color: completenessScore >= 80 ? '#059669' : completenessScore >= 40 ? '#d97706' : '#dc2626'
                              }}>
                                {completenessScore}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Inscription */}
                        <td style={{ padding: '14px 12px', fontSize: '13px', color: 'var(--gray-medium)' }}>
                          {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => openUserDetails(user)}
                              title="Voir les détails"
                              style={{
                                padding: '6px 10px', background: 'var(--gray-light)', border: '1px solid var(--gray-border)',
                                borderRadius: '6px', cursor: 'pointer', color: 'var(--black-deep)', display: 'flex', alignItems: 'center'
                              }}
                            >
                              <Eye size={14} />
                            </button>

                            {user.status === 'suspended' ? (
                              <button
                                onClick={() => handleReactivate(user.id)}
                                title="Activer le compte"
                                style={{
                                  padding: '6px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                                  borderRadius: '6px', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center'
                                }}
                              >
                                <Unlock size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(user.id)}
                                title="Suspendre le compte"
                                style={{
                                  padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca',
                                  borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center'
                                }}
                              >
                                <Lock size={14} />
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

            {/* Pagination Controls */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 0', borderTop: '1px solid var(--gray-border)'
            }}>
              <span style={{ fontSize: '13.5px', color: 'var(--gray-medium)' }}>
                Affichage de {users.length} sur {total} utilisateurs
              </span>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                    background: page <= 1 ? 'var(--gray-light)' : '#ffffff',
                    color: page <= 1 ? 'var(--gray-medium)' : 'var(--black-deep)',
                    fontSize: '13px', fontWeight: '600', cursor: page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ArrowLeft size={14} /> Précédent
                </button>
                <button
                  disabled={page >= lastPage || loading}
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                    background: page >= lastPage ? 'var(--gray-light)' : '#ffffff',
                    color: page >= lastPage ? 'var(--gray-medium)' : 'var(--black-deep)',
                    fontSize: '13px', fontWeight: '600', cursor: page >= lastPage ? 'not-allowed' : 'pointer'
                  }}
                >
                  Suivant <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Détails Utilisateur (Drawer Slide-In style) */}
      {showModal && selectedUser && !isEditing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,25,35,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end', zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowModal(false)}>
          
          <div style={{
            width: '100%', maxWidth: '520px', background: '#ffffff', height: '100%',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
            animation: 'modalFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid var(--gray-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)' }}>
                  Détails du compte
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--gray-medium)' }}>
                  Créé le {safeFormatDate(selectedUser.created_at, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-medium)',
                  display: 'flex', padding: '6px', borderRadius: '50%'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* Profile Card Summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--gray-border)' }}>
                {/* Avatar / Logo / Fallback */}
                {selectedUser.user_type === 'candidate' ? (
                  selectedUser.candidateProfile?.profile_photo_url ? (
                    <img
                      src={selectedUser.candidateProfile.profile_photo_url}
                      alt="Photo de profil"
                      style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid var(--gray-border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                    }}>
                      <User size={28} color="#ffffff" />
                    </div>
                  )
                ) : selectedUser.user_type === 'company' ? (
                  selectedUser.companyProfile?.logo_url ? (
                    <img
                      src={selectedUser.companyProfile.logo_url}
                      alt="Logo entreprise"
                      style={{
                        width: '64px', height: '64px', borderRadius: '14px',
                        objectFit: 'cover', border: '2px solid var(--gray-border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(14,165,233,0.3)'
                    }}>
                      <Building2 size={28} color="#ffffff" />
                    </div>
                  )
                ) : (
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A6FD4, #0052ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: '700', color: '#ffffff'
                  }}>
                    {getUserInitials(selectedUser)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--black-deep)' }}>
                    {getUserDisplayName(selectedUser)}
                  </h4>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {getTypeBadge(selectedUser.user_type)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => generateUserPdf(selectedUser)}
                    title="Générer PDF"
                    style={{
                      padding: '8px 12px', background: 'var(--gray-light)', border: '1px solid var(--gray-border)',
                      borderRadius: '8px', cursor: 'pointer', color: 'var(--black-deep)', display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: '600', transition: '0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8edf5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-light)'}
                  >
                    <Printer size={15} /> PDF
                  </button>
                  {canEdit && (
                    <button
                      onClick={startEditing}
                      style={{
                        padding: '8px 12px', background: '#0052ff', border: 'none',
                        borderRadius: '8px', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', fontWeight: '600', transition: '0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#003ec7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#0052ff'}
                    >
                      <Edit size={15} /> Modifier
                    </button>
                  )}
                </div>
              </div>

              {/* ─── MODE VISIONNAGE ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Section: Informations Générales */}
                <div>
                  <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Informations de Contact
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {renderField('Adresse e-mail du compte', selectedUser.email, 'Non renseignée')}
                    {renderField('Numéro de téléphone', selectedUser.phone, 'Non renseigné')}
                    {renderField('Code de pays', selectedUser.country?.code || getCountryCode(selectedUser.country_id), 'Non renseigné')}
                  </div>
                </div>

                {/* Section: Profil Spécifique */}
                {selectedUser.user_type === 'candidate' && (
                  <>
                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails du Candidat
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Prénom', selectedUser.candidateProfile?.first_name)}
                        {renderField('Nom', selectedUser.candidateProfile?.last_name)}
                        {renderField('Genre', selectedUser.candidateProfile?.gender === 'male' ? 'Homme' : selectedUser.candidateProfile?.gender === 'female' ? 'Femme' : selectedUser.candidateProfile?.gender === 'other' ? 'Autre' : null, 'Non spécifié')}
                        {renderField('Date de naissance', safeFormatDate(selectedUser.candidateProfile?.birth_date, null, null), 'Non renseignée')}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Localisation
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Préfecture', getPrefectureName(selectedUser.candidateProfile?.prefecture_id))}
                        {renderField('Commune', getCommuneName(selectedUser.candidateProfile?.commune_id))}
                        {renderField('Latitude', selectedUser.candidateProfile?.latitude)}
                        {renderField('Longitude', selectedUser.candidateProfile?.longitude)}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails Professionnels & Badges
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Moyen de transport', selectedUser.candidateProfile?.has_transport ? `Oui (${selectedUser.candidateProfile?.transport_type || 'Véhicule'})` : 'Non')}
                        {renderField('Statut d\'embauche', selectedUser.candidateProfile?.is_hired ? 'Embauché(e)' : 'En recherche active')}
                        {renderField('Date d\'embauche', safeFormatDate(selectedUser.candidateProfile?.hired_at, null, null), '—')}
                        {renderField('Badge de vérification', selectedUser.candidateProfile?.has_badge ? 'Oui' : 'Non')}
                        {renderField('Date d\'attribution du badge', safeFormatDateTime(selectedUser.candidateProfile?.badge_granted_at, '—'), '—')}
                        {renderField('Score de complétude', selectedUser.candidateProfile?.completeness_score ? `${selectedUser.candidateProfile.completeness_score}%` : '0%')}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Biographie
                      </h5>
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.45', color: selectedUser.candidateProfile?.bio ? 'var(--black-deep)' : 'var(--gray-medium)', fontStyle: selectedUser.candidateProfile?.bio ? 'normal' : 'italic' }}>
                        {selectedUser.candidateProfile?.bio || 'Aucune biographie renseignée.'}
                      </p>
                    </div>
                    {/* Photos du Candidat - Galerie */}
                    <div>
                      <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={14} /> Photos du Candidat
                      </h5>
                      
                      {/* Photo de profil en grand */}
                      {selectedUser.candidateProfile?.profile_photo_url ? (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Photo de profil</span>
                          <img
                            src={selectedUser.candidateProfile.profile_photo_url}
                            alt="Photo de profil"
                            style={{
                              width: '100%', maxWidth: '200px', height: 'auto', maxHeight: '240px',
                              borderRadius: '12px', objectFit: 'cover',
                              border: '2px solid var(--gray-border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '100%', maxWidth: '200px', height: '180px',
                          borderRadius: '12px', border: '2px dashed var(--gray-border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: '8px', background: '#f8fafc', marginBottom: '12px'
                        }}>
                          <User size={32} color="var(--gray-medium)" style={{ opacity: 0.5 }} />
                          <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontStyle: 'italic' }}>Aucune photo de profil</span>
                        </div>
                      )}

                      {/* Photos entières (full body) */}
                      <span style={{ fontSize: '12px', color: 'var(--gray-medium)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Photos en pied</span>
                      {selectedUser.candidateProfile?.photos && selectedUser.candidateProfile.photos.length > 0 ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${Math.min(selectedUser.candidateProfile.photos.length, 3)}, 1fr)`,
                          gap: '10px'
                        }}>
                          {selectedUser.candidateProfile.photos.slice(0, 3).map((photo, idx) => (
                            <div key={photo.id || idx} style={{ position: 'relative' }}>
                              <img
                                src={photo.url}
                                alt={`Photo ${idx + 1}`}
                                style={{
                                  width: '100%', height: '180px',
                                  borderRadius: '10px', objectFit: 'cover',
                                  border: '2px solid var(--gray-border)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'scale(1.03)';
                                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                }}
                                onClick={() => window.open(photo.url, '_blank')}
                              />
                              <span style={{
                                position: 'absolute', bottom: '6px', left: '6px',
                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                fontSize: '10px', fontWeight: '600', padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {idx + 1}/{Math.min(selectedUser.candidateProfile.photos.length, 3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex', gap: '10px'
                        }}>
                          {[1, 2, 3].map(i => (
                            <div key={i} style={{
                              flex: 1, height: '120px',
                              borderRadius: '10px', border: '2px dashed var(--gray-border)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              gap: '4px', background: '#f8fafc'
                            }}>
                              <ImageIcon size={20} color="var(--gray-medium)" style={{ opacity: 0.4 }} />
                              <span style={{ fontSize: '10px', color: 'var(--gray-medium)', fontStyle: 'italic' }}>Vide</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedUser.user_type === 'company' && (
                  <>
                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails de l'Entreprise
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Raison sociale', selectedUser.companyProfile?.company_name, 'Non renseignée')}
                        {renderField('Adresse e-mail de contact', selectedUser.companyProfile?.email, 'Non renseignée')}
                        {renderField('Secteur d\'activité', selectedUser.companyProfile?.sector, 'Non renseigné')}
                        {renderField('Taille de l\'entreprise', selectedUser.companyProfile?.employee_count_range ? `${selectedUser.companyProfile.employee_count_range} employés` : null, 'Non renseignée')}
                        {renderField('Site Web', selectedUser.companyProfile?.website_url, 'Non renseigné')}
                        {renderField('Adresse physique', selectedUser.companyProfile?.address, 'Non renseignée')}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Localisation
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Préfecture', getPrefectureName(selectedUser.companyProfile?.prefecture_id))}
                        {renderField('Commune', getCommuneName(selectedUser.companyProfile?.commune_id))}
                        {renderField('Latitude', selectedUser.companyProfile?.latitude)}
                        {renderField('Longitude', selectedUser.companyProfile?.longitude)}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Statuts & Certifications
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Entreprise viable', selectedUser.companyProfile?.is_viable ? 'Oui' : 'Non')}
                        {renderField('Date de validation viabilité', safeFormatDateTime(selectedUser.companyProfile?.viable_at, '—'), '—')}
                        {renderField('Badge de vérification', selectedUser.companyProfile?.has_badge ? 'Oui' : 'Non')}
                        {renderField('Date d\'attribution du badge', safeFormatDateTime(selectedUser.companyProfile?.badge_granted_at, '—'), '—')}
                        {renderField('Score de complétude', selectedUser.companyProfile?.completeness_score ? `${selectedUser.companyProfile.completeness_score}%` : '0%')}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Description
                      </h5>
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.45', color: selectedUser.companyProfile?.description ? 'var(--black-deep)' : 'var(--gray-medium)', fontStyle: selectedUser.companyProfile?.description ? 'normal' : 'italic' }}>
                        {selectedUser.companyProfile?.description || 'Aucune description renseignée.'}
                      </p>
                    </div>
                  </>
                )}

                {selectedUser.user_type === 'visitor' && (
                  <>
                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails du Visiteur
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Prénom', selectedUser.visitorProfile?.first_name)}
                        {renderField('Nom', selectedUser.visitorProfile?.last_name)}
                        {renderField('E-mail de contact', selectedUser.visitorProfile?.email)}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Localisation
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {renderField('Région', getRegionName(selectedUser.visitorProfile?.region_id))}
                        {renderField('Préfecture', getPrefectureName(selectedUser.visitorProfile?.prefecture_id))}
                        {renderField('Commune', getCommuneName(selectedUser.visitorProfile?.commune_id))}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Centres d'intérêt
                      </h5>
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.45', color: (Array.isArray(selectedUser.visitorProfile?.interests) && selectedUser.visitorProfile.interests.length > 0) ? 'var(--black-deep)' : 'var(--gray-medium)', fontStyle: (Array.isArray(selectedUser.visitorProfile?.interests) && selectedUser.visitorProfile.interests.length > 0) ? 'normal' : 'italic' }}>
                        {Array.isArray(selectedUser.visitorProfile?.interests) && selectedUser.visitorProfile.interests.length > 0
                          ? selectedUser.visitorProfile.interests.join(', ')
                          : 'Aucun centre d\'intérêt renseigné.'}
                      </p>
                    </div>
                  </>
                )}

                {/* Section: Sécurité & Paramètres (Pour Admin et tous types) */}
                <div>
                  <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sécurité & Système
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {renderDetailRow('Profil Complété', selectedUser.is_profile_complete ? 'Oui' : 'Non')}
                    {renderDetailRow('Dernière Connexion', safeFormatDateTime(selectedUser.last_login_at))}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '20px 24px', borderTop: '1px solid var(--gray-border)',
              display: 'flex', gap: '12px', background: '#fafbfc'
            }}>
              {canSuspend && (
                selectedUser.status === 'suspended' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReactivate(selectedUser.id)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                      background: '#10b981', color: '#ffffff', fontSize: '14px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <Unlock size={16} /> Activer le compte
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleSuspend(selectedUser.id)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                      background: '#dc2626', color: '#ffffff', fontSize: '14px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <Lock size={16} /> Suspendre le compte
                  </button>
                )
              )}

              {canDelete && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleDelete(selectedUser.id)}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5',
                    background: '#fef2f2', color: '#b91c1c', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Supprimer définitivement"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal Édition Utilisateur (Centered Popup overlay style) */}
      {showModal && selectedUser && isEditing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010,
          animation: 'fadeIn 0.2s ease-out', padding: '20px'
        }} onClick={() => setIsEditing(false)}>
          
          <div style={{
            width: '100%', maxWidth: '850px', maxHeight: '90vh', background: '#ffffff',
            borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--gray-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fafbfc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)' }}>
                  Modifier le profil
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--gray-medium)' }}>
                  {getUserDisplayName(selectedUser)} — {selectedUser.user_type === 'candidate' ? 'Candidat' : selectedUser.user_type === 'company' ? 'Entrepreneur' : 'Visiteur'}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-medium)',
                  display: 'flex', padding: '6px', borderRadius: '50%'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body (Two Columns Grid) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Column 1: Account & Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Card Section: Compte */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Informations de Compte
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)', fontWeight: '500' }}>Adresse e-mail</span>
                        <input
                          type="email"
                          style={inputStyle}
                          value={editForm.email}
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)', fontWeight: '500' }}>Numéro de téléphone</span>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)', fontWeight: '500' }}>Statut du compte</span>
                        <select
                          style={inputStyle}
                          value={editForm.status}
                          onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="active">Actif</option>
                          <option value="pending">En attente</option>
                          <option value="suspended">Suspendu</option>
                          <option value="deleted">Supprimé</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card Section: Localisation Géographique */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Localisation
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Unified Localisation Fields for all user types */}
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Pays</span>
                        <select
                          style={inputStyle}
                          value={editForm.country_id}
                          onChange={e => setEditForm({ ...editForm, country_id: e.target.value })}
                        >
                          <option value="">Sélectionner...</option>
                          {(countries.length > 0 ? countries : staticCountries).filter(c => c.id && (c.name || c.code || (c.translations && c.translations.length > 0))).map((c, idx) => {
                            const displayName = getCountryName(c.id);
                            const displayCode = getCountryCode(c.id);
                            return (
                              <option key={c.id || idx} value={c.id}>
                                {displayName} {displayCode && displayName !== displayCode ? `(${displayCode})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Région</span>
                          <select
                            style={inputStyle}
                            value={editForm.region_id}
                            onChange={e => setEditForm({ ...editForm, region_id: e.target.value, prefecture_id: '', commune_id: '' })}
                          >
                            <option value="">Sélectionner...</option>
                            {regions.map((r, idx) => (
                              <option key={r.id || idx} value={r.id}>{r.translations?.[0]?.name || r.name || r.id}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Préfecture</span>
                          <select
                            style={inputStyle}
                            value={editForm.prefecture_id}
                            onChange={e => setEditForm({ ...editForm, prefecture_id: e.target.value, commune_id: '' })}
                            disabled={!editForm.region_id}
                          >
                            <option value="">Sélectionner...</option>
                            {prefectures.filter(p => String(p.region_id) === String(editForm.region_id)).map((p, idx) => (
                              <option key={p.id || idx} value={p.id}>{p.translations?.[0]?.name || p.name || p.id}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Commune</span>
                        <select
                          style={inputStyle}
                          value={editForm.commune_id}
                          onChange={e => setEditForm({ ...editForm, commune_id: e.target.value })}
                          disabled={!editForm.prefecture_id}
                        >
                          <option value="">Sélectionner...</option>
                          {communes.filter(c => String(c.prefecture_id) === String(editForm.prefecture_id)).map((c, idx) => (
                            <option key={c.id || idx} value={c.id}>{c.translations?.[0]?.name || c.name || c.id}</option>
                          ))}
                        </select>
                      </div>

                      {selectedUser.user_type !== 'visitor' ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Latitude GPS</span>
                              <input
                                type="number"
                                step={0.000001}
                                style={inputStyle}
                                value={editForm.latitude || ''}
                                onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Longitude GPS</span>
                              <input
                                type="number"
                                step={0.000001}
                                style={inputStyle}
                                value={editForm.longitude || ''}
                                onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                              />
                            </div>
                          </div>
                          {selectedUser.user_type === 'company' ? (
                            <div>
                              <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Adresse physique</span>
                              <input
                                type="text"
                                style={inputStyle}
                                value={editForm.address}
                                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                              />
                            </div>
                          ) : null}
                        </>
                      ) : null}

                    </div>
                  </div>

                </div>

                {/* Column 2: Specific Profile Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Candidate Specific fields */}
                  {selectedUser.user_type === 'candidate' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails Candidat
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Prénom</span>
                          <input
                            type="text"
                            style={inputStyle}
                            value={editForm.first_name}
                            onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Nom</span>
                          <input
                            type="text"
                            style={inputStyle}
                            value={editForm.last_name}
                            onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Genre</span>
                          <select
                            style={inputStyle}
                            value={editForm.gender}
                            onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                          >
                            <option value="unspecified">Non spécifié</option>
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                            <option value="other">Autre</option>
                          </select>
                        </div>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Date de naissance</span>
                          <input
                            type="date"
                            style={inputStyle}
                            value={editForm.birth_date}
                            onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Moyen de transport */}
                      <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editForm.has_transport}
                            onChange={e => setEditForm({ ...editForm, has_transport: e.target.checked })}
                          />
                          Moyen de transport
                        </label>
                        {editForm.has_transport && (
                          <select
                            style={{ ...inputStyle, marginTop: '8px' }}
                            value={editForm.transport_type}
                            onChange={e => setEditForm({ ...editForm, transport_type: e.target.value })}
                          >
                            <option value="">Sélectionner...</option>
                            <option value="Voiture">Voiture</option>
                            <option value="Moto">Moto</option>
                            <option value="Vélo">Vélo</option>
                            <option value="Cheval">Cheval</option>
                          </select>
                        )}
                      </div>

                      {/* Embauche */}
                      <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editForm.is_hired}
                            onChange={e => setEditForm({ ...editForm, is_hired: e.target.checked })}
                          />
                          Candidat embauché
                        </label>
                        {editForm.is_hired && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--gray-medium)' }}>Date d'embauche</span>
                            <input
                              type="date"
                              style={inputStyle}
                              value={editForm.hired_at}
                              onChange={e => setEditForm({ ...editForm, hired_at: e.target.value })}
                            />
                          </div>
                        )}
                      </div>

                      {/* Badge SAMRE */}
                      <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editForm.has_badge}
                            onChange={e => {
                              const checked = e.target.checked;
                              const now = new Date();
                              const localString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');
                              setEditForm({
                                ...editForm,
                                has_badge: checked,
                                badge_granted_at: checked ? localString : ''
                              });
                            }}
                          />
                          Badge de vérification accordé
                        </label>
                        {editForm.has_badge && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11.5px', color: 'var(--gray-medium)' }}>Date d'attribution (AAAA-MM-JJ HH:MM:SS)</span>
                            <input
                              type="text"
                              placeholder="ex: 2026-06-24 14:00:00"
                              style={inputStyle}
                              value={editForm.badge_granted_at}
                              onChange={e => setEditForm({ ...editForm, badge_granted_at: e.target.value })}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Biographie</span>
                        <textarea
                          style={textareaStyle}
                          value={editForm.bio}
                          onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Company Specific fields */}
                  {selectedUser.user_type === 'company' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails Entrepreneur
                      </h4>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Nom de l'entreprise</span>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editForm.company_name}
                          onChange={e => setEditForm({ ...editForm, company_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Adresse e-mail de contact</span>
                        <input
                          type="email"
                          style={inputStyle}
                          value={editForm.profile_email}
                          onChange={e => setEditForm({ ...editForm, profile_email: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Secteur d'activité</span>
                          <input
                            type="text"
                            style={inputStyle}
                            value={editForm.sector}
                            onChange={e => setEditForm({ ...editForm, sector: e.target.value })}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Taille (Nb. employés)</span>
                          <input
                            type="text"
                            placeholder="ex: 10-50, 100+"
                            style={inputStyle}
                            value={editForm.employee_count_range}
                            onChange={e => setEditForm({ ...editForm, employee_count_range: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Site Web</span>
                        <input
                          type="url"
                          placeholder="https://..."
                          style={inputStyle}
                          value={editForm.website_url}
                          onChange={e => setEditForm({ ...editForm, website_url: e.target.value })}
                        />
                      </div>

                      {/* Viabilité & Badge */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={editForm.is_viable}
                              onChange={e => setEditForm({ ...editForm, is_viable: e.target.checked })}
                            />
                            Entreprise viable
                          </label>
                        </div>
                        <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={editForm.has_badge}
                              onChange={e => {
                                const checked = e.target.checked;
                                const now = new Date();
                                const localString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');
                                setEditForm({
                                  ...editForm,
                                  has_badge: checked,
                                  badge_granted_at: checked ? localString : ''
                                });
                              }}
                            />
                            Badge SAMRE
                          </label>
                        </div>
                      </div>

                      {editForm.has_badge && (
                        <div>
                          <span style={{ fontSize: '11.5px', color: 'var(--gray-medium)' }}>Date d'attribution badge (AAAA-MM-JJ HH:MM:SS)</span>
                          <input
                            type="text"
                            placeholder="ex: 2026-06-24 14:00:00"
                            style={inputStyle}
                            value={editForm.badge_granted_at}
                            onChange={e => setEditForm({ ...editForm, badge_granted_at: e.target.value })}
                          />
                        </div>
                      )}

                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Description</span>
                        <textarea
                          style={textareaStyle}
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Visitor Specific fields */}
                  {selectedUser.user_type === 'visitor' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: 'var(--gray-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Détails Visiteur
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Prénom</span>
                          <input
                            type="text"
                            style={inputStyle}
                            value={editForm.first_name}
                            onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Nom</span>
                          <input
                            type="text"
                            style={inputStyle}
                            value={editForm.last_name}
                            onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Adresse e-mail de contact</span>
                        <input
                          type="email"
                          style={inputStyle}
                          value={editForm.profile_email}
                          onChange={e => setEditForm({ ...editForm, profile_email: e.target.value })}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '12.3px', color: 'var(--gray-medium)' }}>Centres d'intérêt (séparés par virgules)</span>
                        <input
                          type="text"
                          placeholder="ex: IT, Logistique..."
                          style={inputStyle}
                          value={editForm.interests}
                          onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--gray-border)',
              display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fafbfc'
            }}>
              <button
                disabled={actionLoading}
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                  background: '#ffffff', color: 'var(--black-deep)', fontSize: '13.5px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSaveUser}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: '#0052ff', color: '#ffffff', fontSize: '13.5px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {actionLoading ? 'Enregistrement...' : (
                  <>
                    <Save size={16} /> Enregistrer les modifications
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '12px', padding: '24px',
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            animation: 'modalFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: 'var(--black-deep)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color={confirmModal.type === 'delete' ? '#dc2626' : '#d97706'} />
              Confirmation requise
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--gray-medium)', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: '', message: '', targetId: null })}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--gray-border)',
                  background: '#ffffff', color: 'var(--black-deep)', fontSize: '13.5px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: confirmModal.type === 'delete' ? '#dc2626' : (confirmModal.type === 'suspend' ? '#d97706' : '#059669'),
                  color: '#ffffff', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
