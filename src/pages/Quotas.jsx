import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { ShieldAlert, Loader2, Edit2, AlertCircle, CheckCircle2, X, Activity, Plus, Trash2, Search, Filter } from 'lucide-react';

export const QuotasPage = () => {
  const [quotas, setQuotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtres & Recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string',
    category: 'general',
    description: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchQuotas = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/system-settings');
      setQuotas(res.data.data);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des paramètres systèmes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        key: item.key || '',
        value: item.value || '',
        type: item.type || 'string',
        category: item.category || 'general',
        description: item.description || ''
      });
    } else {
      setFormData({
        key: '',
        value: '',
        type: 'string',
        category: 'general',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce paramètre ?")) return;
    try {
      await apiClient.delete(`/v1/admin/system-settings/${id}`);
      showToast("Paramètre supprimé avec succès");
      fetchQuotas();
    } catch (err) {
      setError("Erreur lors de la suppression.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingItem) {
        await apiClient.put(`/v1/admin/system-settings/${editingItem.id}`, formData);
        showToast("Paramètre mis à jour avec succès");
      } else {
        await apiClient.post(`/v1/admin/system-settings`, formData);
        showToast("Paramètre créé avec succès");
      }
      setIsModalOpen(false);
      fetchQuotas();
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
    } else if (searchTerm === '') {
      // Si on ferme et qu'il n'y a pas de texte, on laisse fermer.
    }
  };

  // Liste unique des catégories pour le filtre
  const categories = useMemo(() => {
    const cats = quotas.map(q => q.category);
    return [...new Set(cats)].filter(Boolean);
  }, [quotas]);

  // Filtrage des données
  const filteredQuotas = useMemo(() => {
    return quotas.filter(item => {
      const matchSearch = (item.key || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory ? item.category === selectedCategory : true;
      return matchSearch && matchCategory;
    });
  }, [quotas, searchTerm, selectedCategory]);

  return (
    <MainLayout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Paramètres & Quotas
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Configurez les limites du système (candidatures, offres, paiements, etc.).
          </p>
        </div>

        {/* Actions Header (Recherche, Filtre, Nouveau) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Barre de recherche animée */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: isSearchExpanded || searchTerm ? '#FFF' : 'transparent',
            border: isSearchExpanded || searchTerm ? '1px solid #D1D5DB' : '1px solid transparent',
            borderRadius: '8px',
            padding: isSearchExpanded || searchTerm ? '4px 12px' : '4px',
            transition: 'all 0.3s ease',
            height: '42px',
            boxShadow: isSearchExpanded || searchTerm ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
          }}>
            <button 
              onClick={handleSearchClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: '#6B7280', outline: 'none' }}
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
                width: isSearchExpanded || searchTerm ? '180px' : '0px', 
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

          {/* Filtre de catégorie */}
          <div style={{ position: 'relative', height: '42px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }}>
              <Filter size={16} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ 
                height: '100%', 
                padding: '0 14px 0 36px', 
                borderRadius: '8px', 
                border: '1px solid #D1D5DB', 
                fontSize: '14px', 
                outline: 'none', 
                appearance: 'none', 
                backgroundColor: '#FFF',
                color: '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '160px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Bouton Nouveau */}
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FF4500', color: '#FFF',
              border: 'none', height: '42px', padding: '0 20px', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', transition: '0.2s',
              boxShadow: '0 4px 12px rgba(255, 69, 0, 0.2)',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={20} />
            Nouveau Paramètre
          </button>
        </div>
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
        <div style={{ width: '100%', overflow: 'auto', borderRadius: '8px', border: '1px solid #E4E4E7', backgroundColor: '#FFF', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '25%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Paramètre</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Catégorie</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Valeur</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '35%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Description</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '10%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
                    Aucun paramètre trouvé.
                  </td>
                </tr>
              ) : filteredQuotas.map((item) => {
                
                // Style shadcn "badge" outline / variant
                let valBg = 'transparent', valColor = '#09090B', valBorder = '#E4E4E7';
                if (item.type === 'boolean') {
                  if (item.value === 'true' || item.value === '1') { valBg = '#ECFDF5'; valColor = '#065F46'; valBorder = '#A7F3D0'; }
                  else { valBg = '#FEF2F2'; valColor = '#991B1B'; valBorder = '#FECACA'; }
                }

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E4E4E7', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F4F5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: '500', color: '#09090B' }}>
                      {item.key}
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: '1px solid #E4E4E7', backgroundColor: '#FAFAFA', padding: '2px 10px', fontSize: '12px', fontWeight: '600', color: '#18181B' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', backgroundColor: valBg, color: valColor, border: `1px solid ${valBorder}`, padding: '0px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>
                          {item.value}
                        </span>
                        <span style={{ fontSize: '12px', color: '#A1A1AA' }}>{item.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#71717A', lineHeight: '1.5' }}>
                      {item.description || <span style={{ fontStyle: 'italic', color: '#A1A1AA' }}>Aucune description</span>}
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button 
                          onClick={() => handleOpenModal(item)} 
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#09090B', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          title="Modifier"
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#E4E4E7'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Edit2 size={16} /> 
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          title="Supprimer"
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#FF4500" />
                {editingItem ? 'Modifier le paramètre' : 'Nouveau Paramètre'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={24} /></button>
            </div>

            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Clé {editingItem && '(Fixe)'}</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => !editingItem && setFormData({...formData, key: e.target.value})}
                  disabled={!!editingItem}
                  placeholder="ex: free_applications_per_week"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: editingItem ? '#F9FAFB' : '#FFF', color: editingItem ? '#6B7280' : '#111827', fontSize: '14px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="ex: application, offres, communications..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', backgroundColor: '#FFF' }}
                  >
                    <option value="string">Texte (string)</option>
                    <option value="integer">Nombre entier (integer)</option>
                    <option value="decimal">Nombre décimal (decimal)</option>
                    <option value="boolean">Booléen (boolean)</option>
                    <option value="list">Liste (list)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Valeur</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #E5E7EB', fontSize: '15px', fontWeight: '500', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#FF4500'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', resize: 'vertical' }}
                />
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
