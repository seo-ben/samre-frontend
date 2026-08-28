import React, { useState, useEffect } from 'react';
import { X, Save, Plus, XCircle, Globe, MapPin } from 'lucide-react';
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
  const [countries, setCountries] = useState([]);
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
    is_international: initialData?.is_international || false,
    country_id: initialData?.country_id || '',
    country_name: initialData?.country_name || '',
    city_name: initialData?.city_name || '',
    workplace_type: initialData?.workplace_type || 'on_site',
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
        if (comps.length > 0 && !formData.company_profile_id) {
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
        const [prefRes, comRes, countRes] = await Promise.all([
          apiClient.get('/v1/admin/cms/dynamic/prefectures'),
          apiClient.get('/v1/admin/cms/dynamic/communes'),
          apiClient.get('/v1/content/countries?all=1')
        ]);
        setPrefectures(prefRes.data?.data || (Array.isArray(prefRes.data) ? prefRes.data : (Array.isArray(prefRes) ? prefRes : [])));
        setCommunes(comRes.data?.data || (Array.isArray(comRes.data) ? comRes.data : (Array.isArray(comRes) ? comRes : [])));
        const rawCountries = countRes.data?.data || (Array.isArray(countRes.data) ? countRes.data : []);
        setCountries(rawCountries);
      } catch (err) {
        console.error('Erreur chargement lieux', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchCompanies();
    fetchLocations();
    
    if (!initialData && categories && categories.length > 0 && !formData.category_id) {
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

  const POPULAR_SKILL_CATEGORIES = [
    {
      category: 'Bureautique & Digital',
      skills: ['Pack Office', 'Microsoft Word', 'Microsoft Excel', 'PowerPoint', 'Google Workspace', 'Canva', 'Saisie rapide', 'Gestion d\'emails']
    },
    {
      category: 'Secrétariat & Organisation',
      skills: ['Accueil physique & téléphonique', 'Gestion d\'agenda', 'Prise de rendez-vous', 'Rédaction administrative', 'Prise de notes & PV', 'Classement & Archivage', 'Gestion du courrier', 'Organisation de réunions']
    },
    {
      category: 'Gestion & Comptabilité',
      skills: ['Facturation & Devis', 'Comptabilité de base', 'Suivi des paiements', 'Rapprochement bancaire', 'Gestion de caisse', 'Gestion des stocks']
    },
    {
      category: 'Langues & Communication',
      skills: ['Français professionnel', 'Anglais professionnel', 'Anglais bilingue', 'Aisance relationnelle', 'Communication écrite & orale', 'Relations clients / SAV']
    },
    {
      category: 'Spécialisations',
      skills: ['Secrétariat médical', 'Secrétariat juridique', 'Assistanat de direction', 'Assistance RH', 'Coordination de projets']
    }
  ];

  const handleToggleSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (formData.skills.includes(trimmed)) {
      handleRemoveSkill(trimmed);
    } else {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
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
      if (payload.is_international) {
        payload.country_id = formData.country_id || null;
        payload.country_name = formData.country_name || '';
        delete payload.prefecture_id;
        delete payload.commune_id;
      } else {
        if (!payload.prefecture_id) delete payload.prefecture_id;
        if (!payload.commune_id) delete payload.commune_id;
        delete payload.country_id;
        delete payload.country_name;
        delete payload.city_name;
      }
      
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

  const labelStyle = { fontSize: '14px', fontWeight: '500', color: '#0f172a' };
  const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%' };

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
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            {initialData ? "Modifier l'offre" : "Créer une nouvelle offre"}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '16px 20px 0 20px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Stepper Progress */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
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
                flex: 1, textAlign: 'center', padding: '12px 0', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
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
          {/* SECTION 1 : Infos Générales */}
          {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Entreprise (Agence) *</label>
                {loadingCompanies ? (
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Chargement...</span>
                ) : (
                  <select name="company_profile_id" value={formData.company_profile_id} onChange={handleChange} required style={inputStyle}>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Titre de l'offre *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: Secrétaire de direction bilingue" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Catégorie *</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} required style={inputStyle}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name || getName(c)}</option>)}
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
                  <option value="internship">Stage professionnel</option>
                  <option value="freelance">Freelance</option>
                  <option value="part_time">Temps partiel</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Niveau d'expérience</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange} style={inputStyle}>
                  <option value="junior">Junior (Débutant)</option>
                  <option value="mid">Intermédiaire (2-4 ans)</option>
                  <option value="senior">Senior (5+ ans)</option>
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
            {/* Toggle Portée de l'offre */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>Portée géographique de l'offre</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: !formData.is_international ? '600' : '400', color: !formData.is_international ? '#0052ff' : '#475569' }}>
                  <input 
                    type="radio" 
                    name="is_international_radio" 
                    checked={!formData.is_international} 
                    onChange={() => setFormData(prev => ({ ...prev, is_international: false }))} 
                  />
                  🇹🇬 Offre Locale / Nationale (Togo)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: formData.is_international ? '600' : '400', color: formData.is_international ? '#4f46e5' : '#475569' }}>
                  <input 
                    type="radio" 
                    name="is_international_radio" 
                    checked={formData.is_international} 
                    onChange={() => setFormData(prev => ({ ...prev, is_international: true, workplace_type: 'international' }))} 
                  />
                  🌍 Offre Internationale (À l'étranger / Remote)
                </label>
              </div>
            </div>

            {!formData.is_international ? (
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
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={labelStyle}>Pays de destination *</label>
                  <SearchableSelect 
                    name="country_id"
                    value={formData.country_id}
                    onChange={(e) => {
                      const selectedC = countries.find(c => String(c.id) === String(e.target.value));
                      setFormData(prev => ({
                        ...prev,
                        country_id: e.target.value,
                        country_name: selectedC?.name || selectedC?.translations?.[0]?.name || ''
                      }));
                    }}
                    style={inputStyle}
                    placeholder="Sélectionnez un pays (250 pays disponibles)"
                    options={Array.isArray(countries) ? countries.map(c => ({
                      value: c.id,
                      label: `${c.name || c.translations?.[0]?.name || c.code} (${c.code})`
                    })) : []}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={labelStyle}>Ville / Région</label>
                  <input 
                    type="text" 
                    name="city_name" 
                    value={formData.city_name} 
                    onChange={handleChange} 
                    placeholder="Ex: Paris, Montréal, Dakar, Abidjan..." 
                    style={inputStyle} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={labelStyle}>Mode de travail</label>
                  <select name="workplace_type" value={formData.workplace_type} onChange={handleChange} style={inputStyle}>
                    <option value="international">Sur site (Expatriation)</option>
                    <option value="remote">Télétravail International (100% Remote)</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                </div>
              </div>
            )}

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
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Salaire / Gratification Minimum</label>
                <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} placeholder="Ex: 150000" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Salaire / Gratification Maximum</label>
                <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} placeholder="Ex: 250000" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="salary_visible" checked={formData.salary_visible} onChange={handleChange} id="salary_visible" />
              <label htmlFor="salary_visible" style={{ fontSize: '14px', cursor: 'pointer' }}>Afficher le salaire au public</label>
            </div>
          </div>
          )}

          {/* SECTION 4 : Compétences */}
          {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.3s' }}>
            {/* Saisie personnalisée */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>
                Ajouter une compétence manuelle ou rechercher :
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={skillInput} 
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Ex: Accueil, Word, Gestion d'agenda, Bilingue, Canva..." 
                  style={{ ...inputStyle, flex: 1 }} 
                />
                <button 
                  type="button" 
                  onClick={handleAddSkill} 
                  style={{ 
                    padding: '0 18px', 
                    background: '#1A6FD4', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {/* Compétences sélectionnées */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                  Compétences retenues pour l'offre ({formData.skills.length})
                </span>
                {formData.skills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, skills: [] }))}
                    style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Tout effacer
                  </button>
                )}
              </div>

              {formData.skills.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontStyle: 'italic' }}>
                  Aucune compétence sélectionnée. Cliquez sur les suggestions ci-dessous pour les ajouter en 1 clic.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.skills.map(s => (
                    <span 
                      key={s} 
                      style={{ 
                        background: '#EFF6FF', 
                        border: '1px solid #BFDBFE',
                        color: '#1E40AF',
                        padding: '4px 10px', 
                        borderRadius: '999px', 
                        fontSize: '12.5px', 
                        fontWeight: '600',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      {s}
                      <XCircle 
                        size={14} 
                        style={{ cursor: 'pointer', color: '#3B82F6' }} 
                        onClick={() => handleRemoveSkill(s)} 
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions de compétences recommandées */}
            <div style={{ marginTop: '2px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                💡 Suggestions recommandées (cliquez pour ajouter / retirer) :
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {POPULAR_SKILL_CATEGORIES.map(cat => (
                  <div key={cat.category} style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #F1F5F9', padding: '8px 10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                      {cat.category}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cat.skills.map(skill => {
                        const isSelected = formData.skills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => handleToggleSkill(skill)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: isSelected ? '700' : '500',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s',
                              backgroundColor: isSelected ? '#1A6FD4' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#334155',
                              border: `1px solid ${isSelected ? '#1A6FD4' : '#E2E8F0'}`,
                              boxShadow: isSelected ? '0 2px 4px rgba(26, 111, 212, 0.25)' : 'none'
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#E2E8F0';
                                e.currentTarget.style.color = '#0F172A';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#F1F5F9';
                                e.currentTarget.style.color = '#334155';
                              }
                            }}
                          >
                            {isSelected ? '✓' : '+'} {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* SECTION 5 : Détails (Textes longs) */}
          {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>À propos (Description générale) *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} placeholder="Description du poste et missions..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Profil recherché (Prérequis)</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="Ex: De formation Bac+2/3, bon niveau de langue..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={labelStyle}>Avantages</label>
                <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows={4} placeholder="Ex: Télétravail, prime, assurance santé..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>
          )}

          {/* Footer Buttons */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
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
