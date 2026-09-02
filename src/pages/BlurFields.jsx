import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Edit2, AlertCircle, CheckCircle2, X, EyeOff, Plus, Trash2, Search, Filter, Image, Phone, Mail, FileText, User, Briefcase, MapPin, Award, Navigation, ShieldCheck } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Liste exhaustive de TOUS les champs système configurables pour le floutage
const ALL_SYSTEM_FIELDS = {
  candidate: [
    {
      group: "Photos & Visuels",
      options: [
        { key: 'profile_photo_url', label: 'Photo de profil (Avatar principal)', icon: Image },
        { key: 'photos', label: 'Photos plein pied & Galerie complète', icon: Image },
      ]
    },
    {
      group: "Coordonnées de Contact",
      options: [
        { key: 'phone', label: 'Numéro de téléphone direct', icon: Phone },
        { key: 'email', label: 'Adresse email personnelle', icon: Mail },
        { key: 'address', label: 'Adresse de résidence / Quartier', icon: MapPin },
        { key: 'commune', label: 'Commune de résidence', icon: MapPin },
        { key: 'prefecture', label: 'Préfecture de résidence', icon: MapPin },
        { key: 'latitude', label: 'Géolocalisation GPS exacte', icon: Navigation },
        { key: 'social_links', label: 'Liens réseaux sociaux / LinkedIn / Web', icon: Navigation },
      ]
    },
    {
      group: "Documents & Curriculum",
      options: [
        { key: 'cv_url', label: 'Document CV (Curriculum Vitae PDF)', icon: FileText },
      ]
    },
    {
      group: "Identité & Profil",
      options: [
        { key: 'first_name', label: 'Prénom du candidat', icon: User },
        { key: 'last_name', label: 'Nom de famille', icon: User },
        { key: 'profession', label: 'Métier / Profession principale', icon: Briefcase },
        { key: 'birth_date', label: 'Date de naissance / Âge', icon: User },
        { key: 'gender', label: 'Genre / Sexe', icon: User },
        { key: 'bio', label: 'Biographie & Présentation personnelle', icon: User },
        { key: 'completeness_score', label: 'Score de complétude du profil', icon: Award },
      ]
    },
    {
      group: "Parcours, Études & Compétences",
      options: [
        { key: 'educations', label: 'Formations, Diplômes & Études', icon: Award },
        { key: 'experiences', label: 'Expériences professionnelles antérieures', icon: Briefcase },
        { key: 'skills', label: 'Compétences & Aptitudes techniques', icon: Award },
      ]
    },
    {
      group: "Mobilité & Déplacement",
      options: [
        { key: 'has_transport', label: 'Possession de moyen de déplacement', icon: Navigation },
        { key: 'transport_type', label: 'Type de transport (Moto, Véhicule, etc.)', icon: Navigation },
      ]
    }
  ],
  company: [
    {
      group: "Visuels & Logo",
      options: [
        { key: 'logo_url', label: "Logo officiel de l'entreprise", icon: Image },
      ]
    },
    {
      group: "Coordonnées de Contact",
      options: [
        { key: 'contact_phone', label: 'Numéro de téléphone direct', icon: Phone },
        { key: 'email', label: 'Adresse email de contact', icon: Mail },
        { key: 'website_url', label: 'Site web officiel', icon: Navigation },
        { key: 'address', label: 'Adresse physique du siège / Bureau', icon: MapPin },
        { key: 'commune', label: 'Commune du siège', icon: MapPin },
        { key: 'prefecture', label: 'Préfecture du siège', icon: MapPin },
        { key: 'social_links', label: 'Réseaux sociaux de l\'entreprise', icon: Navigation },
      ]
    },
    {
      group: "Présentation & Activité",
      options: [
        { key: 'description', label: "Description & Présentation de l'entreprise", icon: Briefcase },
        { key: 'sector', label: "Secteur d'activité principal", icon: Briefcase },
        { key: 'employee_count_range', label: "Taille de l'entreprise (Effectif)", icon: User },
      ]
    },
    {
      group: "Informations Légales & Viabilité",
      options: [
        { key: 'rccm_number', label: 'Numéro d\'immatriculation RCCM', icon: ShieldCheck },
        { key: 'nif_number', label: 'Numéro d\'identification fiscale (NIF)', icon: ShieldCheck },
        { key: 'is_viable', label: 'Statut & Badge de viabilité légale', icon: ShieldCheck },
      ]
    }
  ]
};

