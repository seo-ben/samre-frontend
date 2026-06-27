import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Globe, Trash2, Edit2 } from 'lucide-react';

export const LanguagesPage = () => {
  const [languages, setLanguages] = useState([]);
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
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/admin/cms/dynamic/languages');
      // Sort by sort_order
      const data = (res.data.data || res.data).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setLanguages(data);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement des langues.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditForm({
      code: '',
      name: '',
      native_name: '',
      flag_url: '',
      is_active: 1,
      sort_order: 0
    });
    setShowModal(true);
  };

  const openEditModal = (lang) => {
    setIsEditing(true);
    setEditForm({
      id: lang.id,
      code: lang.code || '',
      name: lang.name || '',
      native_name: lang.native_name || '',
      flag_url: lang.flag_url || '',
      is_active: lang.is_active !== undefined ? (lang.is_active ? 1 : 0) : 1,
      sort_order: lang.sort_order || 0
    });
    setShowModal(true);
  };

  const confirmDelete = (lang) => {
    setDeletingId(lang.id);
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/v1/admin/cms/dynamic/languages/${deletingId}`);
      await fetchLanguages();
      setShowConfirmDelete(false);
      setDeletingId(null);
      showToast("Langue supprimée avec succès.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la suppression.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (isEditing) {
        await apiClient.put(`/v1/admin/cms/dynamic/languages/${editForm.id}`, editForm);
        showToast("Langue modifiée avec succès.");
      } else {
        await apiClient.post(`/v1/admin/cms/dynamic/languages`, editForm);
        showToast("Langue ajoutée avec succès.");
      }
      setShowModal(false);
      await fetchLanguages();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (lang) => {
    try {
      // Toggle immediately for UI, then call API
      const newActiveState = lang.is_active ? 0 : 1;
      setLanguages(langs => langs.map(l => l.id === lang.id ? { ...l, is_active: newActiveState } : l));
      
      await apiClient.put(`/v1/admin/cms/dynamic/languages/${lang.id}`, {
        ...lang,
        is_active: newActiveState
      });
      showToast(`Langue ${lang.name} ${newActiveState ? 'activée' : 'désactivée'}.`);
    } catch (err) {
      // Revert if error
      await fetchLanguages();
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
        
        .lang-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #E2E8F0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .lang-card:hover {
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
        .flag-container {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) inset;
        }
        .flag-container img {
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
          text-transform: uppercase;
        }
        .badge.active {
          background: #ECFDF5;
          color: #059669;
        }
        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
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

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-poppins)', color: '#0F1923', letterSpacing: '-0.5px' }}>
            Langues du Système
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#64748B' }}>
            Gérez les langues disponibles sur vos applications mobiles.
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
          Nouvelle Langue
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#1A6FD4' }}>
          <Loader2 size={40} className="animate-spin" />
          <p style={{ marginTop: '16px', fontWeight: '500', color: '#64748B' }}>Chargement des langues...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '24px',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          {languages.map((lang) => (
            <div key={lang.id} className="lang-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Blurred Background */}
              {lang.flag_url && (
                <div style={{
                  position: 'absolute',
                  top: '-20px', left: '-20px', right: '-20px', bottom: '-20px',
                  backgroundImage: `url(${lang.flag_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(30px)',
                  opacity: 0.15,
                  zIndex: 0,
                  pointerEvents: 'none'
                }} />
              )}
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="card-header">
                <div className="flag-container">
                  {lang.flag_url ? (
                    <img src={lang.flag_url} alt={`Drapeau ${lang.name}`} />
                  ) : (
                    <Globe size={28} color="#94A3B8" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`badge ${lang.is_active ? 'active' : ''}`}>
                    {lang.code}
                  </span>
                  {/* Toggle Actif */}
                  <label className="toggle-switch" title={lang.is_active ? "Désactiver la langue" : "Activer la langue"}>
                    <input 
                      type="checkbox" 
                      checked={lang.is_active} 
                      onChange={() => handleToggleActive(lang)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0F1923', fontFamily: 'var(--font-poppins)' }}>
                  {lang.native_name || lang.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>
                  {lang.name}
                </p>
              </div>
              
              <div className="card-actions">
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Ordre: {lang.sort_order}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="action-btn" onClick={() => openEditModal(lang)} title="Modifier">
                    <Edit2 size={18} />
                  </button>
                  <button className="action-btn delete" onClick={() => confirmDelete(lang)} title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              </div>
            </div>
          ))}
          
          {languages.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
              <Globe size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0F1923' }}>Aucune langue configurée</h3>
              <p style={{ margin: '8px 0 0', color: '#64748B' }}>Cliquez sur "Nouvelle Langue" pour commencer.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Edition / Ajout */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s', padding: '20px' }}>
          <div className="custom-scrollbar" style={{ background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: '0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F1923'; }} onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}>
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#0F1923', fontFamily: 'var(--font-poppins)' }}>
              {isEditing ? 'Modifier la Langue' : 'Ajouter une Langue'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748B' }}>
              Renseignez les informations de la langue.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Nom (Français) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="text" required placeholder="ex: Anglais"
                    value={editForm.name || ''} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#F8FAFC', boxSizing: 'border-box' }} 
                    onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(26,111,212,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Code ISO <span style={{ color: '#EF4444' }}>*</span></label>
                  <input 
                    type="text" required placeholder="ex: en" maxLength={5}
                    value={editForm.code || ''} 
                    onChange={e => setEditForm({...editForm, code: e.target.value.toLowerCase()})}
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#F8FAFC', boxSizing: 'border-box' }} 
                    onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(26,111,212,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Nom Natif <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="text" required placeholder="ex: English"
                  value={editForm.native_name || ''} 
                  onChange={e => setEditForm({...editForm, native_name: e.target.value})}
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#F8FAFC', boxSizing: 'border-box' }} 
                  onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(26,111,212,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>URL du Drapeau</label>
                <input 
                  type="url" placeholder="https://..."
                  value={editForm.flag_url || ''} 
                  onChange={e => setEditForm({...editForm, flag_url: e.target.value})}
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#F8FAFC', boxSizing: 'border-box' }} 
                  onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(26,111,212,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                />
                {editForm.flag_url && (
                  <div style={{ marginTop: '12px', width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                     <img src={editForm.flag_url} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#0F1923' }}>Ordre d'affichage</label>
                  <input 
                    type="number" 
                    value={editForm.sort_order || 0} 
                    onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#F8FAFC', boxSizing: 'border-box' }} 
                    onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(26,111,212,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#0F1923', fontWeight: '600', cursor: 'pointer', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.is_active === 1}
                    onChange={e => setEditForm({...editForm, is_active: e.target.checked ? 1 : 0})}
                    style={{ width: '20px', height: '20px', accentColor: '#1A6FD4', cursor: 'pointer' }}
                  />
                  Rendre cette langue active sur l'application
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
              Supprimer la langue ?
            </h3>
            
            <p style={{ margin: '0 0 32px 0', fontSize: '15px', color: '#64748B', textAlign: 'center', lineHeight: '1.6' }}>
              Êtes-vous sûr de vouloir supprimer définitivement cette langue ?<br/><br/>
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
