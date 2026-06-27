import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Plus, MoreVertical, MapPin, Clock, Calendar, Info, 
  ChevronLeft, ChevronRight, CheckCircle, Users, Map
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeTab, setActiveTab] = useState('Détails');
  
  const location = useLocation();
  const navigate = useNavigate();

  const getStatusFromPath = (path) => {
    if (path.includes('/events/pending')) return 'pending';
    if (path.includes('/events/approved')) return 'published';
    if (path.includes('/events/expired')) return 'expired';
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
    if (val === 'pending') navigate('/events/pending');
    else if (val === 'published') navigate('/events/approved');
    else if (val === 'expired') navigate('/events/expired');
    else navigate('/events');
  };
  
  const [activeMenuId, setActiveMenuId] = useState(null);

  const handleChangeStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      if (newStatus === 'published' && selectedEvent?.status === 'pending') {
        // Use validate endpoint
        const res = await apiClient.post(`/v1/admin/events/${id}/validate`);
        setEvents(events.map(ev => ev.id === id ? res.data.data : ev));
      } else if (newStatus === 'rejected' && selectedEvent?.status === 'pending') {
        const reason = window.prompt("Raison du rejet :");
        if (!reason) return;
        const res = await apiClient.post(`/v1/admin/events/${id}/reject`, { rejection_reason: reason });
        setEvents(events.map(ev => ev.id === id ? res.data.data : ev));
      } else {
        const res = await apiClient.put(`/v1/admin/events/${id}/status`, { status: newStatus });
        setEvents(events.map(ev => ev.id === id ? res.data.data : ev));
      }
      setActiveMenuId(null);
    } catch (err) {
      console.error('Erreur changement statut', err);
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    try {
      await apiClient.delete(`/v1/admin/events/${id}`);
      setEvents(events.filter(ev => ev.id !== id));
      if (selectedEventId === id) setSelectedEventId(null);
      setActiveMenuId(null);
    } catch (err) {
      console.error('Erreur suppression', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/admin/events', {
        params: { page, status: filterStatus, category_id: filterCategory, sort_by: sortOrder }
      });
      setEvents(response.data.data);
      setMeta(response.data.meta);
      if (response.data.data.length > 0 && !selectedEventId) {
        setSelectedEventId(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des événements', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/v1/admin/cms/dynamic/event-categories');
        setCategories(response.data.data);
      } catch (err) {
        console.error('Erreur catégories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterCategory, sortOrder]);

  const selectedEvent = events.find(ev => ev.id === selectedEventId) || events[0];

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
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--black-deep)', margin: '0 0 4px 0' }}>Gestion des événements</h1>
            <p style={{ fontSize: '14px', color: 'var(--gray-medium)', margin: 0 }}>Modérez et gérez les événements publiés</p>
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
              <option value="published">Publiés</option>
              <option value="rejected">Rejetés</option>
              <option value="expired">Expirés</option>
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
              <option value="recent">Trier par: Récents</option>
              <option value="oldest">Trier par: Anciens</option>
            </select>
            {/* Modal button could go here in the future */}
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
            const transName = cat.translations?.find(t => t.language_id === 1)?.name || "Catégorie";
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
                {transName}
              </button>
            );
          })}
        </div>

        {/* Main Content Split */}
        <div style={{ display: 'flex', gap: '1px', flex: 1, minHeight: 0 }}>
          
          {/* Left Pane - List */}
          <div className="hide-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', paddingRight: '8px' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chargement des événements...</div>}
            {!loading && events.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Aucun événement trouvé.</div>}
            
            {!loading && events.map((ev) => {
              const isActive = ev.id === selectedEventId;
              const title = ev.translations?.find(t => t.language_id === 1)?.title || "Sans titre";
              const category = ev.category?.translations?.find(t => t.language_id === 1)?.name || "Non spécifiée";

              return (
                <div 
                  key={ev.id} 
                  onClick={() => setSelectedEventId(ev.id)}
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
                        border: '1px solid #f1f5f9', background: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        color: '#475569'
                      }}>
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px 0' }}>{title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{new Date(ev.event_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', background: '#eef2ff',
                            color: '#4f46e5', fontSize: '11px', fontWeight: '600'
                          }}>
                            {category}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                            {ev.is_online ? <><Map size={12}/> En ligne</> : <><MapPin size={12}/> {ev.location_name || 'Lieu spécifié'}</>}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {ev.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', color: '#94a3b8', position: 'relative' }}>
                      <MoreVertical 
                        size={16} 
                        style={{ cursor: 'pointer' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === ev.id ? null : ev.id);
                        }}
                      />
                      {activeMenuId === ev.id && (
                        <div style={{
                          position: 'absolute', top: '24px', right: 0, background: '#fff',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0',
                          borderRadius: '8px', zIndex: 50, minWidth: '160px', overflow: 'hidden'
                        }}>
                          {ev.status === 'pending' && (
                            <>
                              <div onClick={(e) => handleChangeStatus(ev.id, 'published', e)} style={{ padding: '10px 12px', fontSize: '13px', color: '#16a34a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>✅ Valider</div>
                              <div onClick={(e) => handleChangeStatus(ev.id, 'rejected', e)} style={{ padding: '10px 12px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>❌ Rejeter</div>
                            </>
                          )}
                          {(ev.status === 'published' || ev.status === 'pending') && (
                            <div 
                              onClick={(e) => handleChangeStatus(ev.id, 'paused', e)}
                              style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            >
                              ⏸️ Mettre en pause
                            </div>
                          )}
                          {ev.status === 'paused' && (
                            <div 
                              onClick={(e) => handleChangeStatus(ev.id, 'published', e)}
                              style={{ padding: '10px 12px', fontSize: '13px', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            >
                              ▶️ Republier
                            </div>
                          )}
                          <div 
                            onClick={(e) => handleDelete(ev.id, e)}
                            style={{ padding: '10px 12px', fontSize: '13px', color: '#dc2626', cursor: 'pointer' }}
                          >
                            🗑️ Supprimer
                          </div>
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
                  onClick={() => fetchEvents(meta.current_page - 1)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} color="#64748b" />
                </button>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                  {meta.current_page} / {meta.last_page}
                </span>
                <button 
                  disabled={meta.current_page === meta.last_page}
                  onClick={() => fetchEvents(meta.current_page + 1)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: meta.current_page === meta.last_page ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} color="#64748b" />
                </button>
              </div>
            )}
          </div>

          {/* Right Pane - Details */}
          <div className="hide-scrollbar" style={{ flex: '0 0 600px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowY: 'auto', padding: '32px' }}>
            {!selectedEvent && !loading && (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>Sélectionnez un événement pour voir les détails.</div>
            )}
            
            {selectedEvent && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '12px',
                      border: '1px solid #f1f5f9', background: '#f8fafc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: '#475569'
                    }}>
                      <Calendar size={40} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                        {selectedEvent.translations?.find(t => t.language_id === 1)?.title || 'Sans titre'}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{selectedEvent.creator?.first_name} {selectedEvent.creator?.last_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '999px', background: '#eef2ff',
                          color: '#4f46e5', fontSize: '12px', fontWeight: '600'
                        }}>
                          {selectedEvent.category?.translations?.find(t => t.language_id === 1)?.name || 'Non spécifiée'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          Publié le {selectedEvent.created_at ? new Date(selectedEvent.created_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  {['Détails', 'Participants'].map(tab => (
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0', padding: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          {selectedEvent.is_online ? <Map size={16} /> : <MapPin size={16} />} 
                          Lieu
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {selectedEvent.is_online ? 'En ligne' : (selectedEvent.location_name || 'Non précisé')}
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <Calendar size={16} /> Date
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {new Date(selectedEvent.event_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                          <Users size={16} /> Participants
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>
                          {selectedEvent.participations_count || 0} / {selectedEvent.max_participants || '∞'}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ margin: '32px 0' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Description</h3>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                        {selectedEvent.translations?.find(t => t.language_id === 1)?.description || "Aucune description détaillée."}
                      </p>
                    </div>

                    {selectedEvent.is_online && selectedEvent.online_link && (
                      <div style={{ marginBottom: '32px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', margin: '0 0 8px 0' }}>Lien de l'événement</h3>
                        <a href={selectedEvent.online_link} target="_blank" rel="noreferrer" style={{ color: '#15803d', textDecoration: 'underline', fontSize: '14px' }}>
                          {selectedEvent.online_link}
                        </a>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'Participants' && (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', textAlign: 'center' }}>
                    La liste détaillée des participants sera bientôt disponible.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