// Flatten helper
const getFlatOptions = (profileType) => {
  return ALL_SYSTEM_FIELDS[profileType]?.flatMap(g => g.options) || [];
};

export const BlurFieldsPage = () => {
  const { can } = useAuth();
  const [rules, setRules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, label: '', loading: false });

  // Filtres & Recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    profile_type: 'candidate',
    field_key: 'profile_photo_url',
    exempted_plan_ids: [],
    is_blurred_for_free: true,
    label: 'Photo de profil (Avatar principal)'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rulesRes, plansRes] = await Promise.all([
        apiClient.get('/v1/admin/blur-rules'),
        apiClient.get('/v1/admin/subscription-plans')
      ]);
      setRules(rulesRes.data.data || rulesRes.data || []);
      setPlans(plansRes.data.data || plansRes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      const pType = item.profile_type || 'candidate';
      const flat = getFlatOptions(pType);
      const matched = flat.find(opt => opt.key === item.field_key);

      setFormData({
        profile_type: pType,
        field_key: item.field_key || '',
        exempted_plan_ids: item.exempted_plan_ids || [],
        is_blurred_for_free: item.is_blurred_for_free !== false,
        label: item.label || (matched ? matched.label : item.field_key)
      });
    } else {
      const defaultType = 'candidate';
      const firstOpt = ALL_SYSTEM_FIELDS[defaultType][0].options[0];
      setFormData({
        profile_type: defaultType,
        field_key: firstOpt.key,
        exempted_plan_ids: [],
        is_blurred_for_free: true,
        label: firstOpt.label
      });
    }
    setIsModalOpen(true);
  };

  const handleProfileTypeChange = (newType) => {
    const groups = ALL_SYSTEM_FIELDS[newType] || [];
    const firstOpt = groups[0]?.options[0];
    setFormData({
      ...formData,
      profile_type: newType,
      field_key: firstOpt ? firstOpt.key : '',
      label: firstOpt ? firstOpt.label : ''
    });
  };

  const handleFieldKeySelect = (selectedKey) => {
    const flat = getFlatOptions(formData.profile_type);
    const foundOpt = flat.find(opt => opt.key === selectedKey);

    setFormData({
      ...formData,
      field_key: selectedKey,
      label: foundOpt ? foundOpt.label : selectedKey
    });
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirm({
      isOpen: true,
      id: item.id,
      label: item.label || item.field_key,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await apiClient.delete(`/v1/admin/blur-rules/${deleteConfirm.id}`);
      showToast("Règle supprimée avec succès");
      setDeleteConfirm({ isOpen: false, id: null, label: '', loading: false });
      fetchData();
    } catch (err) {
      setError("Erreur lors de la suppression.");
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.field_key) {
      setError("Veuillez sélectionner un champ valide.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
      };

      if (editingItem) {
        await apiClient.put(`/v1/admin/blur-rules/${editingItem.id}`, payload);
        showToast("Règle mise à jour avec succès");
      } else {
        await apiClient.post(`/v1/admin/blur-rules`, payload);
        showToast("Règle créée avec succès");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else if (!searchTerm) {
      setIsSearchExpanded(false);
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter(item => {
      const matchSearch = (item.field_key || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.label || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType ? item.profile_type === selectedType : true;
      return matchSearch && matchType;
    });
  }, [rules, searchTerm, selectedType]);

  const getPlanNames = (planIds) => {
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) return 'Aucun';
    return planIds.map(id => {
      const plan = plans.find(p => p.id === id);
      return plan ? plan.key : `Plan #${id}`;
    }).join(', ');
  };

  const getFieldDisplayInfo = (pType, key) => {
    const flat = getFlatOptions(pType);
    const found = flat.find(opt => opt.key === key);
    if (found) {
      const IconComp = found.icon || EyeOff;
      return { label: found.label, icon: <IconComp size={15} color="#4F46E5" /> };
    }
    return { label: key, icon: <EyeOff size={15} color="#71717A" /> };
  };

  const currentGroups = ALL_SYSTEM_FIELDS[formData.profile_type] || [];

  return (
    <MainLayout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Champs Floutés & Confidentialité
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Sélectionnez les champs masqués (photos, coordonnées, CV) et les forfaits d'abonnement qui les débloquent.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Barre de recherche */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: isSearchExpanded || searchTerm ? '#FFF' : 'transparent',
            border: isSearchExpanded || searchTerm ? '1px solid #E4E4E7' : '1px solid transparent',
            borderRadius: '8px',
            padding: isSearchExpanded || searchTerm ? '4px 12px' : '4px',
            transition: 'all 0.3s ease',
            height: '42px',
            boxShadow: isSearchExpanded || searchTerm ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
          }}>
            <button 
              onClick={handleSearchClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: '#71717A', outline: 'none' }}
            >
              <Search size={18} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {
                if (!searchTerm) setIsSearchExpanded(false);
              }}
              style={{ 
                width: isSearchExpanded || searchTerm ? '200px' : '0px', 
                opacity: isSearchExpanded || searchTerm ? 1 : 0,
                padding: isSearchExpanded || searchTerm ? '0 8px' : '0',
                border: 'none', 
                fontSize: '14px', 
                outline: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Filtre de profil */}
          <div style={{ position: 'relative', height: '42px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#71717A' }}>
              <Filter size={16} />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                height: '100%', 
                padding: '0 14px 0 36px', 
                borderRadius: '8px', 
                border: '1px solid #E4E4E7', 
                fontSize: '14px', 
                outline: 'none', 
                appearance: 'none', 
                backgroundColor: '#FFF',
                color: '#09090B',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '160px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <option value="">Tous les profils</option>
              <option value="candidate">Secrétaires / Candidats</option>
              <option value="company">Entreprises</option>
            </select>
          </div>

          {/* Bouton Nouveau */}
          {can('create', '/cms/blur') && (
            <button
              onClick={() => handleOpenModal()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#18181B', color: '#FFF',
                border: 'none', height: '42px', padding: '0 20px', borderRadius: '8px',
                fontWeight: '500', cursor: 'pointer', transition: '0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#18181B'}
            >
              <Plus size={18} />
              Nouvelle Règle
            </button>
          )}
        </div>
      </div>

      {error && !isModalOpen && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="#18181B" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ width: '100%', overflow: 'auto', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#FFF', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '28%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle' }}>Champ Système (Clé)</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '14%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle' }}>Cible</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle' }}>Flouté pour Gratuit</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '20%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle' }}>Plans Débloquants</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle' }}>Description affichée</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '8%', height: '40px', padding: '0 16px', fontWeight: '600', color: '#71717A', verticalAlign: 'middle', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
                    Aucun champ flouté configuré.
                  </td>
                </tr>
              ) : filteredRules.map((item) => {
                const info = getFieldDisplayInfo(item.profile_type, item.field_key);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E4E4E7', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F4F5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: '600', color: '#09090B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {info.icon}
                        <code style={{ backgroundColor: '#F1F5F9', color: '#0F172A', padding: '2px 6px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'monospace' }}>
                          {item.field_key}
                        </code>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: '1px solid #E4E4E7', backgroundColor: '#FAFAFA', padding: '2px 10px', fontSize: '12px', fontWeight: '600', color: '#18181B' }}>
                        {item.profile_type === 'candidate' ? 'Secrétaire' : 'Entreprise'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      {item.is_blurred_for_free ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#065F46', fontSize: '12px', fontWeight: '600', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                          🔒 Oui (Flouté)
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#71717A', fontSize: '12px', fontWeight: '500', backgroundColor: '#F4F4F5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E4E4E7' }}>
                          Non
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#09090B', fontWeight: '500' }}>
                      {item.exempted_plan_ids && item.exempted_plan_ids.length > 0 ? (
                        <span style={{ display: 'inline-block', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                          {getPlanNames(item.exempted_plan_ids)}
                        </span>
                      ) : (
                        <span style={{ color: '#A1A1AA', fontSize: '12px', fontStyle: 'italic' }}>Aucun (Uniquement déblocage payant)</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#475569', fontWeight: '500' }}>
                      {item.label || info.label}
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        {can('edit', '/cms/blur') && (
                          <button 
                            onClick={() => handleOpenModal(item)} 
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#09090B', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            title="Modifier"
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#E4E4E7'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 size={16} /> 
                          </button>
                        )}
                        {can('delete', '/cms/blur') && (
                          <button 
                            onClick={() => handleDeleteClick(item)} 
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            title="Supprimer"
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={16} />
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

      {/* --- MODAL CRÉATION / ÉDITION --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '14px', width: '90%', maxWidth: '520px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#09090B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EyeOff size={20} color="#4F46E5" />
                {editingItem ? 'Modifier la règle de floutage' : 'Nouveau champ à flouter'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              {/* 1. Cible (Profil) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#09090B' }}>
                  1. Cible (Profil concerné) *
                </label>
                <select
                  value={formData.profile_type}
                  onChange={(e) => handleProfileTypeChange(e.target.value)}
                  disabled={!!editingItem}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '14px', backgroundColor: editingItem ? '#F4F4F5' : '#FFF', color: editingItem ? '#A1A1AA' : '#09090B', fontWeight: '600' }}
                >
                  <option value="candidate">Secrétaire / Candidat</option>
                  <option value="company">Entreprise</option>
                </select>
              </div>

              {/* 2. Clé du champ (Menu Déroulant EXHAUSTIF) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#09090B' }}>
                  2. Champ du système à masquer (Flouter) *
                </label>

                {!editingItem ? (
                  <select
                    value={formData.field_key}
                    onChange={(e) => handleFieldKeySelect(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #4F46E5', fontSize: '14px', backgroundColor: '#FFF', color: '#09090B', fontWeight: '600' }}
                  >
                    {currentGroups.map((group, gIdx) => (
                      <optgroup key={gIdx} label={group.group}>
                        {group.options.map(opt => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label} ({opt.key})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={`${formData.label} (${formData.field_key})`}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#F4F4F5', color: '#71717A', fontSize: '14px', fontWeight: '600' }}
                  />
                )}
              </div>

              {/* 3. Description Automatique Affichée */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#09090B' }}>
                  3. Description du champ (Automatique)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#F8FAFC', color: '#334155', fontSize: '14px', fontWeight: '600' }}
                />
              </div>

              {/* 4. Case à cocher : Flouté pour gratuit */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="is_blurred_for_free"
                  checked={formData.is_blurred_for_free}
                  onChange={(e) => setFormData({...formData, is_blurred_for_free: e.target.checked})}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#18181B' }}
                />
                <div>
                  <label htmlFor="is_blurred_for_free" style={{ fontSize: '13.5px', color: '#09090B', cursor: 'pointer', fontWeight: '700' }}>
                    Toujours flouté pour les comptes gratuits
                  </label>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Les utilisateurs en mode gratuit ne verront pas cette donnée à moins de débloquer le profil.
                  </p>
                </div>
              </div>

              {/* 5. Plans d'Abonnement Débloquants */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#09090B' }}>
                  4. Forfaits d'Abonnement débloquant ce champ
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#FAFAFA' }}>
                  {plans.map(plan => (
                    <label key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#09090B', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.exempted_plan_ids.includes(plan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, exempted_plan_ids: [...formData.exempted_plan_ids, plan.id]});
                          } else {
                            setFormData({...formData, exempted_plan_ids: formData.exempted_plan_ids.filter(id => id !== plan.id)});
                          }
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#18181B' }}
                      />
                      <span style={{ fontWeight: '600' }}>{plan.name || plan.key}</span>
                      <span style={{ fontSize: '12px', color: '#71717A' }}>({plan.key})</span>
                    </label>
                  ))}
                  {plans.length === 0 && <span style={{ fontSize: '13px', color: '#71717A' }}>Aucun plan disponible.</span>}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#71717A' }}>
                  Les entreprises ayant souscrit à ces forfaits verront ce champ sans payer de déblocage unitaire.
                </p>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E4E4E7', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#FAFAFA', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '9px 16px', backgroundColor: '#FFF', border: '1px solid #E4E4E7', borderRadius: '8px', fontWeight: '600', color: '#09090B', cursor: 'pointer', fontSize: '14px' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', backgroundColor: '#18181B', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#FFF', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, fontSize: '14px' }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer la règle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmation de Suppression */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer la règle de floutage"
        message={`Voulez-vous vraiment supprimer la règle pour le champ « ${deleteConfirm.label} » ?`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteConfirm.loading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#10B981', color: '#FFF',
          padding: '12px 24px', borderRadius: '8px',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          animation: 'slideUp 0.3s ease-out', zIndex: 9999
        }}>
          <CheckCircle2 size={20} />
          {toastMessage}
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </MainLayout>
  );
};
