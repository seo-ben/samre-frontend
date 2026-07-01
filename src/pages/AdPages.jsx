import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, PlayCircle, Upload } from 'lucide-react';

export const AdPages = () => {
  const [adPages, setAdPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const getTranslationField = (ad, field) => {
    if (ad.translations && ad.translations.length > 0) {
      return ad.translations[0][field] || '';
    }
    return '';
  };

  const openAddModal = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage(null);
    setEditForm({
      title: '',
      subtitle: '',
      image_url: '',
      cta_label: '',
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
    setPreviewImage(getTranslationField(ad, 'image_url'));
    setEditForm({
      id: ad.id,
      title: getTranslationField(ad, 'title'),
      subtitle: getTranslationField(ad, 'subtitle'),
      image_url: getTranslationField(ad, 'image_url'),
      cta_label: getTranslationField(ad, 'cta_label'),
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
    formData.append('title', editForm.title || '');
    formData.append('subtitle', editForm.subtitle || '');
    formData.append('cta_label', editForm.cta_label || '');
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (editForm.image_url) {
      formData.append('image_url', editForm.image_url);
    }

    try {
      if (isEditing) {
        // Axios uses POST for FormData, Laravel uses PUT -> send as POST with _method=PUT
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
        
        /* Custom Toggle Switch CSS */
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

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
        
        /* Mobile Preview CSS */
        .mobile-preview-container {
          width: 320px; height: 600px; background: #000; border-radius: 36px; padding: 8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; flex-shrink: 0;
        }
        .mobile-screen {
          width: 100%; height: 100%; background: #1E293B; border-radius: 28px; overflow: hidden; position: relative; display: flex; flex-direction: column;
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
            Pages d'Onboarding
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#64748B' }}>
            Gérez les écrans d'accueil (Upload d'images, position des textes, prévisualisation).
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', background: '#1A6FD4',
            border: 'none', borderRadius: '12px',
            color: '#FFFFFF', fontWeight: '600', fontSize: '15px',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,111,212,0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={20} /> Nouveau Slide
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#1A6FD4' }}>
          <Loader2 size={40} className="animate-spin" />
          <p style={{ marginTop: '16px', fontWeight: '500', color: '#64748B' }}>Chargement des pages...</p>
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
            
            {/* Colonne de Gauche : Formulaire */}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Image d'illustration <span style={{ color: '#EF4444' }}>*</span></label>
                  
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

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Titre principal</label>
                  <input type="text" required placeholder="Trouvez votre futur..." value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="input-field" />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Sous-titre / Description</label>
                  <textarea rows={2} placeholder="Accédez aux meilleures opportunités..." value={editForm.subtitle || ''} onChange={e => setEditForm({...editForm, subtitle: e.target.value})} className="input-field" style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Bouton CTA</label>
                    <input type="text" placeholder="ex: Continuer" value={editForm.cta_label || ''} onChange={e => setEditForm({...editForm, cta_label: e.target.value})} className="input-field" />
                  </div>
                  <div style={{ width: '80px' }}>
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

            {/* Colonne de Droite : Live Preview Android */}
            <div className="mobile-preview-container">
              {/* Encoche caméra */}
              <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '24px', background: '#000', borderRadius: '12px', zIndex: 10 }}></div>
              
              <div className="mobile-screen">
                {/* Image Background */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: editForm.image_style === 'contain' ? 'contain' : 'cover' }} />
                  ) : (
                    <ImageIcon size={48} color="#475569" />
                  )}
                </div>

                {/* Gradient Overlay */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.95) 100%)'
                }}></div>

                {/* Bouton Passer */}
                {editForm.is_skippable === 1 && (
                  <div style={{ position: 'absolute', top: '48px', right: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '20px', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>PASSER</div>
                  </div>
                )}

                {/* Contenu (Alignement dynamique) */}
                <div style={{ 
                  position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                  display: 'flex', padding: '24px',
                  flexDirection: 'column',
                  justifyContent: editForm.text_position === 'top' ? 'flex-start' : (editForm.text_position === 'center' ? 'center' : 'flex-end'),
                  paddingTop: editForm.text_position === 'top' ? '100px' : '24px'
                }}>
                  
                  {/* Textes */}
                  <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '800', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                      {editForm.title || 'Titre principal'}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                      {editForm.subtitle || 'Votre sous-titre apparaîtra ici avec un dégradé lisible.'}
                    </p>
                  </div>

                  {/* Pagination & Bouton (Toujours en bas) */}
                  {editForm.text_position !== 'bottom' && <div style={{ flex: 1 }}></div>}
                  
                  <div>
                    {/* Dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                      <div style={{ width: '20px', height: '6px', background: '#F39C12', borderRadius: '4px' }}></div>
                      <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}></div>
                      <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}></div>
                    </div>
                    {/* Bouton */}
                    <div style={{ background: '#F39C12', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{editForm.cta_label || 'Continuer'}</span>
                      <span style={{ color: 'white' }}>→</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete and Toast stay similar... */}
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
