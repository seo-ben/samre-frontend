import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { 
  Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, 
  LayoutTemplate, Smartphone, UploadCloud, Languages, Search, Users, 
  Building2, UserCheck, Globe, CheckCircle2, SlidersHorizontal 
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const CompanyBanners = () => {
  const [banners, setBanners] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoTranslateLoading, setAutoTranslateLoading] = useState(false);
  
  // Tabs & Search Filter
  const [selectedRoleTab, setSelectedRoleTab] = useState('all'); // all, candidate, company, visitor, global_all
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '', loading: false });
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [activeLang, setActiveLang] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);

  const getLocationName = (item, fallback = '') => {
    if (!item) return fallback;
    if (item.translations && Array.isArray(item.translations) && item.translations.length > 0) {
      const tr = item.translations.find(t => String(t.language_id) === '1' || String(t.language_id) === String(activeLang)) || item.translations[0];
      if (tr && tr.name) return tr.name;
    }
    return item.name || item.native_name || item.code || fallback;
  };

  const getGeoBadge = (b) => {
    if (!b.country_code && !b.region_id && !b.prefecture_id && !b.commune_id) {
      return null;
    }

    const countryObj = countries.find(c => String(c.code).toUpperCase() === String(b.country_code).toUpperCase());
    const regionObj = regions.find(r => String(r.id) === String(b.region_id));
    const prefObj = prefectures.find(p => String(p.id) === String(b.prefecture_id));
    const comObj = communes.find(c => String(c.id) === String(b.commune_id));

    const parts = [];
    if (countryObj) parts.push(getLocationName(countryObj, b.country_code));
    else if (b.country_code) parts.push(b.country_code);

    if (regionObj) parts.push(getLocationName(regionObj));
    if (prefObj) parts.push(getLocationName(prefObj));
    if (comObj) parts.push(getLocationName(comObj));

    if (parts.length === 0) return null;

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 8px',
        borderRadius: '12px',
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FDE68A',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        📍 {parts.join(' › ')}
      </span>
    );
  };

  const getTranslationData = (banner, langId) => {
    if (banner && banner.translations) {
      const targetLang = languages.find(l => String(l.id) === String(langId));
      const targetCode = targetLang?.code?.toLowerCase();

      if (banner.translations[langId]) return banner.translations[langId];
      if (banner.translations[String(langId)]) return banner.translations[String(langId)];
      if (targetCode && banner.translations[targetCode]) return banner.translations[targetCode];

      if (Array.isArray(banner.translations)) {
        const t = banner.translations.find(t => 
          String(t.language_id) === String(langId) ||
          (targetCode && t.language && String(t.language.code).toLowerCase() === targetCode) ||
          (targetCode && t.language_code && String(t.language_code).toLowerCase().startsWith(targetCode))
        );
        if (t) return { title: t.title || '', subtitle: t.subtitle || '' };
      }
    }
    return { title: '', subtitle: '' };
  };

  const [editForm, setEditForm] = useState({
    translations: {},
    image_url: '',
    action_url: '',
    sort_order: 1,
    is_active: 1,
    target_role: 'company',
    country_code: '',
    region_id: '',
    prefecture_id: '',
    commune_id: ''
  });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [langsRes, bannersRes, countriesRes, regionsRes, prefRes, comRes] = await Promise.all([
        apiClient.get('/v1/admin/cms/dynamic/languages'),
        apiClient.get('/v1/admin/company-banners'),
        apiClient.get('/v1/admin/cms/dynamic/countries').catch(() => ({ data: [] })),
        apiClient.get('/v1/admin/cms/dynamic/regions').catch(() => ({ data: [] })),
        apiClient.get('/v1/admin/cms/dynamic/prefectures').catch(() => ({ data: [] })),
        apiClient.get('/v1/admin/cms/dynamic/communes').catch(() => ({ data: [] }))
      ]);
      const activeLangs = (langsRes.data.data || langsRes.data).filter(l => l.is_active);
      setLanguages(activeLangs);
      if (activeLangs.length > 0) {
        setActiveLang(activeLangs[0].id);
      }

      setCountries(countriesRes.data?.data || (Array.isArray(countriesRes.data) ? countriesRes.data : []));
      setRegions(regionsRes.data?.data || (Array.isArray(regionsRes.data) ? regionsRes.data : []));
      setPrefectures(prefRes.data?.data || (Array.isArray(prefRes.data) ? prefRes.data : []));
      setCommunes(comRes.data?.data || (Array.isArray(comRes.data) ? comRes.data : []));

      const data = (bannersRes.data.data || bannersRes.data).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setBanners(data);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement des données.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Banners by Role & Search
  const filteredBanners = useMemo(() => {
    return banners.filter(b => {
      // Role filtering
      if (selectedRoleTab === 'candidate' && b.target_role !== 'candidate') return false;
      if (selectedRoleTab === 'company' && b.target_role !== 'company') return false;
      if (selectedRoleTab === 'visitor' && b.target_role !== 'visitor') return false;
      if (selectedRoleTab === 'global_all' && b.target_role !== 'all') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const transTitle = (b.translations?.[1]?.title || b.title || '').toLowerCase();
        const transSubtitle = (b.translations?.[1]?.subtitle || b.subtitle || '').toLowerCase();
        const country = (b.country_code || '').toLowerCase();
        return transTitle.includes(query) || transSubtitle.includes(query) || country.includes(query);
      }
      return true;
    });
  }, [banners, selectedRoleTab, searchTerm]);

  // Role Counts for Tabs
  const roleCounts = useMemo(() => {
    return {
      all: banners.length,
      candidate: banners.filter(b => b.target_role === 'candidate').length,
      company: banners.filter(b => b.target_role === 'company').length,
      visitor: banners.filter(b => b.target_role === 'visitor').length,
      global_all: banners.filter(b => b.target_role === 'all').length,
    };
  }, [banners]);

  const openAddModal = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage('');
    const initialLangId = languages.length > 0 ? languages[0].id : 1;
    setActiveLang(initialLangId);
    
    const initialTrans = {};
    languages.forEach(l => {
      initialTrans[l.id] = { title: '', subtitle: '' };
    });

    const defaultRole = selectedRoleTab === 'all' || selectedRoleTab === 'global_all' 
      ? 'candidate' 
      : selectedRoleTab;

    setEditForm({
      translations: initialTrans,
      image_url: '',
      action_url: '',
      sort_order: (banners.length > 0 ? banners[banners.length - 1].sort_order + 1 : 1),
      is_active: 1,
      target_role: defaultRole,
      country_code: '',
      region_id: '',
      prefecture_id: '',
      commune_id: ''
    });
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setIsEditing(true);
    setImageFile(null);
    const initialLangId = languages.length > 0 ? languages[0].id : 1;
    setActiveLang(initialLangId);
    setPreviewImage(banner.image_url || '');

    const transObj = {};
    languages.forEach(l => {
      transObj[l.id] = getTranslationData(banner, l.id);
    });

    setEditForm({
      id: banner.id,
      translations: transObj,
      image_url: banner.image_url || '',
      action_url: banner.action_url || '',
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active ? 1 : 0,
      target_role: banner.target_role || 'company',
      country_code: banner.country_code || '',
      region_id: banner.region_id || '',
      prefecture_id: banner.prefecture_id || '',
      commune_id: banner.commune_id || ''
    });
    
    // Support legacy data
    if (!banner.translations && banner.title) {
        setEditForm(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [initialLangId]: { title: banner.title || '', subtitle: banner.subtitle || '' }
            }
        }));
    }

    setShowModal(true);
  };

  const confirmDelete = (banner) => {
    const title = banner.translations?.[1]?.title || banner.title || `Bannière #${banner.id}`;
    setDeleteConfirm({
      isOpen: true,
      id: banner.id,
      title,
      loading: false
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await apiClient.delete(`/v1/admin/company-banners/${deleteConfirm.id}`);
      await fetchData();
      setDeleteConfirm({ isOpen: false, id: null, title: '', loading: false });
      showToast("Bannière supprimée avec succès.", "success");
    } catch (err) {
      showToast("Erreur lors de la suppression.", "error");
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const newActiveState = banner.is_active ? 0 : 1;
      setBanners(bs => bs.map(b => b.id === banner.id ? { ...b, is_active: newActiveState } : b));
      
      const payload = {
        is_active: newActiveState === 1
      };

      await apiClient.put(`/v1/admin/company-banners/${banner.id}`, payload);
      showToast(`Bannière ${newActiveState ? 'activée' : 'désactivée'}.`);
    } catch (err) {
      await fetchData();
      showToast("Erreur lors de la modification du statut.", "error");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setEditForm({ ...editForm, image_url: '' }); 
    }
  };

  const handleTranslationChange = (field, value) => {
    setEditForm({
      ...editForm,
      translations: {
        ...editForm.translations,
        [activeLang]: {
          ...editForm.translations[activeLang],
          [field]: value
        }
      }
    });
  };

  const handleAutoTranslate = async () => {
    const sourceLangId = activeLang;
    const sourceLang = languages.find(l => l.id === sourceLangId);
    if (!sourceLang) return;
    const sourceCode = sourceLang.code.split('-')[0];
    
    const sourceTitle = editForm.translations[sourceLangId]?.title || '';
    const sourceSubtitle = editForm.translations[sourceLangId]?.subtitle || '';

    if (!sourceTitle && !sourceSubtitle) {
      showToast("Veuillez remplir au moins un champ dans la langue source pour traduire.", "error");
      return;
    }

    setAutoTranslateLoading(true);
    let newTranslations = { ...editForm.translations };
    
    try {
      for (const lang of languages) {
        if (lang.id === sourceLangId) continue;
        const targetCode = lang.code.split('-')[0];
        
        let translatedTitle = newTranslations[lang.id]?.title || '';
        let translatedSubtitle = newTranslations[lang.id]?.subtitle || '';

        const translateText = async (text) => {
          if (!text || !text.trim()) return '';
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          const data = await res.json();
          return data && data[0] ? data[0].map(item => item[0]).join('') : text;
        };

        if (sourceTitle) translatedTitle = await translateText(sourceTitle);
        if (sourceSubtitle) translatedSubtitle = await translateText(sourceSubtitle);

        newTranslations[lang.id] = {
          title: translatedTitle,
          subtitle: translatedSubtitle
        };
      }

      setEditForm(prev => ({
        ...prev,
        translations: newTranslations
      }));

      showToast("Traduction automatique réussie.", "success");
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la traduction.", "error");
    } finally {
      setAutoTranslateLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const formData = new FormData();
      const primaryTrans = editForm.translations[1] || editForm.translations['1'] || Object.values(editForm.translations)[0] || {};
      if (primaryTrans.title) formData.append('title', primaryTrans.title);
      if (primaryTrans.subtitle) formData.append('subtitle', primaryTrans.subtitle);

      formData.append('translations', JSON.stringify(editForm.translations));
      formData.append('sort_order', editForm.sort_order);
      formData.append('is_active', editForm.is_active === 1 ? 1 : 0);
      formData.append('target_role', editForm.target_role || 'all');
      formData.append('country_code', editForm.country_code || '');
      formData.append('region_id', editForm.region_id || '');
      formData.append('prefecture_id', editForm.prefecture_id || '');
      formData.append('commune_id', editForm.commune_id || '');
      
      if (editForm.action_url) {
          formData.append('action_url', editForm.action_url);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editForm.image_url) {
        formData.append('image_url', editForm.image_url);
      }

      if (isEditing) {
        formData.append('_method', 'PUT');
        await apiClient.post(`/v1/admin/company-banners/${editForm.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast("Bannière modifiée avec succès.");
      } else {
        await apiClient.post('/v1/admin/company-banners', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast("Bannière ajoutée avec succès.");
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Une erreur s'est produite lors de la sauvegarde.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MainLayout title="Bannières Dashboard">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(20px); }
        
        .page-container {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          border: 1px solid #E4E4E7;
          min-height: calc(100vh - 120px);
        }

        .ad-card { background: #FFFFFF; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #E2E8F0; transition: all 0.3s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .ad-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #CBD5E1; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .image-container { width: 100%; height: 140px; border-radius: 12px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #E2E8F0; margin-bottom: 16px; }
        .image-container img { width: 100%; height: 100%; object-fit: cover; }
        .badge { background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
        .badge.active { background: #ECFDF5; color: #059669; }
        .card-actions { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; }
        .action-btn { background: transparent; border: none; color: #64748B; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; transition: 0.2s; }
        .action-btn:hover { background: #F1F5F9; color: #0F1923; }
        .action-btn.delete:hover { background: #FEF2F2; color: #EF4444; }
        
        .input-field { width: 100%; padding: 12px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; fontSize: 14px; outline: none; transition: 0.2s; background: #F8FAFC; box-sizing: border-box; }
        .input-field:focus { border-color: #1A6FD4; background: #FFFFFF; box-shadow: 0 0 0 4px rgba(26,111,212,0.1); }
        
        .lang-tab { padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
        .lang-tab.active { background: #E0F2FE; color: #0284C7; border-color: #BAE6FD; }
        .lang-tab:not(.active) { color: #64748B; background: #F8FAFC; border-color: #E2E8F0; }
        .lang-tab:not(.active):hover { background: #F1F5F9; color: #0F1923; }

        .image-upload-area { border: 2px dashed #CBD5E1; border-radius: 12px; padding: 32px 20px; text-align: center; background: #F8FAFC; cursor: pointer; transition: 0.2s; }
        .image-upload-area:hover { border-color: #1A6FD4; background: #F0F7FF; }
        
        .mobile-mockup {
          width: 300px;
          height: 600px;
          background: #FFFFFF;
          border-radius: 36px;
          border: 8px solid #0F1923;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
        }
        
        .mockup-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 24px;
          background: #0F1923;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          z-index: 10;
        }
        
        .banner-preview-card {
           background: #1E293B; /* Fallback for no image */
           border-radius: 16px;
           overflow: hidden;
           margin: 16px;
           margin-top: 48px;
           color: white;
           position: relative;
           min-height: 140px;
           display: flex;
           flex-direction: column;
           justify-content: flex-end;
           background-size: cover;
           background-position: center;
        }
        
        .banner-preview-overlay {
           background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
           position: absolute;
           inset: 0;
           z-index: 1;
        }

        .banner-preview-content {
           position: relative;
           z-index: 2;
           padding: 16px;
        }
      `}</style>
      
      <div className="page-container">
        
        {toast && (
          <div style={{ padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', color: toast.type === 'error' ? '#991B1B' : '#065F46', border: `1px solid ${toast.type === 'error' ? '#FEE2E2' : '#D1FAE5'}` }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: '500' }}>{toast.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
              Contrôle des Sliders & Bannières
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#64748B', fontSize: '15px' }}>
              Supervision et ciblage précis des sliders mobiles pour chaque catégorie d'utilisateurs.
            </p>
          </div>
          
          <button 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1A6FD4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,111,212,0.2)', transition: '0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} />
            Nouveau Slider
          </button>
        </div>

        {/* Barre d'onglets Rôles et Recherche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', background: 'white', padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Role Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedRoleTab('all')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: '0.2s',
                background: selectedRoleTab === 'all' ? '#0F172A' : '#F1F5F9',
                color: selectedRoleTab === 'all' ? 'white' : '#64748B'
              }}
            >
              <LayoutTemplate size={15} />
              Tous ({roleCounts.all})
            </button>
            <button
              onClick={() => setSelectedRoleTab('candidate')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: '0.2s',
                background: selectedRoleTab === 'candidate' ? '#EA580C' : '#FFF7ED',
                color: selectedRoleTab === 'candidate' ? 'white' : '#C2410C'
              }}
            >
              <Users size={15} />
              Candidats / Secrétaires ({roleCounts.candidate})
            </button>
            <button
              onClick={() => setSelectedRoleTab('company')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: '0.2s',
                background: selectedRoleTab === 'company' ? '#2563EB' : '#EFF6FF',
                color: selectedRoleTab === 'company' ? 'white' : '#1D4ED8'
              }}
            >
              <Building2 size={15} />
              Entreprises ({roleCounts.company})
            </button>
            <button
              onClick={() => setSelectedRoleTab('visitor')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: '0.2s',
                background: selectedRoleTab === 'visitor' ? '#0284C7' : '#F0F9FF',
                color: selectedRoleTab === 'visitor' ? 'white' : '#0369A1'
              }}
            >
              <UserCheck size={15} />
              Visiteurs ({roleCounts.visitor})
            </button>
            <button
              onClick={() => setSelectedRoleTab('global_all')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: '0.2s',
                background: selectedRoleTab === 'global_all' ? '#16A34A' : '#F0FDF4',
                color: selectedRoleTab === 'global_all' ? 'white' : '#15803D'
              }}
            >
              <Globe size={15} />
              Tous les rôles ({roleCounts.global_all})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher un slider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                borderRadius: '10px', border: '1px solid #E2E8F0',
                fontSize: '13px', outline: 'none', background: '#F8FAFC',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={40} color="#1A6FD4" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#64748B', fontWeight: '500' }}>Chargement des sliders...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0', animation: 'fadeIn 0.4s ease-out' }}>
            <LayoutTemplate size={64} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: '#0F1923', fontWeight: '700', marginBottom: '8px' }}>
              {searchTerm ? 'Aucun slider correspondant à votre recherche' : 'Aucun slider trouvé pour ce rôle'}
            </h3>
            <p style={{ color: '#64748B', maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.5' }}>
              Configurez des sliders personnalisés pour afficher des opportunités, guides et annonces à cette audience.
            </p>
            <button 
              onClick={openAddModal}
              style={{ background: 'white', border: '1.5px solid #E2E8F0', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', color: '#0F1923', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#1A6FD4'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              Créer un slider maintenant
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredBanners.map((b, index) => {
              const transTitle = b.translations?.[1]?.title || b.title || 'Sans titre';
              const transSubtitle = b.translations?.[1]?.subtitle || b.subtitle || 'Aucun sous-titre';

              return (
              <div key={b.id} className="ad-card" style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
                
                <div className="card-header">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className={`badge ${b.is_active ? 'active' : ''}`}>
                      {b.is_active ? 'En ligne' : 'Brouillon'}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: b.target_role === 'visitor' ? '#E0F2FE' : b.target_role === 'candidate' ? '#FFEDD5' : b.target_role === 'all' ? '#DCFCE7' : '#EFF6FF',
                      color: b.target_role === 'visitor' ? '#0369A1' : b.target_role === 'candidate' ? '#C2410C' : b.target_role === 'all' ? '#15803D' : '#1D4ED8',
                    }}>
                      {b.target_role === 'visitor' ? '👤 Visiteur' : b.target_role === 'candidate' ? '👤 Candidat / Secrétaire' : b.target_role === 'all' ? '🌐 Tous les rôles' : '🏢 Entreprise'}
                    </span>
                    {getGeoBadge(b)}
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={b.is_active} onChange={() => handleToggleActive(b)} />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="image-container">
                  {b.image_url ? (
                    <img src={b.image_url} alt={transTitle} />
                  ) : (
                    <ImageIcon size={32} color="#CBD5E1" />
                  )}
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0F1923', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {transTitle}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {transSubtitle}
                  </p>
                </div>
                
                <div className="card-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.sort_order}
                    </div>
                    <span>Ordre</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEditModal(b)} className="action-btn" title="Modifier">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => confirmDelete(b)} className="action-btn delete" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Modal Ajout/Édition */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 25, 35, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div style={{ display: 'flex', gap: '32px', width: '100%', maxWidth: '1100px', maxHeight: '90vh' }}>
            
            {/* Formulaire (Gauche) */}
            <div style={{ flex: 1, background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0F1923' }}>
                  {isEditing ? 'Modifier la Bannière' : 'Nouvelle Bannière'}
                </h3>
                <button 
                  onClick={() => !actionLoading && setShowModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F1923'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto' }} className="custom-scrollbar">
                <form id="bannerForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Upload Image */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Image d'illustration *</label>
                    <label className="image-upload-area" style={{ display: 'block', position: 'relative' }}>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }} />
                      <UploadCloud size={32} color="#64748B" style={{ margin: '0 auto 12px' }} />
                      <div style={{ color: '#0F1923', fontWeight: '600', marginBottom: '4px' }}>Cliquez pour choisir une image</div>
                      <div style={{ color: '#64748B', fontSize: '13px' }}>JPG, PNG, WEBP (Max 5MB)</div>
                    </label>

                    <div style={{ textAlign: 'center', margin: '16px 0', color: '#94A3B8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>OU</div>
                    
                    <input
                      type="url"
                      value={editForm.image_url}
                      onChange={e => {
                        setEditForm({...editForm, image_url: e.target.value});
                        if (e.target.value) {
                            setPreviewImage(e.target.value);
                            setImageFile(null);
                        }
                      }}
                      className="input-field"
                      placeholder="Collez l'URL d'une image (https://...)"
                    />
                  </div>

                  {/* Traductions */}
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {languages.map((lang) => (
                          <div 
                            key={lang.id} 
                            className={`lang-tab ${activeLang === lang.id ? 'active' : ''}`} 
                            onClick={() => setActiveLang(lang.id)}
                          >
                            {lang.flag_url ? (
                              <img src={lang.flag_url} alt={lang.code} style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px', display: 'inline-block', marginRight: '6px' }} />
                            ) : (
                              <span style={{ marginRight: '6px' }}>🌐</span>
                            )}
                            {lang.native_name || lang.name || lang.code.toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoTranslate}
                        disabled={autoTranslateLoading}
                        style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#0F1923', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        {autoTranslateLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Languages size={16} color="#0284C7" />}
                        Traduction Auto
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>
                          Titre principal ({languages.find(l => l.id === activeLang)?.native_name || languages.find(l => l.id === activeLang)?.name || languages.find(l => l.id === activeLang)?.code.toUpperCase() || 'FR'})
                        </label>
                        <input
                          type="text"
                          value={editForm.translations[activeLang]?.title || ''}
                          onChange={e => handleTranslationChange('title', e.target.value)}
                          className="input-field"
                          placeholder="Ex: Nouvelle offre !"
                          style={{ background: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>
                          Sous-titre ({languages.find(l => l.id === activeLang)?.native_name || languages.find(l => l.id === activeLang)?.name || languages.find(l => l.id === activeLang)?.code.toUpperCase() || 'FR'})
                        </label>
                        <input
                          type="text"
                          value={editForm.translations[activeLang]?.subtitle || ''}
                          onChange={e => handleTranslationChange('subtitle', e.target.value)}
                          className="input-field"
                          placeholder="Une petite description..."
                          style={{ background: 'white' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Rôle ciblé (Audience)</label>
                    <select
                      value={editForm.target_role || 'company'}
                      onChange={e => setEditForm({...editForm, target_role: e.target.value})}
                      className="input-field"
                    >
                      <option value="visitor">Visiteur (Dashboard Visiteur)</option>
                      <option value="company">Entreprise (Dashboard Recruteur)</option>
                      <option value="candidate">Candidat (Dashboard Candidat)</option>
                      <option value="all">Tous (Accessible à tous)</option>
                    </select>
                  </div>

                  {/* Ciblage Géographique (Base de Données) */}
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F1923', marginBottom: '4px' }}>
                      📍 Ciblage Géographique (Base de Données)
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                      Les pays, régions, préfectures et communes sont chargés dynamiquement depuis la base de données. Laissez vide pour une diffusion globale.
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      {/* Pays */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>1. Pays</label>
                        <select
                          value={editForm.country_code || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setEditForm({
                              ...editForm,
                              country_code: val,
                              region_id: '',
                              prefecture_id: '',
                              commune_id: ''
                            });
                          }}
                          className="input-field"
                          style={{ background: 'white' }}
                        >
                          <option value="">Tous les pays (Mondial)</option>
                          {countries.map((c) => (
                            <option key={c.id} value={c.code}>
                              {getLocationName(c, c.code)} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Région */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: editForm.country_code ? '#334155' : '#94A3B8' }}>2. Région</label>
                        {(() => {
                          const selectedCountryObj = countries.find(c => String(c.code).toUpperCase() === String(editForm.country_code).toUpperCase());
                          const availableRegions = editForm.country_code && selectedCountryObj
                            ? regions.filter(r => String(r.country_id) === String(selectedCountryObj.id))
                            : [];
                          const hasCountry = Boolean(editForm.country_code);

                          return (
                            <select
                              value={editForm.region_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditForm({
                                  ...editForm,
                                  region_id: val,
                                  prefecture_id: '',
                                  commune_id: ''
                                });
                              }}
                              disabled={!hasCountry}
                              className="input-field"
                              style={{ 
                                background: hasCountry ? 'white' : '#F1F5F9',
                                cursor: hasCountry ? 'pointer' : 'not-allowed',
                                color: hasCountry ? '#0F172A' : '#94A3B8'
                              }}
                            >
                              {!hasCountry ? (
                                <option value="">— Veuillez d'abord choisir un pays —</option>
                              ) : (
                                <>
                                  <option value="">Toutes les régions ({getLocationName(selectedCountryObj, editForm.country_code)})</option>
                                  {availableRegions.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {getLocationName(r, r.code || `Région #${r.id}`)}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          );
                        })()}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Préfecture */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: editForm.region_id ? '#334155' : '#94A3B8' }}>3. Préfecture</label>
                        {(() => {
                          const selectedRegionObj = regions.find(r => String(r.id) === String(editForm.region_id));
                          const availablePrefectures = editForm.region_id
                            ? prefectures.filter(p => String(p.region_id) === String(editForm.region_id))
                            : [];
                          const hasRegion = Boolean(editForm.region_id);

                          return (
                            <select
                              value={editForm.prefecture_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditForm({
                                  ...editForm,
                                  prefecture_id: val,
                                  commune_id: ''
                                });
                              }}
                              disabled={!hasRegion}
                              className="input-field"
                              style={{ 
                                background: hasRegion ? 'white' : '#F1F5F9',
                                cursor: hasRegion ? 'pointer' : 'not-allowed',
                                color: hasRegion ? '#0F172A' : '#94A3B8'
                              }}
                            >
                              {!hasRegion ? (
                                <option value="">— Veuillez d'abord choisir une région —</option>
                              ) : (
                                <>
                                  <option value="">Toutes les préfectures ({getLocationName(selectedRegionObj, 'Région')})</option>
                                  {availablePrefectures.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {getLocationName(p, p.code || `Préfecture #${p.id}`)}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          );
                        })()}
                      </div>

                      {/* Commune / Ville */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: editForm.prefecture_id ? '#334155' : '#94A3B8' }}>4. Commune / Ville</label>
                        {(() => {
                          const selectedPrefObj = prefectures.find(p => String(p.id) === String(editForm.prefecture_id));
                          const availableCommunes = editForm.prefecture_id
                            ? communes.filter(c => String(c.prefecture_id) === String(editForm.prefecture_id))
                            : [];
                          const hasPrefecture = Boolean(editForm.prefecture_id);

                          return (
                            <select
                              value={editForm.commune_id || ''}
                              onChange={e => setEditForm({ ...editForm, commune_id: e.target.value })}
                              disabled={!hasPrefecture}
                              className="input-field"
                              style={{ 
                                background: hasPrefecture ? 'white' : '#F1F5F9',
                                cursor: hasPrefecture ? 'pointer' : 'not-allowed',
                                color: hasPrefecture ? '#0F172A' : '#94A3B8'
                              }}
                            >
                              {!hasPrefecture ? (
                                <option value="">— Veuillez d'abord choisir une préfecture —</option>
                              ) : (
                                <>
                                  <option value="">Toutes les communes ({getLocationName(selectedPrefObj, 'Préfecture')})</option>
                                  {availableCommunes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {getLocationName(c, c.code || `Commune #${c.id}`)}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Action URL (Lien de redirection)</label>
                    <input
                      type="url"
                      value={editForm.action_url}
                      onChange={e => setEditForm({...editForm, action_url: e.target.value})}
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Ordre d'affichage</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editForm.sort_order}
                        onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Statut initial</label>
                      <select
                        value={editForm.is_active}
                        onChange={e => setEditForm({...editForm, is_active: parseInt(e.target.value)})}
                        className="input-field"
                      >
                        <option value={1}>Actif (En ligne)</option>
                        <option value={0}>Inactif (Brouillon)</option>
                      </select>
                    </div>
                  </div>

                </form>
              </div>
              
              <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  style={{ background: 'white', border: '1.5px solid #E2E8F0', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  form="bannerForm"
                  disabled={actionLoading}
                  style={{ background: '#1A6FD4', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: '600', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 12px rgba(26,111,212,0.2)' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {actionLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (isEditing ? 'Mettre à jour' : 'Ajouter la bannière')}
                </button>
              </div>
            </div>
            
            {/* Aperçu Mobile (Droite) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="mobile-mockup" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div className="mockup-notch"></div>
                
                {/* Header Mockup */}
                <div style={{ padding: '40px 16px 16px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '20px', color: '#0F1923', lineHeight: '1' }}>révolution</div>
                            <div style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>Welcome back</div>
                        </div>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9' }}></div>
                    </div>
                </div>

                {/* Banner Preview */}
                <div 
                    className="banner-preview-card"
                    style={{
                        backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                    }}
                >
                    <div className="banner-preview-overlay"></div>
                    <div className="banner-preview-content">
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>
                            {editForm.translations[activeLang].title || 'Titre de la bannière'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: '1.4' }}>
                            {editForm.translations[activeLang].subtitle || 'Le sous-titre s\'affichera ici.'}
                        </p>
                    </div>
                </div>

                {/* Other mockup elements to make it look realistic */}
                <div style={{ display: 'flex', gap: '12px', padding: '0 16px' }}>
                    <div style={{ flex: 1, height: '100px', background: '#F8FAFC', borderRadius: '12px' }}></div>
                    <div style={{ flex: 1, height: '100px', background: '#F8FAFC', borderRadius: '12px' }}></div>
                    <div style={{ flex: 1, height: '100px', background: '#F8FAFC', borderRadius: '12px' }}></div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer le slider"
        message={`Voulez-vous vraiment supprimer définitivement « ${deleteConfirm.title} » ?`}
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteConfirm.loading}
        onConfirm={executeDelete}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </MainLayout>
  );
};
