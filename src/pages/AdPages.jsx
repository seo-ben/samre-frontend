import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, PlayCircle } from 'lucide-react';

export const AdPages = () => {
  const [adPages, setAdPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
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
      // Sort by sort_order
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
    setEditForm({
      title: '',
      subtitle: '',
      image_url: '',
      cta_label: '',
      sort_order: (adPages.length > 0 ? adPages[adPages.length - 1].sort_order + 1 : 1),
      duration_seconds: 5,
      is_skippable: 1,
      is_active: 1
    });
    setShowModal(true);
  };

  const openEditModal = (ad) => {
    setIsEditing(true);
    setEditForm({
      id: ad.id,
      title: getTranslationField(ad, 'title'),
      subtitle: getTranslationField(ad, 'subtitle'),
      image_url: getTranslationField(ad, 'image_url'),
      cta_label: getTranslationField(ad, 'cta_label'),
      sort_order: ad.sort_order || 0,
      duration_seconds: ad.duration_seconds || 5,
      is_skippable: ad.is_skippable !== undefined ? (ad.is_skippable ? 1 : 0) : 1,
      is_active: ad.is_active !== undefined ? (ad.is_active ? 1 : 0) : 1
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    const payload = {
      ...editForm,
      is_skippable: editForm.is_skippable === 1,
      is_active: editForm.is_active === 1
    };

    try {
      if (isEditing) {
        await apiClient.put(`/v1/admin/cms/ad-pages/${editForm.id}`, payload);
        showToast("Publicité modifiée avec succès.");
      } else {
        await apiClient.post(`/v1/admin/cms/ad-pages`, payload);
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
        is_skippable: ad.is_skippable
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
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #CBD5E1;
          transition: .3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input:checked + .slider {
          background-color: #10B981;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        
        .ad-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #E2E8F0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .ad-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          border-color: #CBD5E1;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .image-container {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) inset;
        }
        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .badge {
          background: #F1F5F9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .badge.active {
          background: #ECFDF5;
          color: #059669;
        }
        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px dashed #E2E8F0;
        }
        .action-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: 0.2s;
        }
        .action-btn:hover {
          background: #F1F5F9;
          color: #0F1923;
        }
        .action-btn.delete:hover {
          background: #FEF2F2;
          color: #EF4444;
        }
        
        .input-field {
          width: 100%; padding: 14px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px; fontSize: 15px; outline: none; transition: 0.2s; background: #F8FAFC; box-sizing: border-box;
        }
        .input-field:focus {
          border-color: #1A6FD4; background: #FFFFFF; box-shadow: 0 0 0 4px rgba(26,111,212,0.1);
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
            Pages d'Onboarding (Publicités)
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#64748B' }}>
            Gérez les écrans d'accueil que les utilisateurs voient lors du premier lancement de l'application.
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
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,111,212,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,111,212,0.25)'; }}
        >
          <Plus size={20} />
          Nouveau Slide
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#1A6FD4' }}>
          <Loader2 size={40} className="animate-spin" />
          <p style={{ marginTop: '16px', fontWeight: '500', color: '#64748B' }}>Chargement des pages...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '24px',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          {adPages.map((ad) => (
            <div key={ad.id} className="ad-card">
              <div className="card-header">
                <div className="image-container">
                  {getTranslationField(ad, 'image_url') ? (
                    <img src={getTranslationField(ad, 'image_url')} alt={getTranslationField(ad, 'title')} />
                  ) : (
                    <ImageIcon size={28} color="#94A3B8" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`badge ${ad.is_active ? 'active' : ''}`}>
                    Position {ad.sort_order}
                  </span>
                  {/* Toggle Actif */}
                  <label className="toggle-switch" title={ad.is_active ? "Désactiver la page" : "Activer la page"}>
                    <input 
                      type="checkbox" 
                      checked={ad.is_active} 
                      onChange={() => handleToggleActive(ad)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F1923', fontFamily: 'var(--font-poppins)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getTranslationField(ad, 'title') || 'Sans titre'}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {getTranslationField(ad, 'subtitle') || 'Aucune description'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PlayCircle size={14} /> {ad.duration_seconds}s
                </span>
                {ad.is_skippable && <span className="badge" style={{ background: '#E0E7FF', color: '#4338CA' }}>Ignorable</span>}
                {getTranslationField(ad, 'cta_label') && <span className="badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Bouton: {getTranslationField(ad, 'cta_label')}</span>}
              </div>
              
              <div className="card-actions">
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>ID: {ad.id}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="action-btn" onClick={() => openEditModal(ad)} title="Modifier">
                    <Edit2 size={18} />
                  </button>
                  <button className="action-btn delete" onClick={() => confirmDelete(ad)} title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {adPages.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
              <ImageIcon size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0F1923' }}>Aucune publicité configurée</h3>
              <p style={{ margin: '8px 0 0', color: '#64748B' }}>Cliquez sur "Nouveau Slide" pour construire votre Onboarding.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Edition / Ajout */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s', padding: '20px' }}>
          <div className="custom-scrollbar" style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '600px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: '0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F1923'; }} onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}>
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#0F1923', fontFamily: 'var(--font-poppins)' }}>
              {isEditing ? 'Modifier la Page' : 'Ajouter une Page'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748B' }}>
              Configurez le contenu du slide d'Onboarding (Les textes sont sauvegardés en Français par défaut).
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Titre principal <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="text" required placeholder="ex: Bienvenue sur SAMRE"
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Sous-titre / Description</label>
                <textarea 
                  rows={3}
                  placeholder="ex: Trouvez le job de vos rêves facilement..."
                  value={editForm.subtitle || ''} 
                  onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>URL de l'image (Illustration)</label>
                <input 
                  type="url" placeholder="https://..."
                  value={editForm.image_url || ''} 
                  onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                  className="input-field"
                />
                {editForm.image_url && (
                  <div style={{ marginTop: '12px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'inline-block' }}>
                     <img src={editForm.image_url} alt="Aperçu" style={{ height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display='none'; }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Label du bouton CTA</label>
                  <input 
                    type="text" placeholder="ex: Commencer"
                    value={editForm.cta_label || ''} 
                    onChange={e => setEditForm({...editForm, cta_label: e.target.value})}
                    className="input-field"
                  />
                  <small style={{ color: '#94A3B8', marginTop: '4px', display: 'block' }}>Laissez vide pour utiliser la traduction par défaut (Suivant/Commencer).</small>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Ordre</label>
                  <input 
                    type="number" required min={0}
                    value={editForm.sort_order ?? ''} 
                    onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                    className="input-field"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Durée (s)</label>
                  <input 
                    type="number" required min={1}
                    value={editForm.duration_seconds ?? ''} 
                    onChange={e => setEditForm({...editForm, duration_seconds: parseInt(e.target.value)})}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#0F1923', fontWeight: '600', cursor: 'pointer', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.is_skippable === 1}
                    onChange={e => setEditForm({...editForm, is_skippable: e.target.checked ? 1 : 0})}
                    style={{ width: '20px', height: '20px', accentColor: '#1A6FD4', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ marginBottom: '2px' }}>Ignorable (Bouton "Passer")</div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '400' }}>Autoriser l'utilisateur à sauter l'onboarding sur cette page.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#0F1923', fontWeight: '600', cursor: 'pointer', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.is_active === 1}
                    onChange={e => setEditForm({...editForm, is_active: e.target.checked ? 1 : 0})}
                    style={{ width: '20px', height: '20px', accentColor: '#1A6FD4', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ marginBottom: '2px' }}>Visible sur l'application</div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '400' }}>Afficher cette page dans l'application mobile.</div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ 
                  padding: '12px 24px', border: '1.5px solid #E2E8F0', borderRadius: '12px', background: '#FFFFFF', 
                  color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: '0.2s' 
                }} onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} style={{ 
                  padding: '12px 32px', border: 'none', borderRadius: '12px', background: '#1A6FD4', 
                  color: '#FFFFFF', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(26,111,212,0.25)' 
                }} onMouseEnter={e => { e.currentTarget.style.background = '#0D3B7A'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#1A6FD4'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {actionLoading && <Loader2 size={18} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Suppression */}
      {showConfirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={32} color="#EF4444" />
              </div>
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700', color: '#0F1923', textAlign: 'center', fontFamily: 'var(--font-poppins)' }}>
              Supprimer la publicité ?
            </h3>
            
            <p style={{ margin: '0 0 32px 0', fontSize: '15px', color: '#64748B', textAlign: 'center', lineHeight: '1.6' }}>
              Êtes-vous sûr de vouloir supprimer définitivement cette page d'onboarding ?<br/><br/>
              <strong style={{ color: '#EF4444' }}>Cette action est irréversible.</strong>
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                type="button" 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={actionLoading}
                style={{ flex: 1, padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: '12px', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: '0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                Annuler
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                disabled={actionLoading}
                style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '12px', background: '#EF4444', color: '#FFFFFF', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; }} onMouseLeave={e => { e.currentTarget.style.background = '#EF4444'; }}
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Custom */}
      {toast && (
        <div style={{ 
          position: 'fixed', top: '24px', right: '24px', zIndex: 10001, 
          background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', 
          border: `1.5px solid ${toast.type === 'error' ? '#F87171' : '#34D399'}`, 
          color: toast.type === 'error' ? '#DC2626' : '#059669', 
          padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' 
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <div style={{width: 20, height: 20, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><span style={{color: 'white', fontSize: '12px'}}>✓</span></div>}
          <span style={{ fontSize: '15px', fontWeight: '600' }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '12px', padding: '4px' }}><X size={16} /></button>
        </div>
      )}
    </MainLayout>
  );
};
