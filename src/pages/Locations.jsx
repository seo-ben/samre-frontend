import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { Plus, X, Loader2, AlertCircle, Globe, MapPin, Trash2, Edit2, Upload } from 'lucide-react';

export const LocationsPage = () => {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Sélections actives (Cascading)
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [modalType, setModalType] = useState('country'); // country, region, prefecture, commune
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fileInputRef = useRef(null);

  // Toast (Notifications)
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setActionLoading(true);
    showToast("Importation en cours...", "info");
    
    try {
      const response = await apiClient.post('/v1/admin/cms/dynamic/locations/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(response.data.message || "Importation réussie.", "success");
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'importation.", "error");
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // SVG Lines Logic
  const [lines, setLines] = useState([]);

  const updateLines = React.useCallback(() => {
    const container = document.getElementById('tree-scroll-container');
    const svgOverlay = document.getElementById('svg-overlay');
    if (!container || !svgOverlay) return;

    const containerRect = svgOverlay.getBoundingClientRect();
    const newLines = [];

    const connectNodes = (parentId, childrenIds) => {
      const parentEl = document.getElementById(parentId);
      if (!parentEl) return;
      const parentRect = parentEl.getBoundingClientRect();
      const startX = parentRect.right - containerRect.left;
      const startY = parentRect.top + parentRect.height / 2 - containerRect.top;

      childrenIds.forEach(childId => {
        const childEl = document.getElementById(childId);
        if (childEl) {
          const childRect = childEl.getBoundingClientRect();
          const endX = childRect.left - containerRect.left;
          const endY = childRect.top + childRect.height / 2 - containerRect.top;
          newLines.push({ startX, startY, endX, endY });
        }
      });
    };

    if (selectedCountry) {
      const childIds = regions.filter(r => r.country_id === selectedCountry.id).map(r => `node-region-${r.id}`);
      childIds.push(`add-region-${selectedCountry.id}`);
      connectNodes(`node-country-${selectedCountry.id}`, childIds);
    }
    
    if (selectedRegion) {
      const childIds = prefectures.filter(p => p.region_id === selectedRegion.id).map(p => `node-prefecture-${p.id}`);
      childIds.push(`add-prefecture-${selectedRegion.id}`);
      connectNodes(`node-region-${selectedRegion.id}`, childIds);
    }

    if (selectedPrefecture) {
      const childIds = communes.filter(c => c.prefecture_id === selectedPrefecture.id).map(c => `node-commune-${c.id}`);
      childIds.push(`add-commune-${selectedPrefecture.id}`);
      connectNodes(`node-prefecture-${selectedPrefecture.id}`, childIds);
    }

    setLines(newLines);
  }, [selectedCountry, selectedRegion, selectedPrefecture, regions, prefectures, communes]);

  useEffect(() => {
    const timer = setTimeout(updateLines, 50);
    window.addEventListener('resize', updateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLines);
    };
  }, [updateLines]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resC, resR, resP, resCom] = await Promise.all([
        apiClient.get('/v1/admin/cms/dynamic/countries'),
        apiClient.get('/v1/admin/cms/dynamic/regions'),
        apiClient.get('/v1/admin/cms/dynamic/prefectures'),
        apiClient.get('/v1/admin/cms/dynamic/communes')
      ]);

      setCountries(resC.data?.data || []);
      setRegions(resR.data?.data || []);
      setPrefectures(resP.data?.data || []);
      setCommunes(resCom.data?.data || []);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des données géographiques.');
    } finally {
      setLoading(false);
    }
  };

  const getName = (item) => {
    if (!item) return '';
    if (item.translations && item.translations.length > 0 && item.translations[0]) {
      return item.translations[0].name || item.name || '';
    }
    return item.name || '';
  };

  const handleSelectCountry = (c) => {
    if (selectedCountry?.id === c.id) {
      setSelectedCountry(null);
      setSelectedRegion(null);
      setSelectedPrefecture(null);
    } else {
      setSelectedCountry(c);
      setSelectedRegion(null);
      setSelectedPrefecture(null);
    }
  };

  const handleSelectRegion = (r) => {
    if (selectedRegion?.id === r.id) {
      setSelectedRegion(null);
      setSelectedPrefecture(null);
    } else {
      setSelectedRegion(r);
      setSelectedPrefecture(null);
    }
  };

  const handleSelectPrefecture = (p) => {
    if (selectedPrefecture?.id === p.id) {
      setSelectedPrefecture(null);
    } else {
      setSelectedPrefecture(p);
    }
  };

  const handleOpenModal = (type, parentId, item = null) => {
    setModalType(type);
    setIsEditing(!!item);
    
    if (item) {
      setEditForm({
        id: item.id,
        name: getName(item),
        code: item.code || '',
        phone_code: item.phone_code || '',
        flag_url: item.flag_url || '',
        is_eligible: item.is_eligible ? 1 : 0,
        sort_order: item.sort_order || 0,
        country_id: item.country_id || '',
        region_id: item.region_id || '',
        prefecture_id: item.prefecture_id || '',
        latitude: item.latitude || '',
        longitude: item.longitude || '',
        is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1
      });
    } else {
      setEditForm({
        name: '',
        code: '',
        phone_code: '',
        flag_url: '',
        is_eligible: 1,
        sort_order: 0,
        country_id: type === 'region' ? parentId : '',
        region_id: type === 'prefecture' ? parentId : '',
        prefecture_id: type === 'commune' ? parentId : '',
        latitude: '',
        longitude: '',
        is_active: 1
      });
    }
    setShowModal(true);
  };

  const executeDelete = async () => {
    setActionLoading(true);
    let endpointType = modalType === 'country' ? 'countries' : modalType === 'region' ? 'regions' : modalType === 'prefecture' ? 'prefectures' : 'communes';
    
    try {
      await apiClient.delete(`/v1/admin/cms/dynamic/${endpointType}/${editForm.id}`);
      await fetchData();
      setShowModal(false);
      setShowConfirmDelete(false);
      
      if (modalType === 'country' && selectedCountry?.id === editForm.id) setSelectedCountry(null);
      if (modalType === 'region' && selectedRegion?.id === editForm.id) setSelectedRegion(null);
      if (modalType === 'prefecture' && selectedPrefecture?.id === editForm.id) setSelectedPrefecture(null);
      
      showToast("Élément supprimé avec succès.", "success");

    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de la suppression.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    let endpointType = modalType === 'country' ? 'countries' : modalType === 'region' ? 'regions' : modalType === 'prefecture' ? 'prefectures' : 'communes';
    
    let data = {
      name: editForm.name,
      code: editForm.code
    };

    if (modalType === 'country') {
      data.phone_code = editForm.phone_code;
      data.flag_url = editForm.flag_url;
      data.is_eligible = editForm.is_eligible;
      data.sort_order = editForm.sort_order;
    } else if (modalType === 'region') {
      data.country_id = editForm.country_id;
      data.is_active = editForm.is_active;
    } else if (modalType === 'prefecture') {
      data.region_id = editForm.region_id;
      data.latitude = editForm.latitude || null;
      data.longitude = editForm.longitude || null;
      data.is_active = editForm.is_active;
    } else if (modalType === 'commune') {
      data.prefecture_id = editForm.prefecture_id;
      data.is_active = editForm.is_active;
    }

    try {
      if (isEditing) {
        await apiClient.put(`/v1/admin/cms/dynamic/${endpointType}/${editForm.id}`, data);
        showToast("Modifications enregistrées avec succès.", "success");
      } else {
        await apiClient.post(`/v1/admin/cms/dynamic/${endpointType}`, data);
        showToast("Création effectuée avec succès.", "success");
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Composant de Nœud ──────────────────────────────────────────────
  const NodeCard = ({ item, type, isSelected, onClick, onDoubleClick }) => {
    return (
      <div 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          width: '180px',
          background: isSelected ? '#1A6FD4' : '#FFFFFF',
          border: `1.5px solid ${isSelected ? '#1A6FD4' : '#E2E8F0'}`,
          borderRadius: '10px',
          padding: '8px 10px',
          cursor: 'pointer',
          boxShadow: isSelected ? '0 8px 16px rgba(26,111,212,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          position: 'relative',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = '#94A3B8';
            e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0,0,0,0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
          }
        }}
      >
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px', 
          background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {type === 'country' && item.flag_url ? (
            <img src={item.flag_url} alt="flag" style={{ width: '16px', height: '12px', objectFit: 'cover', borderRadius: '2px' }} />
          ) : type === 'country' ? (
            <Globe size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
          ) : (
            <MapPin size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
          )}
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? '#FFFFFF' : '#0F1923', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getName(item)}
          </div>
          <div style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#64748B', marginTop: '1px' }}>
            {item.code || 'Code N/A'} {item.phone_code ? `| ${item.phone_code}` : ''}
          </div>
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
          style={{ opacity: isSelected ? 1 : 0.4, cursor: 'pointer', padding: '2px' }} 
          title="Cliquez pour modifier"
        >
          <Edit2 size={12} color={isSelected ? '#FFFFFF' : '#94A3B8'} />
        </div>
      </div>
    );
  };

  const AddNodeBtn = ({ label, onClick }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: '180px',
        padding: '10px',
        background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1',
        borderRadius: '10px',
        color: '#64748B',
        fontWeight: '600',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        position: 'relative',
        zIndex: 10
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A6FD4'; e.currentTarget.style.color = '#1A6FD4'; e.currentTarget.style.background = '#EFF6FF'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = '#F8FAFC'; }}
    >
      <Plus size={16} /> {label}
    </button>
  );

  return (
    <MainLayout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .tree-container {
          background: #F4F6FA;
          border-radius: 16px;
          border: 1px solid var(--gray-border);
          overflow: auto;
          padding: 40px;
          height: calc(100vh - 180px);
          box-shadow: inset 0 2px 12px rgba(0,0,0,0.02);
        }

        /* Liste ul / li pour dessiner les branches */
        .tree-ul {
          list-style: none;
          margin: 0;
          padding: 0;
          padding-left: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        /* Ligne verticale qui relie tous les enfants */
        .tree-li {
          position: relative;
          display: flex;
          align-items: center;
          padding: 16px 0;
        }

        /* Ligne horizontale vers l'enfant */
        .tree-li::before {
          content: "";
          position: absolute;
          left: -60px;
          top: 50%;
          width: 60px;
          height: 2px;
          background: #CBD5E1;
          z-index: 1;
        }

        /* Ligne verticale */
        .tree-li::after {
          content: "";
          position: absolute;
          left: -60px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #CBD5E1;
          z-index: 1;
        }

        /* Si c'est le premier enfant, la ligne verticale commence au milieu */
        .tree-li:first-child::after {
          top: 50%;
        }

        /* Si c'est le dernier enfant (le bouton +), la ligne s'arrête au milieu */
        .tree-li:last-child::after {
          bottom: 50%;
        }

        /* S'il n'y a qu'un seul enfant, pas de ligne verticale */
        .tree-li:first-child:last-child::after {
          display: none;
        }

        /* Ligne sortant du parent vers la droite s'il a des enfants affichés */
        .parent-has-children {
          position: relative;
        }
        .parent-has-children::after {
          content: "";
          position: absolute;
          right: -60px;
          top: 50%;
          width: 60px;
          height: 2px;
          background: #CBD5E1;
          z-index: 1;
        }

        .tree-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .tree-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .tree-container::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 10px;
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', animation: 'fadeIn 0.2s ease-out' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-poppins)', color: 'var(--black-deep)' }}>
           Géographique
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--gray-medium)' }}>
            Cliquez sur un élément pour explorer ses zones.
          </p>
        </div>
        
        <div>
          <input 
            type="file" 
            accept=".csv, .txt, application/vnd.ms-excel" 
            ref={fileInputRef} 
            onChange={handleImportCsv} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', background: '#FFFFFF',
              border: '1px solid #E2E8F0', borderRadius: '8px',
              color: '#0F1923', fontWeight: '600', fontSize: '14px',
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Upload size={16} color="#1A6FD4" />
            Importer CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--gray-medium)' }}>
          <Loader2 size={40} className="animate-spin" style={{ marginBottom: '16px', color: '#1A6FD4' }} />
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Chargement du workflow...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#EF4444' }}>
          <AlertCircle size={32} style={{ marginBottom: '16px' }} />
          <span style={{ fontSize: '15px', fontWeight: '500' }}>{error}</span>
        </div>
      ) : (
        <div className="tree-container" id="tree-scroll-container" onScroll={updateLines} style={{ position: 'relative', display: 'flex', flexDirection: 'row', gap: '60px' }}>
          
          {/* SVG Overlay */}
          <svg id="svg-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            {lines.map((line, i) => {
              const distance = Math.abs(line.endX - line.startX);
              const controlPointX1 = line.startX + distance * 0.4;
              const controlPointX2 = line.endX - distance * 0.4;
              return (
                <path 
                  key={i} 
                  d={`M ${line.startX} ${line.startY} C ${controlPointX1} ${line.startY}, ${controlPointX2} ${line.endY}, ${line.endX} ${line.endY}`} 
                  fill="none" 
                  stroke="#CBD5E1" 
                  strokeWidth="2" 
                />
              );
            })}
          </svg>

          {/* Colonne 1 : PAYS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px' }}>
            {[...countries].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map(country => (
              <div key={`country-${country.id}`} id={`node-country-${country.id}`}>
                <NodeCard 
                  item={country} type="country" 
                  isSelected={selectedCountry?.id === country.id} 
                  onClick={() => handleSelectCountry(country)} 
                  onDoubleClick={() => handleOpenModal('country', null, country)} 
                />
              </div>
            ))}
            <div id="add-country-btn">
               <AddNodeBtn label="Ajouter un pays" onClick={() => handleOpenModal('country', null)} />
            </div>
          </div>

          {/* Colonne 2 : REGIONS */}
          {selectedCountry && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px', animation: 'fadeIn 0.3s' }}>
              {regions.filter(r => r.country_id === selectedCountry.id).map(region => (
                <div key={`region-${region.id}`} id={`node-region-${region.id}`}>
                  <NodeCard 
                    item={region} type="region" 
                    isSelected={selectedRegion?.id === region.id} 
                    onClick={() => handleSelectRegion(region)} 
                    onDoubleClick={() => handleOpenModal('region', null, region)} 
                  />
                </div>
              ))}
              <div id={`add-region-${selectedCountry.id}`}>
                <AddNodeBtn label="Ajouter une région" onClick={() => handleOpenModal('region', selectedCountry.id)} />
              </div>
            </div>
          )}

          {/* Colonne 3 : PREFECTURES */}
          {selectedRegion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px', animation: 'fadeIn 0.3s' }}>
              {prefectures.filter(p => p.region_id === selectedRegion.id).map(prefecture => (
                <div key={`pref-${prefecture.id}`} id={`node-prefecture-${prefecture.id}`}>
                  <NodeCard 
                    item={prefecture} type="prefecture" 
                    isSelected={selectedPrefecture?.id === prefecture.id} 
                    onClick={() => handleSelectPrefecture(prefecture)} 
                    onDoubleClick={() => handleOpenModal('prefecture', null, prefecture)} 
                  />
                </div>
              ))}
              <div id={`add-prefecture-${selectedRegion.id}`}>
                <AddNodeBtn label="Ajouter une préfecture" onClick={() => handleOpenModal('prefecture', selectedRegion.id)} />
              </div>
            </div>
          )}

          {/* Colonne 4 : COMMUNES */}
          {selectedPrefecture && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px', animation: 'fadeIn 0.3s' }}>
              {communes.filter(c => c.prefecture_id === selectedPrefecture.id).map(commune => (
                <div key={`com-${commune.id}`} id={`node-commune-${commune.id}`}>
                  <NodeCard 
                    item={commune} type="commune" 
                    isSelected={false} 
                    onClick={() => {}} 
                    onDoubleClick={() => handleOpenModal('commune', null, commune)} 
                  />
                </div>
              ))}
              <div id={`add-commune-${selectedPrefecture.id}`}>
                <AddNodeBtn label="Ajouter une commune" onClick={() => handleOpenModal('commune', selectedPrefecture.id)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Universel */}
      {showModal && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 25, 35, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ 
            background: '#FFFFFF', borderRadius: '24px', width: '90vw', maxWidth: '560px', 
            boxShadow: '0 24px 64px rgba(13,59,122,0.2)', overflow: 'hidden', animation: 'fadeIn 0.25s ease-out',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-poppins)', color: '#0F1923', margin: 0 }}>
                  {isEditing ? 'Modifier' : 'Ajouter'} {
                    modalType === 'country' ? 'un Pays' : 
                    modalType === 'region' ? 'une Région' : 
                    modalType === 'prefecture' ? 'une Préfecture' : 'une Commune'
                  }
                </h3>
                <p style={{ fontSize: '13px', color: '#8A94A6', margin: '4px 0 0' }}>Renseignez les informations requises.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ 
                background: '#F4F6FA', border: 'none', cursor: 'pointer', color: '#8A94A6',
                padding: '8px', borderRadius: '10px', transition: 'all 0.2s' 
              }} onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={e => { e.currentTarget.style.background = '#F4F6FA'; e.currentTarget.style.color = '#8A94A6'; }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>
                    Nom (Français) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editForm.name || ''} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                    onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>
                    Code {modalType === 'country' && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input 
                    type="text" 
                    required={modalType === 'country'} 
                    value={editForm.code || ''} 
                    onChange={e => setEditForm({...editForm, code: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                    onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Spécifique PAYS */}
              {modalType === 'country' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>URL du Drapeau (flag_url)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={editForm.flag_url || ''} 
                      onChange={e => setEditForm({...editForm, flag_url: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                      onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>Indicatif Tél (ex: +228) <span style={{ color: '#EF4444' }}>*</span></label>
                      <input 
                        type="text" 
                        required
                        value={editForm.phone_code || ''} 
                        onChange={e => setEditForm({...editForm, phone_code: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                        onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>Ordre d'affichage</label>
                      <input 
                        type="number" 
                        value={editForm.sort_order || 0} 
                        onChange={e => setEditForm({...editForm, sort_order: parseInt(e.target.value)})}
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                        onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#0F1923', fontWeight: '500', cursor: 'pointer', padding: '12px', background: '#F4F6FA', borderRadius: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={editForm.is_eligible === 1}
                      onChange={e => setEditForm({...editForm, is_eligible: e.target.checked ? 1 : 0})}
                      style={{ width: '20px', height: '20px', accentColor: '#1A6FD4' }}
                    />
                    Pays éligible (Accessible sur les applications)
                  </label>
                </>
              )}

              {/* Spécifique PREFECTURE */}
              {modalType === 'prefecture' && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>Latitude</label>
                    <input 
                      type="number" step="any"
                      value={editForm.latitude || ''} 
                      onChange={e => setEditForm({...editForm, latitude: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                      onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#0F1923' }}>Longitude</label>
                    <input 
                      type="number" step="any"
                      value={editForm.longitude || ''} 
                      onChange={e => setEditForm({...editForm, longitude: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: '#F4F6FA', boxSizing: 'border-box' }} 
                      onFocus={e => { e.target.style.borderColor = '#1A6FD4'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              )}

              {/* Actif / Inactif pour Région, Préfecture, Commune */}
              {modalType !== 'country' && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#0F1923', fontWeight: '500', cursor: 'pointer', padding: '12px', background: '#F4F6FA', borderRadius: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={editForm.is_active === 1}
                      onChange={e => setEditForm({...editForm, is_active: e.target.checked ? 1 : 0})}
                      style={{ width: '20px', height: '20px', accentColor: '#1A6FD4' }}
                    />
                    Entité Active
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                {isEditing ? (
                  <button type="button" onClick={() => setShowConfirmDelete(true)} style={{ 
                    padding: '10px 16px', border: 'none', borderRadius: '12px', background: '#FEF2F2', 
                    color: '#EF4444', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: '0.2s' 
                  }} onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'} onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                    <Trash2 size={16} /> Supprimer
                  </button>
                ) : (
                  <div></div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ 
                    padding: '10px 24px', border: '1.5px solid #1A6FD4', borderRadius: '12px', background: 'transparent', 
                    color: '#1A6FD4', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' 
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,111,212,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Annuler
                  </button>
                  <button type="submit" disabled={actionLoading} style={{ 
                    padding: '10px 24px', border: 'none', borderRadius: '12px', background: '#1A6FD4', 
                    color: '#FFFFFF', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: '0.2s', boxShadow: '0 4px 16px rgba(26,111,212,0.2)' 
                  }} onMouseEnter={e => { e.currentTarget.style.background = '#0D3B7A'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#1A6FD4'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    {actionLoading && <Loader2 size={16} className="animate-spin" />}
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Suppression */}
      {showConfirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={32} color="#EF4444" />
              </div>
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#0F1923', textAlign: 'center' }}>
              Confirmer la suppression
            </h3>
            
            <p style={{ margin: '0 0 32px 0', fontSize: '14px', color: '#64748B', textAlign: 'center', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer cet élément ?<br/><br/>
              <strong style={{ color: '#EF4444' }}>ATTENTION :</strong> Cette action est irréversible et supprimera également tous les éléments enfants associés (cascade).
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={actionLoading}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '12px', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' }}
              >
                Annuler
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                disabled={actionLoading}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: '#EF4444', color: '#FFFFFF', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Custom */}
      {toast && (
        <div style={{ 
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999, 
          background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', 
          border: `1.5px solid ${toast.type === 'error' ? '#F87171' : '#34D399'}`, 
          color: toast.type === 'error' ? '#DC2626' : '#059669', 
          padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' 
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <div style={{width: 20, height: 20, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><span style={{color: 'white', fontSize: '12px'}}>✓</span></div>}
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '12px', padding: '4px' }}><X size={16} /></button>
        </div>
      )}
    </MainLayout>
  );
};
