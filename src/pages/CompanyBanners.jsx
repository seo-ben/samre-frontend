import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, LayoutTemplate, Smartphone, UploadCloud, Languages } from 'lucide-react';

export const CompanyBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoTranslateLoading, setAutoTranslateLoading] = useState(false);
  
  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form State
  const [activeLang, setActiveLang] = useState(1); // 1=FR, 2=EN, 3=PT
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  
  const getTranslationData = (banner, langId) => {
    if (banner && banner.translations && banner.translations[langId]) {
      return banner.translations[langId];
    }
    return { title: '', subtitle: '' };
  };

  const [editForm, setEditForm] = useState({
    translations: {
      1: { title: '', subtitle: '' },
      2: { title: '', subtitle: '' },
      3: { title: '', subtitle: '' }
    },
    image_url: '',
    action_url: '',
    sort_order: 1,
    is_active: 1
  });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/admin/company-banners');
      const data = (res.data.data || res.data).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setBanners(data);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement des bannières.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage('');
    setActiveLang(1);
    
    setEditForm({
      translations: {
        1: { title: '', subtitle: '' },
        2: { title: '', subtitle: '' },
        3: { title: '', subtitle: '' }
      },
      image_url: '',
      action_url: '',
      sort_order: (banners.length > 0 ? banners[banners.length - 1].sort_order + 1 : 1),
      is_active: 1,
    });
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setIsEditing(true);
    setImageFile(null);
    setActiveLang(1);
    setPreviewImage(banner.image_url || '');

    setEditForm({
      id: banner.id,
      translations: {
        1: getTranslationData(banner, 1),
        2: getTranslationData(banner, 2),
        3: getTranslationData(banner, 3)
      },
      image_url: banner.image_url || '',
      action_url: banner.action_url || '',
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active ? 1 : 0,
    });
    
    // Support legacy data
    if (!banner.translations && banner.title) {
        setEditForm(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                1: { title: banner.title || '', subtitle: banner.subtitle || '' }
            }
        }));
    }

    setShowModal(true);
  };

  const confirmDelete = (banner) => {
    setDeletingId(banner.id);
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/v1/admin/company-banners/${deletingId}`);
      await fetchBanners();
      setShowConfirmDelete(false);
      setDeletingId(null);
      showToast("Bannière supprimée avec succès.", "success");
    } catch (err) {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setActionLoading(false);
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
      await fetchBanners();
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
    const langCodes = { 1: 'fr', 2: 'en', 3: 'pt' };
    
    const targetLangs = [1, 2, 3].filter(id => id !== sourceLangId);
    const sourceData = editForm.translations[sourceLangId];

    if (!sourceData.title && !sourceData.subtitle) {
      showToast("Veuillez remplir au moins un champ dans la langue source pour traduire.", "error");
      return;
    }

    setAutoTranslateLoading(true);
    try {
      const textsToTranslate = [];
      const mapping = []; 

      if (sourceData.title) {
        textsToTranslate.push(sourceData.title);
        mapping.push('title');
      }
      if (sourceData.subtitle) {
        textsToTranslate.push(sourceData.subtitle);
        mapping.push('subtitle');
      }

      const newTranslations = { ...editForm.translations };

      for (const targetLangId of targetLangs) {
        const res = await apiClient.post('/v1/admin/translate', {
          texts: textsToTranslate,
          source_lang: langCodes[sourceLangId],
          target_lang: langCodes[targetLangId]
        });

        const translatedTexts = res.data.translations;
        
        mapping.forEach((field, index) => {
          newTranslations[targetLangId] = {
            ...newTranslations[targetLangId],
            [field]: translatedTexts[index]
          };
        });
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
      formData.append('translations', JSON.stringify(editForm.translations));
      formData.append('sort_order', editForm.sort_order);
      formData.append('is_active', editForm.is_active === 1 ? 1 : 0);
      
      if (editForm.action_url) {
          formData.append('action_url', editForm.action_url);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editForm.image_url) {
        formData.append('image_url', editForm.image_url);
      }

      if (isEditing) {
        // formData can be tricky with PUT, standard approach is POST with _method=PUT
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
      fetchBanners();
    } catch (err) {
      console.error(err);
      showToast("Une erreur s'est produite lors de la sauvegarde.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MainLayout title="Bannières Dashboard Entreprise">
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
              Bannières Entreprise
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#64748B', fontSize: '15px' }}>
              Gérez le slider dynamique affiché sur le tableau de bord des recruteurs.
            </p>
          </div>
          
          <button 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1A6FD4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,111,212,0.2)', transition: '0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} />
            Nouvelle Bannière
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={40} color="#1A6FD4" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#64748B', fontWeight: '500' }}>Chargement des bannières...</p>
          </div>
        ) : banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0', animation: 'fadeIn 0.4s ease-out' }}>
            <LayoutTemplate size={64} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: '#0F1923', fontWeight: '700', marginBottom: '8px' }}>Aucune bannière active</h3>
            <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>Créez votre première bannière pour animer le tableau de bord des entreprises.</p>
            <button 
              onClick={openAddModal}
              style={{ background: 'white', border: '1.5px solid #E2E8F0', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', color: '#0F1923', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#1A6FD4'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              Créer maintenant
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {banners.map((b, index) => {
              const transTitle = b.translations?.[1]?.title || b.title || 'Sans titre';
              const transSubtitle = b.translations?.[1]?.subtitle || b.subtitle || 'Aucun sous-titre';

              return (
              <div key={b.id} className="ad-card" style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
                
                <div className="card-header">
                  <div className={`badge ${b.is_active ? 'active' : ''}`}>
                    {b.is_active ? 'En ligne' : 'Brouillon'}
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className={`lang-tab ${activeLang === 1 ? 'active' : ''}`} onClick={() => setActiveLang(1)}>FR Français</div>
                        <div className={`lang-tab ${activeLang === 2 ? 'active' : ''}`} onClick={() => setActiveLang(2)}>EN English</div>
                        <div className={`lang-tab ${activeLang === 3 ? 'active' : ''}`} onClick={() => setActiveLang(3)}>PT Português</div>
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Titre principal ({activeLang === 1 ? 'FR' : activeLang === 2 ? 'EN' : 'PT'})</label>
                        <input
                          type="text"
                          value={editForm.translations[activeLang].title}
                          onChange={e => handleTranslationChange('title', e.target.value)}
                          className="input-field"
                          placeholder="Ex: Nouvelle offre !"
                          style={{ background: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Sous-titre ({activeLang === 1 ? 'FR' : activeLang === 2 ? 'EN' : 'PT'})</label>
                        <input
                          type="text"
                          value={editForm.translations[activeLang].subtitle}
                          onChange={e => handleTranslationChange('subtitle', e.target.value)}
                          className="input-field"
                          placeholder="Une petite description..."
                          style={{ background: 'white' }}
                        />
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
      {showConfirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 25, 35, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out' }}>
            
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={32} color="#EF4444" />
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700', color: '#0F1923' }}>Supprimer la bannière ?</h3>
            <p style={{ margin: '0 0 28px 0', color: '#64748B', lineHeight: '1.5' }}>Cette action est irréversible. La bannière sera définitivement retirée du tableau de bord des entreprises.</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowConfirmDelete(false)}
                disabled={actionLoading}
                style={{ flex: 1, background: 'white', border: '1.5px solid #E2E8F0', padding: '12px', borderRadius: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={executeDelete}
                disabled={actionLoading}
                style={{ flex: 1, background: '#EF4444', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '600', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {actionLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
