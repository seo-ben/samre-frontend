import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Filter, Plus, Bookmark, MoreVertical, 
  MapPin, Clock, Calendar, Euro, Info, 
  ChevronLeft, ChevronRight, CheckCircle2,
  X, Edit3
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import CreateOfferModal from '../components/offers/CreateOfferModal';

export const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [activeTab, setActiveTab] = useState('Détails');
  
  const location = useLocation();
  const navigate = useNavigate();

  const getStatusFromPath = (path) => {
    if (path.includes('/offers/pending')) return 'pending';
    if (path.includes('/offers/approved')) return 'published';
    if (path.includes('/offers/expired')) return 'expired';
    return 'all';
  };

  const [filterStatus, setFilterStatus] = useState(getStatusFromPath(location.pathname));
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  
  useEffect(() => {
    setFilterStatus(getStatusFromPath(location.pathname));
  }, [location.pathname]);

  const handleStatusChange = (e) => {
    const val = e.target.value;
    if (val === 'pending') navigate('/offers/pending');
    else if (val === 'published') navigate('/offers/approved');
    else if (val === 'expired') navigate('/offers/expired');
    else navigate('/offers');
  };
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const handleToggleFeatured = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await apiClient.put(`/v1/admin/offers/${id}/toggle-featured`);
      const updatedFeatured = res.data.data.is_featured;
      setOffers(offers.map(o => o.id === id ? { ...o, is_featured: updatedFeatured } : o));
    } catch (err) {
      console.error('Erreur mise en avant', err);
    }
  };

  const handleChangeStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const res = await apiClient.put(`/v1/admin/offers/${id}/status`, { status: newStatus });
      setOffers(offers.map(o => o.id === id ? res.data.data : o));
      setActiveMenuId(null);
    } catch (err) {
      console.error('Erreur changement statut', err);
    }
  };

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchOffers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/offers', {
        params: { page, status: filterStatus, category_id: filterCategory, sort_by: sortOrder }
      });
      setOffers(response.data.data);
      setMeta(response.data.meta);
      if (response.data.data.length > 0 && !selectedOfferId) {
        setSelectedOfferId(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des offres', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/v1/offers/categories');
        setCategories(response.data.data);
      } catch (err) {
        console.error('Erreur catégories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOffers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterCategory, sortOrder]);

  const selectedOffer = offers.find(o => o.id === selectedOfferId) || offers[0];

  return (
    <MainLayout>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', fontFamily: 'var(--font-inter)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)', margin: '0 0 4px 0' }}>Toutes les offres de stage</h1>
            <p style={{ fontSize: '14px', color: 'var(--gray-medium)', margin: 0 }}>Découvrez les opportunités de stage publiées par les entreprises</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filterStatus}
              onChange={handleStatusChange}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--gray-border)', borderRadius: '8px', background: '#fff',
                fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="published">Publiées</option>
              <option value="rejected">Rejetées</option>
              <option value="expired">Expirées</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--gray-border)', borderRadius: '8px', background: '#fff',
                fontSize: '14px', fontWeight: '500', color: 'var(--black-deep)', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="recent">Trier par: Récentes</option>
              <option value="oldest">Trier par: Anciennes</option>
            </select>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                border: 'none', borderRadius: '8px', background: '#0052ff',
                fontSize: '14px', fontWeight: '500', color: '#fff', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Nouvelle offre
            </button>
          </div>
        </div>

        {/* Filter Pills for Categories */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setFilterCategory('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '999px',
              border: filterCategory === 'all' ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
              background: filterCategory === 'all' ? '#eef2ff' : '#ffffff',
              color: filterCategory === 'all' ? '#4f46e5' : '#475569',
              fontSize: '13.5px', fontWeight: filterCategory === 'all' ? '600' : '500', cursor: 'pointer'
            }}
          >
            Toutes
          </button>
          
          {categories.map((cat) => {
            const active = filterCategory === cat.id;
            return (
              <button 
                key={cat.id} 
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '999px',
                  border: active ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                  background: active ? '#eef2ff' : '#ffffff',
                  color: active ? '#4f46e5' : '#475569',
                  fontSize: '13.5px', fontWeight: active ? '600' : '500', cursor: 'pointer'
                }}
              >
                {cat.name}
                {cat.offers_count !== undefined && (
                  <span style={{
                    background: active ? '#ffffff' : '#f1f5f9',
                    color: active ? '#4f46e5' : '#64748b',
                    padding: '2px 6px', borderRadius: '999px', fontSize: '11px', fontWeight: '600'
                  }}>
                    {cat.offers_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Split */}
        <div style={{ display: 'flex', gap: '1px', flex: 1, minHeight: 0 }}>
          
          {/* Left Pane - List */}
          <div className="hide-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', paddingRight: '8px' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chargement des offres...</div>}
            {!loading && offers.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Aucune offre trouvée.</div>}
            
            {!loading && offers.map((offer) => {
              const isActive = offer.id === selectedOfferId;
              const companyName = offer.company?.company_name || 'Entreprise inconnue';
              const logoUrl = offer.company?.logo_url || '/logo-samre.png';
              const verified = offer.company?.has_badge;

              return (
                <div 
                  key={offer.id} 
                  onClick={() => setSelectedOfferId(offer.id)}
                  style={{
                    background: '#ffffff',
                    border: isActive ? '2px solid #0052ff' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(0, 82, 255, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '8px',
                        border: '1px solid #f1f5f9', padding: '2px', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <img src={logoUrl} alt={companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px 0' }}>{offer.title || 'Sans titre'}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{companyName}</span>
                          {verified && <CheckCircle2 size={12} color="#0052ff" fill="#0052ff" style={{ color: '#fff' }} />}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', background: '#eef2ff',
                            color: '#4f46e5', fontSize: '11px', fontWeight: '600'
                          }}>
                            {offer.contract_type || 'Stage'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                            <MapPin size={12} /> {offer.commune_name || offer.commune_id || 'Lieu non spécifié'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {offer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', color: '#94a3b8', position: 'relative' }}>
                      <Bookmark 
                        size={16} 
                        style={{ cursor: 'pointer', color: offer.is_featured ? '#eab308' : '#94a3b8', fill: offer.is_featured ? '#eab308' : 'none' }} 
                        onClick={(e) => handleToggleFeatured(offer.id, e)} 
                        title="Mettre en avant"
                      />
                      <MoreVertical 
                        size={16} 
                        style={{ cursor: 'pointer' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === offer.id ? null : offer.id);
                        }}
                      />
                      {activeMenuId === offer.id && (
                        <div style={{
                          position: 'absolute', top: '24px', right: 0, background: '#fff',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0',
                          borderRadius: '8px', zIndex: 50, minWidth: '160px', overflow: 'hidden'
                        }}>
                          {(offer.status === 'published' || offer.status === 'pending') && (
                            <div 
                              onClick={(e) => handleChangeStatus(offer.id, 'paused', e)}
                              style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            >
                              ⏸️ Mettre en pause
                            </div>
                          )}
                          {offer.status === 'paused' && (
                            <div 
                              onClick={(e) => handleChangeStatus(offer.id, 'published', e)}
                              style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            >
                              ▶️ Republier
                            </div>
                          )}
                          {(offer.status === 'published' || offer.status === 'paused') && (
                            <div 
                              onClick={(e) => handleChangeStatus(offer.id, 'closed', e)}
                              style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a', cursor: 'pointer' }}
                            >
                              ✅ Marquer pourvue
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Pagination Controls */}
            {!loading && meta && meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px', paddingBottom: '20px' }}>
                <button 
                  disabled={meta.current_page === 1}
                  onClick={() => fetchOffers(meta.current_page - 1)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} color="#64748b" />
                </button>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                  {meta.current_page} / {meta.last_page}
                </span>
                <button 
                  disabled={meta.current_page === meta.last_page}
                  onClick={() => fetchOffers(meta.current_page + 1)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === meta.last_page ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} color="#64748b" />
                </button>
              </div>
            )}
          </div>

          {/* Right Pane - Details */}
          <div className="hide-scrollbar" style={{ flex: '0 0 600px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowY: 'auto', padding: '32px' }}>
            {!selectedOffer && !loading && (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>Sélectionnez une offre pour voir les détails.</div>
            )}
            
            {selectedOffer && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '12px',
                      border: '1px solid #f1f5f9', padding: '6px', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <img src={selectedOffer.company?.logo_url || '/logo-samre.png'} alt={selectedOffer.company?.company_name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>{selectedOffer.title || 'Sans titre'}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedOffer.company?.company_name}</span>
                        {selectedOffer.company?.has_badge && <CheckCircle2 size={15} color="#0052ff" fill="#0052ff" style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '999px', background: '#eef2ff',
                          color: '#4f46e5', fontSize: '12px', fontWeight: '600'
                        }}>
                          {selectedOffer.contract_type || 'Stage'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          Publié {selectedOffer.published_at ? new Date(selectedOffer.published_at).toLocaleDateString() : 'Non publié'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
                    <button 
                      onClick={() => {
                        setEditingOffer(selectedOffer);
                        setShowCreateModal(true);
                      }}
                      style={{ padding: '6px 12px', background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                      <Edit3 size={14} /> Modifier
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  {['Détails', 'À propos', 'Profil recherché', 'Avantages', 'Candidatures'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ 
                        padding: '0 0 12px 0', 
                        border: 'none', 
                        borderBottom: activeTab === tab ? '2px solid #0052ff' : '2px solid transparent', 
                        background: 'transparent', 
                        color: activeTab === tab ? '#0052ff' : '#64748b', 
                        fontSize: '14px', 
                        fontWeight: activeTab === tab ? '600' : '500', 
                        cursor: 'pointer' 
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'Détails' && (
                  <>
                    {/* Quick Info Grid - Row 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0', padding: '20px 20px 10px 20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <MapPin size={16} /> Lieu
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{selectedOffer.commune_name || selectedOffer.commune_id || "Non précisé"}</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <Clock size={16} /> Durée
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{selectedOffer.duration || "Non précisée"}</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <Calendar size={16} /> Début
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {selectedOffer.start_date 
                            ? new Date(selectedOffer.start_date).toLocaleDateString() 
                            : (selectedOffer.published_at ? new Date(selectedOffer.published_at).toLocaleDateString() : "Non précisé")
                          }
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <Euro size={16} /> Rémunération
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {selectedOffer.salary ? `${selectedOffer.salary.min} - ${selectedOffer.salary.max}` : "Non précisé"}
                        </div>
                      </div>
                    </div>

                    {/* Quick Info Grid - Row 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f8fafc', borderRadius: '0 0 12px 12px', padding: '10px 20px 20px 20px', marginBottom: '32px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          Expérience
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                          {{
                            'junior': 'Junior (0-2 ans)',
                            'mid': 'Intermédiaire (2-5 ans)',
                            'senior': 'Sénior (5+ ans)'
                          }[selectedOffer.experience_level] || selectedOffer.experience_level || "Non précisée"}
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          Postes vacants
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{selectedOffer.positions_count || "1"}</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          Catégorie
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{selectedOffer.category_name || selectedOffer.category_id || "Non précisée"}</div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          Moyen de transport
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {selectedOffer.requires_transport ? "Exigé" : "Non exigé"}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Description du poste</h3>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                        {selectedOffer.description || "Aucune description disponible."}
                      </p>
                    </div>

                    {/* Exigences */}
                    {selectedOffer.requirements && (
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Exigences & Qualifications</h3>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                          {selectedOffer.requirements}
                        </p>
                      </div>
                    )}

                    {/* Avantages */}
                    {selectedOffer.benefits && (
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Avantages du poste</h3>
                        <div style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          {selectedOffer.benefits}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Compétences requises</h3>
                      {selectedOffer.skills && selectedOffer.skills.length > 0 ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {selectedOffer.skills.map((skill, index) => (
                            <span key={index} style={{
                              padding: '6px 12px', background: '#eef2ff', color: '#4f46e5',
                              borderRadius: '6px', fontSize: '13px', fontWeight: '500'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                          Aucune compétence spécifique n'est exigée.
                        </p>
                      )}
                    </div>

                    {/* Profiles */}
                    {selectedOffer.profiles && selectedOffer.profiles.length > 0 && (
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Profils recherchés</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {selectedOffer.profiles.map((profile, index) => (
                            <span key={index} style={{
                              padding: '6px 12px', background: '#f0f9ff', color: '#0284c7',
                              borderRadius: '6px', fontSize: '13px', fontWeight: '500'
                            }}>
                              {profile}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '64px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '24px 0', marginBottom: '32px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', marginBottom: '6px' }}>Date limite de candidature</div>
                        <div style={{ fontSize: '14px', color: '#475569' }}>{selectedOffer.deadline_at ? new Date(selectedOffer.deadline_at).toLocaleDateString() : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', marginBottom: '6px' }}>Nombre de candidatures</div>
                        <div style={{ fontSize: '14px', color: '#475569' }}>{selectedOffer.applications_count || "0"}</div>
                      </div>
                    </div>

                    {/* Admin Info Banner */}
                    <div style={{ display: 'flex', gap: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ color: '#16a34a', marginTop: '2px' }}>
                        <Info size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#166534', margin: '0 0 6px 0' }}>Interface administrateur</h4>
                        <p style={{ fontSize: '13px', color: '#15803d', margin: 0, lineHeight: '1.5' }}>
                          Vous pouvez consulter les détails de cette offre. La candidature n'est pas disponible depuis ce compte.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Candidatures' && (
                  <OfferApplicationsTab offerId={selectedOffer.id} />
                )}
                
                {activeTab === 'À propos' && (
                  <div style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>À propos de l'offre</h3>
                    <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {selectedOffer.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune description fournie.</span>}
                    </div>
                  </div>
                )}
                
                {activeTab === 'Profil recherché' && (
                  <div style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Prérequis et profil</h3>
                    <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {selectedOffer.requirements || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucun prérequis spécifié.</span>}
                    </div>
                  </div>
                )}
                
                {activeTab === 'Avantages' && (
                  <div style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Avantages du poste</h3>
                    <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      {selectedOffer.benefits || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucun avantage spécifié.</span>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateOfferModal 
          categories={categories}
          initialData={editingOffer}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOffer(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingOffer(null);
            fetchOffers(meta?.current_page || 1);
          }}
        />
      )}
    </MainLayout>
  );
};

// Component for the Candidatures tab
const OfferApplicationsTab = ({ offerId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState('all'); // pending, scheduled, hired

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/v1/admin/offers/${offerId}/applications`, {
          params: { status: appFilter !== 'all' ? appFilter : undefined }
        });
        setApplications(response.data.data);
      } catch (error) {
        console.error('Erreur lors du chargement des candidatures', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [offerId, appFilter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Toutes', value: 'all' },
          { label: 'Postulé', value: 'pending' },
          { label: 'Programmé', value: 'scheduled' },
          { label: 'Retenu', value: 'hired' },
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setAppFilter(filter.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: appFilter === filter.value ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
              background: appFilter === filter.value ? '#eef2ff' : '#fff',
              color: appFilter === filter.value ? '#4f46e5' : '#64748b',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chargement des candidatures...</div>
      ) : applications.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
          Aucune candidature trouvée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map(app => (
            <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold' }}>
                  {app.candidate_profile?.user?.first_name?.[0]}{app.candidate_profile?.user?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {app.candidate_profile?.user?.first_name} {app.candidate_profile?.user?.last_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Postulé le {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div>
                <span style={{ padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', 
                  background: app.status === 'hired' ? '#dcfce7' : app.status === 'scheduled' ? '#fef9c3' : '#f1f5f9',
                  color: app.status === 'hired' ? '#166534' : app.status === 'scheduled' ? '#854d0e' : '#475569'
                }}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
