import React, { useState, useEffect } from 'react';
import { X, Save, Plus, XCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const SearchableSelect = ({ options, value, onChange, name, placeholder, disabled, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value == value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          ...style, 
          display: 'flex', 
          justifyContent: 'space-between', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          alignItems: 'center',
          backgroundColor: '#fff'
        }}>
        <span style={{ color: selected ? '#0f172a' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px' }}>▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 50, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '8px', borderBottom: '1px solid #e2e8f0', zIndex: 2 }}>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <div style={{ padding: '4px' }}>
            {filtered.length > 0 ? filtered.map(opt => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange({ target: { name, value: opt.value } });
                  setIsOpen(false);
                  setSearch('');
                }}
                style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: opt.value == value ? '#eff6ff' : 'transparent', color: opt.value == value ? '#2563eb' : '#334155', fontWeight: opt.value == value ? '600' : '400', fontSize: '14px' }}
                onMouseEnter={e => { if (opt.value != value) e.target.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (opt.value != value) e.target.style.background = 'transparent' }}
              >
                {opt.label}
              </div>
            )) : (
              <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>Aucun résultat</div>
            )}
          </div>
        </div>
      )}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default function CreateOfferModal({ onClose, onSuccess, categories, initialData }) {
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [formData, setFormData] = useState({
    company_profile_id: initialData?.company?.id || '',
    category_id: initialData?.category_id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    requirements: initialData?.requirements || '',
    benefits: initialData?.benefits || '',
    contract_type: initialData?.contract_type || 'stage',
    experience_level: initialData?.experience_level || 'junior',
    positions_count: initialData?.positions_count || 1,
    status: initialData?.status || 'published',
    salary_min: initialData?.salary?.min || '',
    salary_max: initialData?.salary?.max || '',
    salary_visible: initialData?.salary_visible !== undefined ? initialData.salary_visible : true,
    requires_transport: initialData?.requires_transport || false,
    deadline_at: initialData?.deadline_at ? initialData.deadline_at.split('T')[0] : '',
    start_date: initialData?.start_date ? initialData.start_date.split('T')[0] : '',
    duration: initialData?.duration || '',
    prefecture_id: initialData?.prefecture_id || '',
    commune_id: initialData?.commune_id || '',
    skills: initialData?.skills || []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await apiClient.get('/v1/admin/users', {
          params: { user_type: 'company', limit: 1000 }
        });
        const comps = response.data.data
          .filter(u => u.company_profile)
          .map(u => u.company_profile);
        setCompanies(comps);
        if (comps.length > 0) {
          setFormData(prev => ({ ...prev, company_profile_id: comps[0].id }));
        }
      } catch (err) {
        console.error('Erreur chargement entreprises', err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    
    const fetchLocations = async () => {
      try {
        const [prefRes, comRes] = await Promise.all([
          apiClient.get('/v1/admin/cms/dynamic/prefectures'),
          apiClient.get('/v1/admin/cms/dynamic/communes')
        ]);
        setPrefectures(prefRes.data?.data || (Array.isArray(prefRes.data) ? prefRes.data : (Array.isArray(prefRes) ? prefRes : [])));
        setCommunes(comRes.data?.data || (Array.isArray(comRes.data) ? comRes.data : (Array.isArray(comRes) ? comRes : [])));
      } catch (err) {
        console.error('Erreur chargement lieux', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchCompanies();
    fetchLocations();
    
    if (!initialData && categories && categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories, initialData]);

  const getName = (item) => item?.translations?.[0]?.name || item?.name || item?.code || '';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = { ...formData };
      if (!payload.salary_min) delete payload.salary_min;
      if (!payload.salary_max) delete payload.salary_max;
      if (!payload.deadline_at) delete payload.deadline_at;
      if (!payload.prefecture_id) delete payload.prefecture_id;
      if (!payload.commune_id) delete payload.commune_id;
      
      if (initialData) {
        await apiClient.put(`/v1/admin/offers/${initialData.id}`, payload);
      } else {
        await apiClient.post('/v1/admin/offers', payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || (initialData ? "Erreur lors de la modification de l'offre." : "Erreur lors de la création de l'offre."));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper styles
  const labelStyle = { fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)' };
  const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-border)' };
  const sectionTitleStyle = { fontSize: '15px', fontWeight: '600', color: '#0052ff', marginTop: '10px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        <div style={{
          padding: '20px', borderBottom: '1px solid var(--gray-border)', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--black-deep)' }}>
            {initialData ? 'Modification de l\'offre' : "Création complète d'une offre"}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-text)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-border)', background: '#f8fafc' }}>
          {[
            { num: 1, label: 'Principal' },
            { num: 2, label: 'Lieu & Dates' },
            { num: 3, label: 'Rémunération' },
            { num: 4, label: 'Compétences' },
            { num: 5, label: 'Détails' }
          ].map(step => (
            <div 
              key={step.num}
              onClick={() => setCurrentStep(step.num)}
              style={{
                flex: 1, textAlign: 'center', padding: '12px 0', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                color: currentStep === step.num ? '#0052ff' : '#64748b',
                borderBottom: currentStep === step.num ? '2px solid #0052ff' : '2px solid transparent',
                background: currentStep === step.num ? '#fff' : 'transparent'
              }}
            >
              {step.num}. {step.label}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* SECTION 1 : Infos Générales */}
          {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Entreprise (Agence)</label>
                {loadingCompanies ? (
                  <span style={{ fontSize: '14px', color: 'var(--gray-text)' }}>Chargement...</span>
                ) : (
                  <select name="company_profile_id" value={formData.company_profile_id} onChange={handleChange} required style={inputStyle}>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Titre de l'offre</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: Développeur React" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Catégorie</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} required style={inputStyle}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Statut</label>
                <select name="status" value={formData.status} onChange={handleChange} required style={inputStyle}>
                  <option value="published">Publiée (Immédiat)</option>
                  <option value="pending">En attente</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Type de contrat</label>
                <select name="contract_type" value={formData.contract_type} onChange={handleChange} style={inputStyle}>
                  <option value="stage">Stage</option>
                  <option value="cdi">CDI</option>
                  <option value="cdd">CDD</option>
                  <option value="alternance">Alternance</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Niveau d'expérience</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange} style={inputStyle}>
                  <option value="junior">Junior (0-2 ans)</option>
                  <option value="mid">Intermédiaire (2-5 ans)</option>
                  <option value="senior">Sénior (5+ ans)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Postes vacants</label>
                <input type="number" name="positions_count" min="1" value={formData.positions_count} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>
          )}

          {/* SECTION 2 : Lieu & Dates */}
          {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Préfecture / Ville principale</label>
                <SearchableSelect 
                  name="prefecture_id"
                  value={formData.prefecture_id}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Sélectionnez une préfecture"
                  options={Array.isArray(prefectures) ? prefectures.map(p => ({ value: p.id, label: getName(p) })) : []}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Commune / Quartier</label>
                <SearchableSelect 
                  name="commune_id"
                  value={formData.commune_id}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!formData.prefecture_id}
                  placeholder="Sélectionnez une commune"
                  options={Array.isArray(communes) ? communes.filter(c => c.prefecture_id == formData.prefecture_id).map(c => ({ value: c.id, label: getName(c) })) : []}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginTop: '20px' }}>
                <input type="checkbox" name="requires_transport" checked={formData.requires_transport} onChange={handleChange} id="requires_transport" />
                <label htmlFor="requires_transport" style={{ fontSize: '14px', cursor: 'pointer' }}>Moyen de transport exigé</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Début (Date)</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Durée (Ex: 6 mois)</label>
                <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="Ex: 6 mois" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Date limite candidature</label>
                <input type="date" name="deadline_at" value={formData.deadline_at} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>
          )}

          {/* SECTION 3 : Rémunération */}
          {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Salaire Minimum (€)</label>
                <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} placeholder="Ex: 1200" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Salaire Maximum (€)</label>
                <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} placeholder="Ex: 1500" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginTop: '20px' }}>
                <input type="checkbox" name="salary_visible" checked={formData.salary_visible} onChange={handleChange} id="salary_visible" />
                <label htmlFor="salary_visible" style={{ fontSize: '14px', cursor: 'pointer' }}>Afficher le salaire au public</label>
              </div>
            </div>
          )}

          {/* SECTION 4 : Compétences */}
          {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={skillInput} 
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Ajouter une compétence (ex: Accuil, SQL , communication...)" 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <button type="button" onClick={handleAddSkill} style={{ padding: '0 16px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Ajouter
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {formData.skills.map(s => (
                  <span key={s} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {s}
                    <XCircle size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(s)} />
                  </span>
                ))}
              </div>
            )}
          </div>
          )}

          {/* SECTION 5 : Détails (Textes longs) */}
          {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>À propos (Description générale)</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} placeholder="Description de l'entreprise et du poste..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Profil recherché (Prérequis)</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="Ex: De formation Bac+3, vous maîtrisez..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Avantages</label>
                <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows={4} placeholder="Ex: Télétravail 2j/semaine, TR, Mutuelle..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', background: '#f1f5f9', color: 'var(--gray-text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
              Annuler
            </button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 1 && (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)} style={{ padding: '10px 16px', background: '#fff', color: '#0052ff', border: '1px solid #0052ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  Précédent
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button type="button" onClick={() => setCurrentStep(s => s + 1)} style={{ padding: '10px 24px', background: '#0052ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  Suivant
                </button>
              ) : (
                <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: '#0052ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} />
                  {submitting ? 'Enregistrement...' : (initialData ? "Mettre à jour" : "Créer l'offre")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
