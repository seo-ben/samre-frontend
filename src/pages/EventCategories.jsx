import React, { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import apiClient from "../lib/apiClient";
import { Plus, X, Loader2, AlertCircle, Trash2, Edit2, Tag, CheckCircle, XCircle, ChevronRight } from "lucide-react";

export const EventCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [langsRes, catsRes] = await Promise.all([
        apiClient.get('/v1/admin/cms/dynamic/languages'),
        apiClient.get('/v1/admin/cms/dynamic/event-categories')
      ]);
      setLanguages(langsRes.data.data.filter(l => l.is_active));
      
      // Sort categories: sort by sort_order
      const sortedCats = catsRes.data.data.sort((a, b) => a.sort_order - b.sort_order);
      setCategories(sortedCats);
    } catch (err) {
      setError("Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    parent_id: '',
    icon_url: '',
    is_active: true,
    sort_order: 0,
    translations: {}
  });

  const [activeLangTab, setActiveLangTab] = useState(null);

  const handleAutoTranslate = async () => {
    const sourceLangId = activeLangTab;
    const sourceLang = languages.find(l => l.id === sourceLangId);
    const sourceText = formData.translations[sourceLangId];

    if (!sourceText || !sourceText.trim() || !sourceLang) return;

    setIsTranslating(true);
    let newTranslations = { ...formData.translations };
    
    try {
      for (const lang of languages) {
        if (lang.id === sourceLangId) continue;
        
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang.code.split('-')[0]}&tl=${lang.code.split('-')[0]}&dt=t&q=${encodeURIComponent(sourceText)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data[0]) {
          newTranslations[lang.id] = data[0].map(item => item[0]).join('');
        }
      }
      setFormData({ ...formData, translations: newTranslations });
    } catch (err) {
      console.error("Translation error", err);
      setError("Erreur lors de la traduction automatique.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      const transObj = {};
      languages.forEach(l => {
        const t = item.translations?.find(tr => tr.language_id === l.id);
        transObj[l.id] = t ? t.name : '';
      });
      setFormData({
        parent_id: item.parent_id || '',
        icon_url: item.icon_url || '',
        is_active: item.is_active,
        sort_order: item.sort_order || 0,
        translations: transObj
      });
    } else {
      const transObj = {};
      languages.forEach(l => transObj[l.id] = '');
      setFormData({
        parent_id: '',
        icon_url: '',
        is_active: true,
        sort_order: 0,
        translations: transObj
      });
    }
    setActiveLangTab(languages[0]?.id);
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      parent_id: formData.parent_id === '' ? null : formData.parent_id,
      icon_url: formData.icon_url,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
      translations: formData.translations
    };

    try {
      if (editingItem) {
        await apiClient.put(`/v1/admin/cms/dynamic/event-categories/${editingItem.id}`, payload);
        showToast("Catégorie mise à jour avec succès");
      } else {
        await apiClient.post(`/v1/admin/cms/dynamic/event-categories`, payload);
        showToast("Catégorie créée avec succès");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
    try {
      await apiClient.delete(`/v1/admin/cms/dynamic/event-categories/${id}`);
      showToast("Catégorie supprimée avec succès");
      fetchData();
    } catch (err) {
      setError("Erreur lors de la suppression.");
    }
  };

  const getCategoryName = (item, langId = 1) => {
    if (!item || !item.translations) return "Sans nom";
    const t = item.translations.find(tr => tr.language_id === langId);
    return t && t.name ? t.name : "Sans nom";
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <MainLayout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Catégories d'événements
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Gérez les secteurs et types d'événements (catégories principales et sous-catégories).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#FF4500', color: '#FFF',
            border: 'none', padding: '10px 20px', borderRadius: '8px',
            fontWeight: '600', cursor: 'pointer', transition: '0.2s',
            boxShadow: '0 4px 12px rgba(255, 69, 0, 0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
        >
          <Plus size={20} />
          Nouvelle Catégorie
        </button>
      </div>

      {error && !isModalOpen && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="#FF4500" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase', width: '60px' }}>Icône</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>Nom (FR)</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>Ordre</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>Statut</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                    Aucune catégorie d'événement trouvée.
                  </td>
                </tr>
              ) : categories.map((item) => {
                const isSubCat = !!item.parent_id;
                const parentCat = isSubCat ? categories.find(c => c.id === item.parent_id) : null;
                
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      {item.icon_url ? (
                        <img src={item.icon_url} alt="icon" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                          <span style={{ fontSize: '10px' }}>Icon</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSubCat && <ChevronRight size={16} color="#9CA3AF" />}
                        <span style={{ fontWeight: isSubCat ? '500' : '600', color: '#111827', fontSize: '14px' }}>
                          {getCategoryName(item, 1)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isSubCat ? (
                        <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                          Sous-catégorie de {getCategoryName(parentCat, 1)}
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                          Catégorie Principale
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '14px' }}>
                      {item.sort_order}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '13px', fontWeight: '500' }}><CheckCircle size={16} /> Actif</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '13px', fontWeight: '500' }}><XCircle size={16} /> Inactif</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '6px', marginRight: '8px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#E5E7EB'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '6px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} color="#FF4500" />
                {editingItem ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={24} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Catégorie Parente</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', backgroundColor: '#FFF' }}
                  >
                    <option value="">-- Créer comme Catégorie Principale --</option>
                    {parentCategories.filter(c => !editingItem || c.id !== editingItem.id).map(c => (
                      <option key={c.id} value={c.id}>{getCategoryName(c, 1)}</option>
                    ))}
                  </select>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6B7280' }}>
                    Pour créer une nouvelle catégorie parente, laissez ce champ sur "-- Créer comme Catégorie Principale --".
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>URL de l'icône</label>
                  <input
                    type="text"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      style={{ width: '18px', height: '18px', accentColor: '#FF4500' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Catégorie Active</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  Traductions (Nom de la catégorie)
                </label>
                
                {/* Tabs for Languages */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
                  <div style={{ display: 'flex' }}>
                    {languages.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setActiveLangTab(lang.id)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: activeLangTab === lang.id ? '2px solid #FF4500' : '2px solid transparent',
                          color: activeLangTab === lang.id ? '#FF4500' : '#6B7280',
                          fontWeight: activeLangTab === lang.id ? '600' : '500',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleAutoTranslate}
                    disabled={isTranslating}
                    title="Traduire automatiquement vers les autres langues"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', backgroundColor: '#FFF5F0',
                      color: '#FF4500', border: '1px solid #FFEDD5',
                      borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                      cursor: isTranslating ? 'not-allowed' : 'pointer',
                      opacity: isTranslating ? 0.6 : 1
                    }}
                  >
                    {isTranslating ? <Loader2 size={14} className="animate-spin" /> : null}
                    Traduction Auto
                  </button>
                </div>

                {/* Input for Active Language Tab */}
                {languages.map(lang => (
                  <div key={lang.id} style={{ display: activeLangTab === lang.id ? 'block' : 'none' }}>
                    <input
                      type="text"
                      value={formData.translations[lang.id] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [lang.id]: e.target.value
                        }
                      })}
                      placeholder={`Nom en ${lang.name}...`}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
                    />
                  </div>
                ))}
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 20px', backgroundColor: '#FFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#FF4500', border: 'none', borderRadius: '8px', fontWeight: '600', color: '#FFF', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#10B981', color: '#FFF',
          padding: '12px 24px', borderRadius: '8px',
          fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          animation: 'slideUp 0.3s ease-out', zIndex: 9999
        }}>
          <CheckCircle size={20} />
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
