import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Image as ImageIcon, Trash2, Edit2, PlayCircle, Globe } from 'lucide-react';

export const CompanyBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

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
    setEditForm({
      title: '',
      subtitle: '',
      action_url: '',
      image_url: '',
      sort_order: (banners.length > 0 ? banners[banners.length - 1].sort_order + 1 : 1),
      is_active: 1,
    });
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setIsEditing(true);
    setEditForm({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      action_url: banner.action_url || '',
      image_url: banner.image_url || '',
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active ? 1 : 0,
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const payload = {
        title: editForm.title,
        subtitle: editForm.subtitle,
        action_url: editForm.action_url,
        image_url: editForm.image_url,
        sort_order: editForm.sort_order,
        is_active: editForm.is_active === 1,
      };

      if (isEditing) {
        await apiClient.put(`/v1/admin/company-banners/${editForm.id}`, payload);
        showToast("Bannière modifiée avec succès.");
      } else {
        await apiClient.post('/v1/admin/company-banners', payload);
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
    <MainLayout title="Bannières Entreprise (Slider)">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-screen">
        
        {toast && (
          <div className={`mb-4 p-4 rounded-md flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <AlertCircle size={20} />
            <p>{toast.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Bannières Dashboard Entreprise</h2>
            <p className="text-sm text-gray-500 mt-1">Gérez le slider dynamique visible par les entreprises.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Ajouter une Bannière</span>
          </button>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune bannière configurée.</p>
            <button onClick={openAddModal} className="mt-4 text-blue-600 hover:underline font-medium">
              Créer la première bannière
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b) => (
              <div key={b.id} className={`border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col ${!b.is_active ? 'opacity-75' : ''}`}>
                <div className="h-40 bg-gray-100 relative overflow-hidden group">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs">Aucune image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium shadow-sm ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.is_active ? 'Actif' : 'Inactif'}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1" title={b.title}>{b.title || 'Sans titre'}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{b.subtitle || 'Aucun sous-titre'}</p>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                    <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">
                      Ordre : {b.sort_order}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(b)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(b)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL AJOUT/EDITION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Modifier la Bannière' : 'Ajouter une Bannière'}
              </h3>
              <button 
                onClick={() => !actionLoading && setShowModal(false)}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-grow">
              <form id="bannerForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={editForm.image_url}
                    onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                  {editForm.image_url && (
                    <div className="mt-2 relative rounded overflow-hidden h-32 bg-gray-100 border border-gray-200">
                      <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                    <input
                      type="text"
                      value={editForm.subtitle}
                      onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Lien au clic)</label>
                  <input
                    type="url"
                    value={editForm.action_url}
                    onChange={e => setEditForm({...editForm, action_url: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.sort_order}
                      onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={editForm.is_active}
                      onChange={e => setEditForm({...editForm, is_active: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value={1}>Actif</option>
                      <option value={0}>Inactif</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                form="bannerForm"
                disabled={actionLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center min-w-[120px]"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? 'Enregistrer' : 'Ajouter')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 mb-6">Êtes-vous sûr de vouloir supprimer cette bannière ? Cette action est irréversible.</p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex-1"
              >
                Annuler
              </button>
              <button 
                onClick={executeDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center flex-1"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
