import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { 
  Loader2, Edit2, AlertCircle, CheckCircle2, Check, X, Plus, Trash2, 
  Search, Filter, CreditCard, FileText, PauseCircle, Users,
  Crown, Rocket, Building, Tag, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

const AVAILABLE_FEATURES = [
  // Candidats
  { key: 'unlimited_applications', label: 'Candidatures illimitées', type: 'boolean', target: ['candidate', 'both'] },
  { key: 'extra_applications_per_week', label: 'Candidatures sup. par semaine', type: 'number', target: ['candidate', 'both'] },
  
  // Entreprises
  { key: 'unlimited_job_postings', label: 'Publication d\'offres illimitée', type: 'boolean', target: ['company', 'both'] },
  { key: 'max_job_postings', label: 'Limite d\'offres publiées', type: 'number', target: ['company', 'both'] },
  { key: 'cv_search_access', label: 'Recherche avancée de CV', type: 'boolean', target: ['company', 'both'] },

  // Visibilité / Défloutage (Tous)
  { key: 'see_email', label: 'Voir l\'email', type: 'boolean', target: ['company', 'candidate', 'both'] },
  { key: 'see_phone', label: 'Voir le téléphone', type: 'boolean', target: ['company', 'candidate', 'both'] },
  { key: 'see_cv', label: 'Voir le CV', type: 'boolean', target: ['company', 'both'] },
  { key: 'see_address', label: 'Voir l\'adresse complète', type: 'boolean', target: ['company', 'candidate', 'both'] },
  { key: 'see_website', label: 'Voir le site web', type: 'boolean', target: ['company', 'candidate', 'both'] },
  { key: 'see_social_links', label: 'Voir les réseaux sociaux', type: 'boolean', target: ['company', 'candidate', 'both'] },

  // Standard Premium
  { key: 'profile_badge', label: 'Badge Premium sur le profil', type: 'boolean', target: ['company', 'candidate', 'both'] },
  { key: 'priority_support', label: 'Support Prioritaire', type: 'boolean', target: ['company', 'candidate', 'both'] },
];

export const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    key: '',
    icon: 'crown',
    target_type: 'company',
    price: 0,
    duration_type: 'monthly',
    duration_value: 1,
    is_active: true,
    sort_order: 0,
    features: []
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlanToView, setSelectedPlanToView] = useState(null);

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
        icon: item.icon || 'crown',
        target_type: item.target_type || 'company',
        price: item.price || 0,
        duration_type: item.duration_type || 'monthly',
        duration_value: item.duration_value || 1,
        is_active: item.is_active !== false,
        sort_order: item.sort_order || 0,
        features: item.features || []
      });
    } else {
      setFormData({
        key: '',
        icon: 'crown',
        target_type: 'company',
        price: 0,
        duration_type: 'monthly',
        duration_value: 1,
        is_active: true,
        sort_order: 0,
        features: []
      });
    }
    setIsModalOpen(true);
  };

  const handleViewPlan = (plan) => {
    setSelectedPlanToView(plan);
    setIsViewModalOpen(true);
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

  const filteredPlans = useMemo(() => {
    return plans.filter(item => {
      return (item.key || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [plans, searchTerm]);

  // Statistics
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.is_active).length;
  const inactivePlans = plans.filter(p => !p.is_active).length;
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.user_subscriptions_count || 0), 0);

  // Helper functions for displaying data
  const getPlanStyling = (plan) => {
    const k = plan.key ? plan.key.toLowerCase() : '';
    const iconType = plan.icon || '';
    
    // Default values if no translations are loaded
    let title = plan.translations && plan.translations.length > 0 ? plan.translations[0].name : (plan.key.charAt(0).toUpperCase() + plan.key.slice(1));
    let desc = plan.translations && plan.translations.length > 0 ? plan.translations[0].description : 'Plan standard';

    if (iconType === 'crown' || (!plan.icon && (k.includes('starter') || k.includes('debutant') || k.includes('débutant')))) {
      return { title: title !== plan.key ? title : 'Starter', icon: <Crown size={18} color="#3b82f6" />, bg: '#eff6ff', desc: desc !== 'Plan standard' ? desc : 'Idéal pour les débutants' };
    }
    if (iconType === 'rocket' || (!plan.icon && k.includes('pro'))) {
      return { title: title !== plan.key ? title : 'Pro', icon: <Rocket size={18} color="#16a34a" />, bg: '#dcfce7', desc: desc !== 'Plan standard' ? desc : 'Pour les professionnels' };
    }
    if (iconType === 'building' || (!plan.icon && (k.includes('entreprise') || k.includes('company')))) {
      return { title: title !== plan.key ? title : 'Entreprise', icon: <Building size={18} color="#f59e0b" />, bg: '#fef3c7', desc: desc !== 'Plan standard' ? desc : 'Pour les entreprises' };
    }
    if (iconType === 'tag' || (!plan.icon && (k.includes('gratuit') || k.includes('free') || k.includes('basic')))) {
      return { title: title !== plan.key ? title : 'Gratuit', icon: <Tag size={18} color="#8b5cf6" />, bg: '#f3e8ff', desc: desc !== 'Plan standard' ? desc : 'Plan de découverte' };
    }
    return { title, icon: <Crown size={18} color="#3b82f6" />, bg: '#eff6ff', desc };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getDurationText = (type) => {
    if (type === 'monthly') return 'Mensuel';
    if (type === 'yearly') return 'Annuel';
    if (type === 'weekly') return 'Hebdomadaire';
    if (type === 'daily') return 'Journalier';
    return type;
  };

  const getDurationSuffix = (type) => {
    if (type === 'monthly') return '/mois';
    if (type === 'yearly') return '/an';
    if (type === 'weekly') return '/sem';
    if (type === 'daily') return '/jour';
    return '';
  };

  return (
    <MainLayout>
      <style>{`
        .plan-table { width: 100%; border-collapse: collapse; text-align: left; }
        .plan-table th { 
          padding: 12px 16px; 
          font-weight: 600; 
          color: #64748b; 
          font-size: 12px; 
          border-bottom: 1px solid #e2e8f0; 
          background: #fff; 
        }
        .plan-table td { 
          padding: 8px 16px; 
          border-bottom: 1px solid #f1f5f9; 
          vertical-align: middle;
        }
        .plan-table tr:hover { background: #f8fafc; }
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover { background: #f8fafc; }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', fontFamily: 'var(--font-inter)' }}>
        
        {/* Header Title */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Plans d'abonnement</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                Gérez les différents plans proposés aux utilisateurs et entreprises.
              </p>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#2563eb', color: '#FFF',
                border: 'none', height: '36px', padding: '0 16px', borderRadius: '8px',
                fontWeight: '600', cursor: 'pointer', transition: '0.2s', fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              <Plus size={16} />
              Créer un plan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          
          {/* Total Plans */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginBottom: '2px' }}>Plans total</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{totalPlans}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>plans créés</div>
            </div>
          </div>

          {/* Active Plans */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginBottom: '2px' }}>Plans actifs</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activePlans}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>actifs</div>
            </div>
          </div>

          {/* Inactive Plans */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PauseCircle size={16} color="#eab308" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginBottom: '2px' }}>Plans inactifs</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{inactivePlans}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>inactif</div>
            </div>
          </div>

          {/* Total Subscribers */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginBottom: '2px' }}>Abonnés totaux</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{totalSubscribers}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>tous confondus</div>
            </div>
          </div>

        </div>

        {/* Content Box */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* Table Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Rechercher un plan..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px 16px 8px 32px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', width: '250px', fontSize: '13px', background: '#f8fafc' }}
              />
            </div>
            
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: 'none', borderRadius: '6px', background: '#f1f5f9', color: '#3b82f6', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              <Filter size={14} /> Filtres
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} /></div>
            ) : filteredPlans.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Aucun plan trouvé.</div>
            ) : (
              <table className="plan-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Nom du plan</th>
                    <th style={{ width: '15%' }}>Prix</th>
                    <th style={{ width: '12%' }}>Durée</th>
                    <th style={{ width: '13%' }}>Abonnés</th>
                    <th style={{ width: '10%' }}>Statut</th>
                    <th style={{ width: '15%' }}>Fonctionnalités</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map(plan => {
                    const style = getPlanStyling(plan);
                    const featuresCount = plan.features ? plan.features.length : plan.features_count || 0;
                    const abonnésCount = plan.user_subscriptions_count || 0;

                    return (
                      <tr key={plan.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {style.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', marginBottom: '2px' }}>{style.title}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{style.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', marginBottom: '2px' }}>{formatPrice(plan.price)}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{getDurationSuffix(plan.duration_type)}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
                            {getDurationText(plan.duration_type)}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px', marginBottom: '2px' }}>{abonnésCount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>abonnés</div>
                        </td>
                        <td>
                          {plan.is_active ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '600' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                              Actif
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: '#fef9c3', color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></span>
                              Inactif
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155', fontWeight: '500' }}>
                            {featuresCount > 0 ? `${featuresCount} fonctionnalités` : (plan.key.includes('entreprise') ? 'Tout inclus' : '0 fonctionnalités')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button 
                              className="action-btn"
                              style={{ padding: '0 10px', height: '28px', color: '#3b82f6', gap: '4px', fontWeight: '500', fontSize: '12px' }}
                              onClick={() => handleViewPlan(plan)}
                            >
                              <Eye size={12} /> Voir
                            </button>
                            <button 
                              className="action-btn"
                              style={{ width: '28px', height: '28px', color: '#3b82f6' }}
                              onClick={() => handleOpenModal(plan)}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="action-btn"
                              style={{ width: '28px', height: '28px', color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                              onClick={() => handleDelete(plan.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Affichage de 1 à {filteredPlans.length} sur {filteredPlans.length} plans
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'not-allowed', color: '#cbd5e1' }}>
                <ChevronLeft size={16} />
              </button>
              <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #3b82f6', borderRadius: '6px', background: '#eff6ff', color: '#3b82f6', fontWeight: '600', fontSize: '14px' }}>
                1
              </button>
              <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'not-allowed', color: '#cbd5e1' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      {isViewModalOpen && selectedPlanToView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '95%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: '90vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} color="#0052ff" /> Détails du plan
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: getPlanStyling(selectedPlanToView).bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getPlanStyling(selectedPlanToView).icon}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{getPlanStyling(selectedPlanToView).title}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{formatPrice(selectedPlanToView.price)} / {getDurationText(selectedPlanToView.duration_type)}</p>
                </div>
              </div>
              
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Fonctionnalités incluses ({selectedPlanToView.features?.length || 0})</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPlanToView.features && selectedPlanToView.features.length > 0 ? (
                  selectedPlanToView.features.map((feat, idx) => {
                    const featureDef = AVAILABLE_FEATURES.find(f => f.key === feat.feature_key);
                    const label = featureDef ? featureDef.label : feat.feature_key;
                    const valueStr = feat.value === 'unlimited' 
                      ? 'Illimité' 
                      : (feat.value === 'true' || feat.value === true ? '' : `: ${feat.value}`);

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} color="#16a34a" />
                        </div>
                        <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                          {label} <span style={{ color: '#0052ff', fontWeight: '700' }}>{valueStr}</span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Aucune fonctionnalité spécifique n'est définie pour ce plan.</p>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                style={{ padding: '8px 24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '500', color: '#475569', cursor: 'pointer', fontSize: '14px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: '90vh' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingItem ? <Edit2 size={20} color="#0052ff" /> : <Plus size={20} color="#0052ff" />}
                {editingItem ? 'Modifier le plan' : 'Nouveau plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Cible (Profil) *</label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => setFormData({...formData, target_type: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="candidate">Candidat</option>
                    <option value="company">Entreprise</option>
                    <option value="visitor">Visiteur / Organisateur</option>
                    <option value="both">Candidat & Entreprise</option>
                    <option value="all">Tous</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Clé du plan *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    placeholder="ex: starter, pro, entreprise..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Icône du plan *</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { id: 'crown', icon: <Crown size={24} color={formData.icon === 'crown' ? "#fff" : "#3b82f6"} />, bg: formData.icon === 'crown' ? '#3b82f6' : '#eff6ff', label: 'Couronne' },
                    { id: 'rocket', icon: <Rocket size={24} color={formData.icon === 'rocket' ? "#fff" : "#16a34a"} />, bg: formData.icon === 'rocket' ? '#16a34a' : '#dcfce7', label: 'Fusée' },
                    { id: 'building', icon: <Building size={24} color={formData.icon === 'building' ? "#fff" : "#f59e0b"} />, bg: formData.icon === 'building' ? '#f59e0b' : '#fef3c7', label: 'Immeuble' },
                    { id: 'tag', icon: <Tag size={24} color={formData.icon === 'tag' ? "#fff" : "#8b5cf6"} />, bg: formData.icon === 'tag' ? '#8b5cf6' : '#f3e8ff', label: 'Étiquette' },
                  ].map(icn => (
                    <div 
                      key={icn.id}
                      onClick={() => setFormData({...formData, icon: icn.id})}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        padding: '12px', borderRadius: '12px', border: formData.icon === icn.id ? `2px solid ${icn.bg}` : '2px solid transparent',
                        background: formData.icon === icn.id ? '#f8fafc' : 'transparent',
                        transition: '0.2s'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: icn.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                        {icn.icon}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: formData.icon === icn.id ? '#0f172a' : '#64748b' }}>{icn.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Prix (en FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Unité de temps *</label>
                  <select
                    value={formData.duration_type}
                    onChange={(e) => setFormData({...formData, duration_type: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="weekly">Semaines</option>
                    <option value="monthly">Mois</option>
                    <option value="yearly">Années</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Valeur (Durée) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_value}
                    onChange={(e) => setFormData({...formData, duration_value: parseInt(e.target.value) || 1})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Fonctionnalités incluses</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.features.map((feat, index) => {
                    const featureDef = AVAILABLE_FEATURES.find(f => f.key === feat.feature_key);
                    const isCustom = feat.is_custom || (feat.feature_key !== '' && !featureDef);
                    const isUnlimited = feat.value === 'unlimited';

                    return (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={isCustom ? '_custom' : feat.feature_key}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            if (e.target.value === '_custom') {
                              newFeatures[index].is_custom = true;
                              newFeatures[index].feature_key = '';
                              newFeatures[index].value = 'true';
                              newFeatures[index].translations = { fr: '', en: '', pt: '' };
                            } else {
                              newFeatures[index].is_custom = false;
                              newFeatures[index].feature_key = e.target.value;
                              const newDef = AVAILABLE_FEATURES.find(f => f.key === e.target.value);
                              newFeatures[index].value = newDef && newDef.type === 'boolean' ? 'true' : '';
                              delete newFeatures[index].translations;
                            }
                            setFormData({...formData, features: newFeatures});
                          }}
                          style={{ flex: isCustom ? 'none' : 1, width: isCustom ? '250px' : 'auto', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                        >
                          <option value="">-- Sélectionner une fonctionnalité --</option>
                          {AVAILABLE_FEATURES.filter(f => f.target.includes(formData.target_type) || formData.target_type === 'all' || formData.target_type === 'visitor').map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                          <option value="_custom" style={{ fontWeight: 'bold', color: '#0052ff' }}>➕ Fonctionnalité personnalisée</option>
                        </select>

                        {isCustom && (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input 
                              type="text"
                              placeholder="Texte (Français) ex: Cadeau"
                              value={feat.translations?.fr || feat.feature_key}
                              onChange={(e) => {
                                const newFeatures = [...formData.features];
                                if (!newFeatures[index].translations) newFeatures[index].translations = { fr: '', en: '', pt: '' };
                                newFeatures[index].translations.fr = e.target.value;
                                // Auto-generate technical key from FR text if empty or matches
                                newFeatures[index].feature_key = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
                                newFeatures[index].value = 'true';
                                setFormData({...formData, features: newFeatures});
                              }}
                              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                            />
                            <input 
                              type="text"
                              placeholder="Texte (Anglais) ex: Gift"
                              value={feat.translations?.en || ''}
                              onChange={(e) => {
                                const newFeatures = [...formData.features];
                                if (!newFeatures[index].translations) newFeatures[index].translations = { fr: '', en: '', pt: '' };
                                newFeatures[index].translations.en = e.target.value;
                                setFormData({...formData, features: newFeatures});
                              }}
                              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                            />
                            <input 
                              type="text"
                              placeholder="Texte (Portugais) ex: Presente"
                              value={feat.translations?.pt || ''}
                              onChange={(e) => {
                                const newFeatures = [...formData.features];
                                if (!newFeatures[index].translations) newFeatures[index].translations = { fr: '', en: '', pt: '' };
                                newFeatures[index].translations.pt = e.target.value;
                                setFormData({...formData, features: newFeatures});
                              }}
                              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                            />
                          </div>
                        )}
                        
                        {featureDef && featureDef.type === 'number' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                            {!isUnlimited && (
                              <input 
                                type="number"
                                placeholder="Valeur (ex: 4)"
                                value={feat.value}
                                onChange={(e) => {
                                  const newFeatures = [...formData.features];
                                  newFeatures[index].value = e.target.value;
                                  setFormData({...formData, features: newFeatures});
                                }}
                                style={{ width: '100px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                              />
                            )}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isUnlimited}
                                onChange={(e) => {
                                  const newFeatures = [...formData.features];
                                  newFeatures[index].value = e.target.checked ? 'unlimited' : '';
                                  setFormData({...formData, features: newFeatures});
                                }}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                              />
                              Illimité
                            </label>
                          </div>
                        )}

                        {(featureDef && featureDef.type === 'boolean') || isCustom ? (
                          <div style={{ flex: isCustom ? 'none' : 1, display: 'flex', alignItems: 'center', color: '#10b981', fontSize: '13px', fontWeight: '500' }}>
                            <CheckCircle2 size={16} style={{ marginRight: '4px' }} /> Inclus
                          </div>
                        ) : null}

                        <button 
                          onClick={() => {
                            const newFeatures = formData.features.filter((_, i) => i !== index);
                            setFormData({...formData, features: newFeatures});
                          }}
                          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          title="Supprimer la fonctionnalité"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => setFormData({...formData, features: [...formData.features, { feature_key: '', value: '', translations: { fr: '', en: '', pt: '' } }]})}
                    style={{ padding: '8px 12px', alignSelf: 'flex-start', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                  >
                    <Plus size={14} /> Ajouter une fonctionnalité
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '14px', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
                  Activer ce plan immédiatement
                </label>
              </div>

            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid #e2e8f0', padding: '20px 24px', background: '#fff' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '500', color: '#475569', cursor: 'pointer', fontSize: '14px' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                style={{ padding: '10px 24px', background: '#0052ff', border: 'none', borderRadius: '8px', fontWeight: '500', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {editingItem ? 'Mettre à jour' : 'Créer le plan'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'rgba(16, 185, 129, 0.95)', color: '#FFF',
          padding: '14px 20px', borderRadius: '12px',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(8px)',
          animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </MainLayout>
  );
};
