import React, { useState, useEffect } from 'react';
import { X, Save, Plus, XCircle, MapPin, Globe, Clock, Tag, Users, Info } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function CreateEventModal({ onClose, onSuccess, categories, eventToEdit }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: eventToEdit?.translations?.find(t => t.language_id === 1)?.title || '',
    category_id: eventToEdit?.category_id || (categories[0]?.id || ''),
    event_date: eventToEdit?.event_date ? eventToEdit.event_date.slice(0, 16) : '',
    end_date: eventToEdit?.end_date ? eventToEdit.end_date.slice(0, 16) : '',
    description: eventToEdit?.translations?.find(t => t.language_id === 1)?.description || '',
    agenda: eventToEdit?.translations?.find(t => t.language_id === 1)?.agenda || '',
    is_online: eventToEdit ? !!eventToEdit.is_online : false,
    online_link: eventToEdit?.online_link || '',
    location_name: eventToEdit?.location_name || '',
    max_participants: eventToEdit?.max_participants || '',
    is_free: eventToEdit ? !!eventToEdit.is_free : true,
    price: eventToEdit?.price || '',
    currency: eventToEdit?.currency || 'XOF',
    registration_url: eventToEdit?.registration_url || '',
    event_language: eventToEdit?.event_language || 'Français',
    recurrence_rule: eventToEdit?.recurrence_rule || '',
    tags: eventToEdit?.tags?.map(t => t.name) || [],
    cover_image_url: eventToEdit?.cover_image_url || '',
    cover_image: null,
    status: eventToEdit?.status || 'published'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          formData.tags.forEach((tag, index) => payload.append(`tags[${index}]`, tag));
        } else if (key === 'cover_image' && formData[key]) {
          payload.append('cover_image', formData[key]);
        } else if (typeof formData[key] === 'boolean') {
          payload.append(key, formData[key] ? 1 : 0);
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          payload.append(key, formData[key]);
        }
      });

      if (formData.max_participants) payload.set('max_participants', parseInt(formData.max_participants));
      if (formData.price) payload.set('price', parseFloat(formData.price));

      if (eventToEdit) {
        payload.append('_method', 'PUT');
        await apiClient.post(`/v1/admin/events/${eventToEdit.id}`, payload, {
          headers: { 'Content-Type': null }
        });
      } else {
        await apiClient.post('/v1/admin/events', payload, {
          headers: { 'Content-Type': null }
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Erreur création événement', err);
      const data = err.response?.data;
      if (data?.errors) {
        const errorMessages = Object.values(data.errors).flat();
        setError(errorMessages);
      } else {
        setError(data?.message || 'Une erreur est survenue lors de la création.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { 
    width: '100%', padding: '10px 12px', borderRadius: '8px', 
    border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', 
    transition: 'border 0.2s', color: '#0f172a', backgroundColor: '#fff' 
  };
  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' };
  const sectionTitleStyle = { fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', 
      zIndex: 9999, backdropFilter: 'blur(4px)' 
    }}>
      <div style={{ 
        background: '#fff', borderRadius: '16px', width: '800px', maxWidth: '95%', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#eef2ff', borderRadius: '8px', color: '#4f46e5', display: 'flex' }}><Plus size={20}/></div>
            {eventToEdit ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <XCircle size={18} /> {Array.isArray(error) ? 'Veuillez corriger les erreurs suivantes :' : error}
              </div>
              {Array.isArray(error) && (
                <ul style={{ margin: '0 0 0 26px', padding: 0 }}>
                  {error.map((msg, i) => <li key={i} style={{ marginBottom: '4px' }}>{msg}</li>)}
                </ul>
              )}
            </div>
          )}

          <form id="create-event-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Informations Générales */}
              <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={sectionTitleStyle}><Info size={18}/> Informations Générales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Titre de l'événement *</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange} style={inputStyle} placeholder="Ex: Masterclass Laravel & React" />
                  </div>
                  <div>
                    <label style={labelStyle}>Catégorie *</label>
                    <select required name="category_id" value={formData.category_id} onChange={handleChange} style={inputStyle}>
                      <option value="" disabled>Sélectionner...</option>
                      {categories.map(c => <option key={c.id} value={c.id} style={{ color: '#000', backgroundColor: '#fff' }}>{c.translations?.find(t => t.language_id === 1)?.name || c.translations?.[0]?.name || 'Catégorie'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Statut *</label>
                    <select required name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                      <option value="published" style={{ color: '#000', backgroundColor: '#fff' }}>Publié immédiatement</option>
                      <option value="pending" style={{ color: '#000', backgroundColor: '#fff' }}>En attente (Brouillon)</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Description *</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} placeholder="Décrivez votre événement en détail..."></textarea>
                </div>
              </div>

              {/* Date et Heure */}
              <div style={{ gridColumn: '1 / 2' }}>
                <h3 style={sectionTitleStyle}><Clock size={18}/> Date et Heure</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Date de début *</label>
                  <input required type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Date de fin</label>
                  <input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Récurrence</label>
                  <select name="recurrence_rule" value={formData.recurrence_rule} onChange={handleChange} style={inputStyle}>
                    <option value="" style={{ color: '#000', backgroundColor: '#fff' }}>Événement unique</option>
                    <option value="daily" style={{ color: '#000', backgroundColor: '#fff' }}>Quotidien</option>
                    <option value="weekly" style={{ color: '#000', backgroundColor: '#fff' }}>Hebdomadaire</option>
                    <option value="monthly" style={{ color: '#000', backgroundColor: '#fff' }}>Mensuel</option>
                  </select>
                </div>
              </div>

              {/* Lieu et Format */}
              <div style={{ gridColumn: '2 / 3' }}>
                <h3 style={sectionTitleStyle}>
                  {formData.is_online ? <Globe size={18}/> : <MapPin size={18}/>} 
                  Lieu et Format
                </h3>
                
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="is_online" name="is_online" checked={formData.is_online} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="is_online" style={{ fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>Événement en ligne</label>
                </div>

                {formData.is_online ? (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Lien de la réunion (Zoom, Meet...) *</label>
                    <input required type="url" name="online_link" value={formData.online_link} onChange={handleChange} style={inputStyle} placeholder="https://zoom.us/j/..." />
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Nom du lieu / Adresse *</label>
                    <input required type="text" name="location_name" value={formData.location_name} onChange={handleChange} style={inputStyle} placeholder="Ex: Palais des Congrès, Lomé" />
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Langue de l'événement</label>
                  <input type="text" name="event_language" value={formData.event_language} onChange={handleChange} style={inputStyle} placeholder="Ex: Français, Anglais" />
                </div>
              </div>

              {/* Billetterie & Inscription */}
              <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={sectionTitleStyle}><Users size={18}/> Billetterie & Inscription</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: '1 / 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="is_free" name="is_free" checked={formData.is_free} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="is_free" style={{ fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>Événement gratuit</label>
                  </div>
                  
                  {!formData.is_free && (
                    <>
                      <div>
                        <label style={labelStyle}>Prix *</label>
                        <input required type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" style={inputStyle} placeholder="Ex: 5000" />
                      </div>
                      <div>
                        <label style={labelStyle}>Devise</label>
                        <select name="currency" value={formData.currency} onChange={handleChange} style={inputStyle}>
                          <option value="XOF" style={{ color: '#000', backgroundColor: '#fff' }}>XOF (FCFA)</option>
                          <option value="EUR" style={{ color: '#000', backgroundColor: '#fff' }}>EUR (€)</option>
                          <option value="USD" style={{ color: '#000', backgroundColor: '#fff' }}>USD ($)</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  <div style={{ gridColumn: formData.is_free ? '2 / 3' : '4 / 5' }}>
                    <label style={labelStyle}>Places Max (Optionnel)</label>
                    <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} min="1" style={inputStyle} placeholder="Limiter les places ?" />
                  </div>
                </div>

                {!formData.is_free && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Lien externe d'inscription / billetterie (Optionnel)</label>
                    <input type="url" name="registration_url" value={formData.registration_url} onChange={handleChange} style={inputStyle} placeholder="Lien Eventbrite, formulaire..." />
                  </div>
                )}
              </div>

              {/* Mots-clés & Programme */}
              <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={sectionTitleStyle}><Tag size={18}/> Contenu & Programme</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Mots-clés (Tags)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {formData.tags.map(tag => (
                      <span key={tag} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {tag} <X size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => handleRemoveTag(tag)} />
                      </span>
                    ))}
                  </div>
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} style={inputStyle} placeholder="Appuyez sur Entrée pour ajouter un mot-clé" />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Programme / Agenda (Optionnel)</label>
                  <textarea name="agenda" value={formData.agenda} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="10:00 - Accueil&#10;10:30 - Début de la conférence..."></textarea>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Image de couverture (Fichier ou URL)</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        name="cover_image" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size > 2 * 1024 * 1024) {
                            setError("L'image de couverture ne doit pas dépasser 2 Mo.");
                            e.target.value = '';
                            setFormData(prev => ({ ...prev, cover_image: null }));
                            return;
                          }
                          setError('');
                          setFormData(prev => ({ ...prev, cover_image: file }));
                        }} 
                        accept="image/*" 
                        style={inputStyle} 
                      />
                    </div>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>OU</span>
                    <div style={{ flex: 1 }}>
                      <input type="url" name="cover_image_url" value={formData.cover_image_url} onChange={handleChange} style={inputStyle} placeholder="URL de l'image (https://...)" disabled={!!formData.cover_image} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? <span style={{ width: '20px', height: '20px', border: '2px solid #fff', borderBottomColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
            {loading ? 'Enregistrement...' : (eventToEdit ? 'Enregistrer' : 'Créer et Publier')}
          </button>
        </div>
        
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
