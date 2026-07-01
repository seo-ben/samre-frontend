import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, PlayCircle, Upload, Globe, Wand2 } from 'lucide-react';

export const AdPages = () => {
  const [adPages, setAdPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeLang, setActiveLang] = useState(1); // 1: FR, 2: EN, 3: PT
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Toast (Notifications)
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchAdPages();
  }, []);

  const fetchAdPages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/admin/cms/ad-pages');
      const data = (res.data.data || res.data).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setAdPages(data);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement des publicités.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getTranslationField = (ad, field, langId = 1) => {
    if (ad.translations && ad.translations.length > 0) {
      const t = ad.translations.find(t => t.language_id === langId) || ad.translations[0];
      return t[field] || '';
    }
    return '';
  };

  const getTranslationData = (ad, langId) => {
    if (ad.translations && ad.translations.length > 0) {
      const t = ad.translations.find(t => t.language_id === langId);
      if (t) return { title: t.title || '', subtitle: t.subtitle || '', cta_label: t.cta_label || '' };
    }
    return { title: '', subtitle: '', cta_label: '' };
  };

  const openAddModal = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage(null);
    setActiveLang(1);
    setEditForm({
      translations: {
        1: { title: '', subtitle: '', cta_label: '' },
        2: { title: '', subtitle: '', cta_label: '' },
        3: { title: '', subtitle: '', cta_label: '' }
      },
      image_url: '',
      sort_order: (adPages.length > 0 ? adPages[adPages.length - 1].sort_order + 1 : 1),
      duration_seconds: 5,
      is_skippable: 1,
      is_active: 1,
      text_position: 'bottom',
      image_style: 'cover'
    });
    setShowModal(true);
  };

  const openEditModal = (ad) => {
    setIsEditing(true);
    setImageFile(null);
    setActiveLang(1);
    
    let imageUrl = '';
    if (ad.translations && ad.translations.length > 0) {
      imageUrl = ad.translations[0].image_url || '';
    }

    setPreviewImage(imageUrl);
    setEditForm({
      id: ad.id,
      translations: {
        1: getTranslationData(ad, 1),
        2: getTranslationData(ad, 2),
        3: getTranslationData(ad, 3),
      },
      image_url: imageUrl,
      sort_order: ad.sort_order || 0,
      duration_seconds: ad.duration_seconds || 5,
      is_skippable: ad.is_skippable !== undefined ? (ad.is_skippable ? 1 : 0) : 1,
      is_active: ad.is_active !== undefined ? (ad.is_active ? 1 : 0) : 1,
      text_position: ad.text_position || 'bottom',
      image_style: ad.image_style || 'cover'
    });
    setShowModal(true);
  };

  const confirmDelete = (ad) => {
    setDeletingId(ad.id);
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/v1/admin/cms/ad-pages/${deletingId}`);
      await fetchAdPages();
      setShowConfirmDelete(false);
      setDeletingId(null);
      showToast("Publicité supprimée avec succès.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la suppression.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setEditForm({ ...editForm, image_url: '' }); // Clear URL if file selected
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
    const sourceCode = langCodes[sourceLangId];
    
    const sourceTitle = editForm.translations[sourceLangId]?.title || '';
    const sourceSubtitle = editForm.translations[sourceLangId]?.subtitle || '';
    const sourceCta = editForm.translations[sourceLangId]?.cta_label || '';

    if (!sourceTitle && !sourceSubtitle && !sourceCta) {
      showToast("Veuillez remplir au moins un champ avant de traduire.", "error");
      return;
    }

    setIsTranslating(true);
    let newTranslations = { ...editForm.translations };
    
    try {
      for (const langId of [1, 2, 3]) {
        if (langId === sourceLangId) continue;
        const targetCode = langCodes[langId];
        
        let translatedTitle = newTranslations[langId]?.title || '';
        let translatedSubtitle = newTranslations[langId]?.subtitle || '';
        let translatedCta = newTranslations[langId]?.cta_label || '';

        const translateText = async (text) => {
          if (!text.trim()) return '';
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          const data = await res.json();
          return data && data[0] ? data[0].map(item => item[0]).join('') : text;
        };

        if (sourceTitle) translatedTitle = await translateText(sourceTitle);
        if (sourceSubtitle) translatedSubtitle = await translateText(sourceSubtitle);
        if (sourceCta) translatedCta = await translateText(sourceCta);

        newTranslations[langId] = {
          title: translatedTitle,
          subtitle: translatedSubtitle,
          cta_label: translatedCta
        };
      }
      setEditForm({ ...editForm, translations: newTranslations });
      showToast("Traduction automatique terminée !", "success");
    } catch (err) {
      console.error("Translation error", err);
      showToast("Erreur lors de la traduction.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    const formData = new FormData();
    formData.append('sort_order', editForm.sort_order);
    formData.append('duration_seconds', editForm.duration_seconds);
    formData.append('is_skippable', editForm.is_skippable === 1 ? 1 : 0);
    formData.append('is_active', editForm.is_active === 1 ? 1 : 0);
    formData.append('text_position', editForm.text_position);
    formData.append('image_style', editForm.image_style);
    formData.append('translations', JSON.stringify(editForm.translations));
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (editForm.image_url) {
      formData.append('image_url', editForm.image_url);
    }

    try {
      if (isEditing) {
        formData.append('_method', 'PUT');
        await apiClient.post(`/v1/admin/cms/ad-pages/${editForm.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast("Publicité modifiée avec succès.");
      } else {
        await apiClient.post(`/v1/admin/cms/ad-pages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast("Publicité ajoutée avec succès.");
      }
      setShowModal(false);
      await fetchAdPages();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      const newActiveState = ad.is_active ? 0 : 1;
      setAdPages(ads => ads.map(a => a.id === ad.id ? { ...a, is_active: newActiveState } : a));
      
      const payload = {
        is_active: newActiveState,
        sort_order: ad.sort_order,
        duration_seconds: ad.duration_seconds,
        is_skippable: ad.is_skippable,
        text_position: ad.text_position,
        image_style: ad.image_style
      };

      await apiClient.put(`/v1/admin/cms/ad-pages/${ad.id}`, payload);
      showToast(`Publicité ${newActiveState ? 'activée' : 'désactivée'}.`);
    } catch (err) {
      await fetchAdPages();
      showToast("Erreur lors de la modification du statut.", "error");
    }
  };

  return (
    <MainLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(20px); }
        
        .ad-card { background: #FFFFFF; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #E2E8F0; transition: all 0.3s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .ad-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #CBD5E1; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .image-container { width: 80px; height: 80px; border-radius: 12px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #E2E8F0; }
        .image-container img { width: 100%; height: 100%; object-fit: cover; }
        .badge { background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
        .badge.active { background: #ECFDF5; color: #059669; }
        .card-actions { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; }
        .action-btn { background: transparent; border: none; color: #64748B; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; transition: 0.2s; }
        .action-btn:hover { background: #F1F5F9; color: #0F1923; }
        .action-btn.delete:hover { background: #FEF2F2; color: #EF4444; }
        
        .input-field { width: 100%; padding: 12px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; fontSize: 14px; outline: none; transition: 0.2s; background: #F8FAFC; box-sizing: border-box; }
        .input-field:focus { border-color: #1A6FD4; background: #FFFFFF; box-shadow: 0 0 0 4px rgba(26,111,212,0.1); }
        .file-upload-wrapper { position: relative; overflow: hidden; display: inline-block; cursor: pointer; width: 100%; }
        .file-upload-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; height: 100%; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
        
        .mobile-preview-container { width: 320px; height: 600px; background: #000; border-radius: 36px; padding: 8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; flex-shrink: 0; }
        .mobile-screen { width: 100%; height: 100%; background: #1E293B; border-radius: 28px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
        
        .lang-tab { padding: 10px 20px; border-radius: 12px; border: 1.5px solid #E2E8F0; cursor: pointer; font-weight: 600; font-size: 14px; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .lang-tab.active { background: #1A6FD4; color: #FFF; border-color: #1A6FD4; box-shadow: 0 4px 12px rgba(26,111,212,0.2); }
        .lang-tab.inactive { background: #F8FAFC; color: #64748B; }
        .lang-tab.inactive:hover { background: #F1F5F9; color: #0F1923; }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
            Pages d'Onboarding
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#64748B' }}>
            Gérez les écrans d'accueil (Textes multilingues, upload d'images, prévisualisation).
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#1A6FD4', border: 'none', borderRadius: '12px', color: '#FFFFFF', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,111,212,0.25)', transition: 'all 0.2s ease' }}
        >
          <Plus size={20} /> Nouveau Slide
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#1A6FD4' }}>
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {adPages.map((ad) => (
            <div key={ad.id} className="ad-card">
              <div className="card-header">
                <div className="image-container">
                  {getTranslationField(ad, 'image_url') ? (
                    <img src={getTranslationField(ad, 'image_url')} alt={getTranslationField(ad, 'title')} style={{ objectFit: ad.image_style === 'contain' ? 'contain' : 'cover' }} />
                  ) : (
                    <ImageIcon size={28} color="#94A3B8" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`badge ${ad.is_active ? 'active' : ''}`}>Position {ad.sort_order}</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={ad.is_active} onChange={() => handleToggleActive(ad)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F1923', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getTranslationField(ad, 'title') || 'Sans titre'}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {getTranslationField(ad, 'subtitle') || 'Aucune description'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span className="badge" style={{ background: '#E2E8F0' }}>Texte: {ad.text_position}</span>
                <span className="badge" style={{ background: '#E2E8F0' }}>Image: {ad.image_style}</span>
              </div>
              
              <div className="card-actions">
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>ID: {ad.id}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="action-btn" onClick={() => openEditModal(ad)}><Edit2 size={18} /></button>
                  <button className="action-btn delete" onClick={() => confirmDelete(ad)}><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          
          <div style={{ display: 'flex', gap: '24px', maxWidth: '1000px', width: '100%', maxHeight: '95vh' }}>
            
            <div className="custom-scrollbar" style={{ flex: 1, background: '#FFFFFF', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
                  {isEditing ? 'Modifier la Page' : 'Ajouter une Page'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748B' }}>
                  <X size={18} style={{ margin: 'auto' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Image d'illustration (Commune aux langues) <span style={{ color: '#EF4444' }}>*</span></label>
                  
                  <div className="file-upload-wrapper" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '20px', textAlign: 'center', transition: '0.2s' }}>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    <Upload size={24} color="#64748B" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F1923' }}>Cliquez pour choisir une image de votre PC</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>JPG, PNG, WEBP (Max 5MB)</div>
                  </div>
                  
                  <div style={{ textAlign: 'center', margin: '12px 0', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>OU</div>
                  
                  <input 
                    type="url" placeholder="Coller une URL d'image (ex: https://...)"
                    value={editForm.image_url || ''} 
                    onChange={e => {
                      setEditForm({...editForm, image_url: e.target.value});
                      setPreviewImage(e.target.value);
                      setImageFile(null);
                    }}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Style de l'image</label>
                    <select className="input-field" value={editForm.image_style} onChange={e => setEditForm({...editForm, image_style: e.target.value})}>
                      <option value="cover">Plein Écran (Cover)</option>
                      <option value="contain">Centrée (Contain)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Position des Textes</label>
                    <select className="input-field" value={editForm.text_position} onChange={e => setEditForm({...editForm, text_position: e.target.value})}>
                      <option value="bottom">En Bas (Défaut)</option>
                      <option value="center">Au Milieu</option>
                      <option value="top">En Haut</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '32px', marginBottom: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0F1923', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} /> Traductions
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div onClick={() => setActiveLang(1)} className={`lang-tab ${activeLang === 1 ? 'active' : 'inactive'}`}>🇫🇷 Français</div>
                      <div onClick={() => setActiveLang(2)} className={`lang-tab ${activeLang === 2 ? 'active' : 'inactive'}`}>🇬🇧 English</div>
                      <div onClick={() => setActiveLang(3)} className={`lang-tab ${activeLang === 3 ? 'active' : 'inactive'}`}>🇵🇹 Português</div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={handleAutoTranslate}
                      disabled={isTranslating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', backgroundColor: '#F0F9FF',
                        color: '#0284C7', border: '1px solid #BAE6FD',
                        borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        cursor: isTranslating ? 'not-allowed' : 'pointer',
                        opacity: isTranslating ? 0.6 : 1
                      }}
                    >
                      {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      Traduction Auto
                    </button>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Titre principal ({activeLang === 1 ? 'FR' : activeLang === 2 ? 'EN' : 'PT'})</label>
                      <input 
                        type="text" required={activeLang === 1} placeholder="Trouvez votre futur..." 
                        value={editForm.translations[activeLang]?.title || ''} 
                        onChange={e => handleTranslationChange('title', e.target.value)} 
                        className="input-field" style={{ background: '#FFF' }} 
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Sous-titre / Description</label>
                      <textarea 
                        rows={2} placeholder="Accédez aux meilleures opportunités..." 
                        value={editForm.translations[activeLang]?.subtitle || ''} 
                        onChange={e => handleTranslationChange('subtitle', e.target.value)} 
                        className="input-field" style={{ resize: 'vertical', background: '#FFF' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Bouton CTA (Optionnel)</label>
                      <input 
                        type="text" placeholder="ex: Continuer" 
                        value={editForm.translations[activeLang]?.cta_label || ''} 
                        onChange={e => handleTranslationChange('cta_label', e.target.value)} 
                        className="input-field" style={{ background: '#FFF' }} 
                      />
                      <small style={{ color: '#94A3B8', marginTop: '4px', display: 'block' }}>Laisser vide pour la valeur par défaut ("Passer", "Continuer").</small>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '120px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Ordre</label>
                    <input type="number" min={0} value={editForm.sort_order ?? ''} onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})} className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_skippable === 1} onChange={e => setEditForm({...editForm, is_skippable: e.target.checked ? 1 : 0})} style={{ width: '18px', height: '18px', accentColor: '#1A6FD4' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Ignorable (Bouton Passer)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_active === 1} onChange={e => setEditForm({...editForm, is_active: e.target.checked ? 1 : 0})} style={{ width: '18px', height: '18px', accentColor: '#1A6FD4' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Visible (Actif)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                  <button type="submit" disabled={actionLoading} style={{ padding: '12px 32px', border: 'none', borderRadius: '10px', background: '#1A6FD4', color: '#FFFFFF', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {actionLoading && <Loader2 size={18} className="animate-spin" />}
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="mobile-preview-container">
              <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '24px', background: '#000', borderRadius: '12px', zIndex: 10 }}></div>
              <div className="mobile-screen">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: editForm.image_style === 'contain' ? 'contain' : 'cover' }} />
                  ) : <ImageIcon size={48} color="#475569" />}
                </div>

                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.95) 100%)' }}></div>

                {editForm.is_skippable === 1 && (
                  <div style={{ position: 'absolute', top: '48px', right: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '20px', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                      {activeLang === 1 ? 'PASSER' : activeLang === 2 ? 'SKIP' : 'PULAR'}
                    </div>
                  </div>
                )}

                <div style={{ 
                  position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, display: 'flex', padding: '24px', flexDirection: 'column',
                  justifyContent: editForm.text_position === 'top' ? 'flex-start' : (editForm.text_position === 'center' ? 'center' : 'flex-end'),
                  paddingTop: editForm.text_position === 'top' ? '100px' : '24px'
                }}>
                  
                  <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '800', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                      {editForm.translations?.[activeLang]?.title || 'Titre principal'}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                      {editForm.translations?.[activeLang]?.subtitle || 'Votre sous-titre apparaîtra ici avec un dégradé lisible.'}
                    </p>
                  </div>

                  {editForm.text_position !== 'bottom' && <div style={{ flex: 1 }}></div>}
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                      <div style={{ width: '20px', height: '6px', background: '#F39C12', borderRadius: '4px' }}></div>
                      <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}></div>
                      <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ background: '#F39C12', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        {editForm.translations?.[activeLang]?.cta_label || (activeLang === 1 ? 'Continuer' : activeLang === 2 ? 'Continue' : 'Continuar')}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700' }}>Supprimer ?</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button onClick={() => setShowConfirmDelete(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>Annuler</button>
              <button onClick={executeDelete} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#FFF', cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 10001, background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', padding: '16px 24px', borderRadius: '12px', color: toast.type === 'error' ? '#DC2626' : '#059669', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <span style={{ fontWeight: '600' }}>{toast.message}</span>
        </div>
      )}
    </MainLayout>
  );
};
