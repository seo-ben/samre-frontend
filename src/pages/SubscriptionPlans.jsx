import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Loader2, Edit2, AlertCircle, CheckCircle2, X, Plus, Trash2, Search, Filter, CreditCard } from 'lucide-react';

export const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtres & Recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    key: '',
    target_type: 'company',
    price: 0,
    duration_type: 'monthly',
    duration_value: 1,
    is_active: true,
    sort_order: 0
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/subscription-plans');
      setPlans(res.data.data || res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des plans d'abonnement.");
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
      setFormData({
        key: item.key || '',
        target_type: item.target_type || 'company',
        price: item.price || 0,
        duration_type: item.duration_type || 'monthly',
        duration_value: item.duration_value || 1,
        is_active: item.is_active !== false,
        sort_order: item.sort_order || 0
      });
    } else {
      setFormData({
        key: '',
        target_type: 'company',
        price: 0,
        duration_type: 'monthly',
        duration_value: 1,
        is_active: true,
        sort_order: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce plan ? (Ceci peut impacter les abonnements existants)")) return;
    try {
      await apiClient.delete(`/v1/admin/subscription-plans/${id}`);
      showToast("Plan supprimé avec succès");
      fetchData();
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
        await apiClient.put(`/v1/admin/subscription-plans/${editingItem.id}`, formData);
        showToast("Plan mis à jour avec succès");
      } else {
        await apiClient.post(`/v1/admin/subscription-plans`, formData);
        showToast("Plan créé avec succès");
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

  const filteredPlans = useMemo(() => {
    return plans.filter(item => {
      const matchSearch = (item.key || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType ? item.target_type === selectedType : true;
      return matchSearch && matchType;
    });
  }, [plans, searchTerm, selectedType]);

  return (
    <MainLayout>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F1923' }}>
            Plans d'Abonnement
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8A94A6', fontSize: '14px' }}>
            Gérez les forfaits payants pour les entreprises et les candidats.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
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
              placeholder="Rechercher (clé)..."
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
              <option value="candidate">Candidats</option>
              <option value="company">Entreprises</option>
            </select>
          </div>

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
            Nouveau Plan
          </button>
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
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '25%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Plan (Clé)</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Cible</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Prix</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Durée</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle' }}>Statut</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#FAFAFA', borderBottom: '1px solid #E4E4E7', width: '15%', height: '40px', padding: '0 16px', fontWeight: '500', color: '#71717A', verticalAlign: 'middle', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 16px', textAlign: 'center', color: '#71717A', fontSize: '14px' }}>
                    Aucun plan d'abonnement trouvé.
                  </td>
                </tr>
              ) : filteredPlans.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #E4E4E7', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F4F4F5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: '500', color: '#09090B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={16} color="#71717A" />
                      {item.key}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', border: '1px solid #E4E4E7', backgroundColor: '#FAFAFA', padding: '2px 10px', fontSize: '12px', fontWeight: '500', color: '#18181B' }}>
                      {item.target_type === 'candidate' ? 'Candidat' : item.target_type === 'company' ? 'Entreprise' : item.target_type === 'visitor' ? 'Visiteur' : item.target_type === 'both' ? 'Candidat & Entreprise' : 'Tous (Candidat, Entreprise, Visiteur)'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#09090B', fontWeight: '600' }}>
                    {parseFloat(item.price)} €
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: '#71717A' }}>
                    {item.duration_value} {item.duration_type === 'monthly' ? 'Mois' : (item.duration_type === 'yearly' ? 'An(s)' : 'Semaine(s)')}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    {item.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#065F46', fontSize: '12px', fontWeight: '500', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}><CheckCircle2 size={12} /> Actif</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#991B1B', fontSize: '12px', fontWeight: '500', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}><X size={12} /> Inactif</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      <button 
                        onClick={() => handleOpenModal(item)} 
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#09090B', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        title="Modifier"
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#E4E4E7'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Edit2 size={16} /> 
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        title="Supprimer"
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '12px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#09090B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#71717A" />
                {editingItem ? 'Modifier le plan' : 'Nouveau plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Cible (Profil) *</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({...formData, target_type: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '14px', backgroundColor: '#FFF', color: '#09090B' }}
                  >
                    <option value="candidate">Candidat</option>
                    <option value="company">Entreprise</option>
                    <option value="visitor">Visiteur / Organisateur</option>
                    <option value="both">Candidat & Entreprise</option>
                    <option value="all">Tous (Candidat, Entreprise, Visiteur)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Clé du plan *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    placeholder="ex: premium_pro_monthly"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', backgroundColor: '#FFF', color: '#09090B', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Prix (en €) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Unité de temps *</label>
                  <select
                    value={formData.duration_type}
                    onChange={(e) => setFormData({...formData, duration_type: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '14px', backgroundColor: '#FFF', color: '#09090B' }}
                  >
                    <option value="weekly">Semaines</option>
                    <option value="monthly">Mois</option>
                    <option value="yearly">Années</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#09090B' }}>Valeur (Durée) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_value}
                    onChange={(e) => setFormData({...formData, duration_value: parseInt(e.target.value) || 1})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#18181B' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '14px', color: '#09090B', cursor: 'pointer', fontWeight: '500' }}>
                  Activer ce plan (visible pour les utilisateurs)
                </label>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E4E4E7', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#FAFAFA', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 16px', backgroundColor: '#FFF', border: '1px solid #E4E4E7', borderRadius: '6px', fontWeight: '500', color: '#09090B', cursor: 'pointer', fontSize: '14px' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#18181B', border: 'none', borderRadius: '6px', fontWeight: '500', color: '#FFF', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, fontSize: '14px' }}
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
