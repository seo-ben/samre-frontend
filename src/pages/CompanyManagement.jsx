import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Building2, CheckCircle2, ShieldCheck, AlertCircle, 
  Search, RefreshCw, Phone, Mail, MapPin, Eye, Globe, X,
  ChevronLeft, ChevronRight, Filter, Award, Check, SlidersHorizontal
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [viabilityFilter, setViabilityFilter] = useState('ALL');
  const [intlFilter, setIntlFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, VIABLE, NON_VIABLE, INTL

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/companies/list?per_page=1000');
      const data = res.data.data?.data || res.data.data || res.data || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement entreprises', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const toggleViability = async (companyId, currentStatus) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/v1/admin/companies/${companyId}/toggle-viability`, {
        is_viable: !currentStatus,
        viability_notes: !currentStatus ? 'Entreprise certifiée viable par l\'administration SAMRE.' : 'Viabilité retirée.',
      });
      showToast(!currentStatus ? 'Entreprise certifiée viable !' : 'Certification de viabilité révoquée.');
      
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, is_viable: !currentStatus } : c));
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany(prev => ({ ...prev, is_viable: !currentStatus }));
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour de la viabilité.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleInternational = async (companyId, currentStatus) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/v1/admin/companies/${companyId}/toggle-international`, {
        can_publish_international: !currentStatus,
      });
      showToast(!currentStatus 
        ? 'Autorisation de publication internationale accordée !' 
        : 'Autorisation de publication internationale retirée.'
      );
      
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, can_publish_international: !currentStatus } : c));
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany(prev => ({ ...prev, can_publish_international: !currentStatus }));
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour de l\'autorisation internationale.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Liste unique des secteurs
  const availableSectors = useMemo(() => {
    const set = new Set();
    companies.forEach(c => {
      if (c.sector && c.sector.trim()) set.add(c.sector.trim());
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filtrage combiné (Tabs + Search + Dropdown Filters)
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      // Tab filter
      if (activeTab === 'VIABLE' && !c.is_viable) return false;
      if (activeTab === 'NON_VIABLE' && c.is_viable) return false;
      if (activeTab === 'INTL' && !c.can_publish_international) return false;

      // Dropdown filters
      if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
      if (viabilityFilter === 'VIABLE' && !c.is_viable) return false;
      if (viabilityFilter === 'NON_VIABLE' && c.is_viable) return false;
      if (intlFilter === 'INTL_ALLOWED' && !c.can_publish_international) return false;
      if (intlFilter === 'INTL_RESTRICTED' && c.can_publish_international) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (c.company_name || '').toLowerCase();
        const sector = (c.sector || '').toLowerCase();
        const rccm = (c.rccm_number || '').toLowerCase();
        const nif = (c.nif_number || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const location = (c.prefecture?.translations?.[0]?.name || c.commune?.translations?.[0]?.name || c.custom_prefecture || '').toLowerCase();
        
        return name.includes(q) || sector.includes(q) || rccm.includes(q) || nif.includes(q) || email.includes(q) || location.includes(q);
      }

      return true;
    });
  }, [companies, activeTab, sectorFilter, viabilityFilter, intlFilter, searchQuery]);

  // Pagination calculée
  const totalItems = filteredCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ajuster currentPage si hors limite
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(startIndex, startIndex + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  // Statistiques rapides
  const stats = useMemo(() => {
    const total = companies.length;
    const viable = companies.filter(c => c.is_viable).length;
    const nonViable = total - viable;
    const intlAllowed = companies.filter(c => c.can_publish_international).length;
    const highCompleteness = companies.filter(c => (c.completeness_score || 0) >= 80).length;
    return { total, viable, nonViable, intlAllowed, highCompleteness };
  }, [companies]);

  return (
    <MainLayout>
      <div style={{ padding: '20px', minHeight: '100%', fontFamily: 'var(--font-inter)', color: '#0F172A' }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 18px',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 2000,
            backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span>{toastMessage.text}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              style={{ color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '15px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── En-tête de la page ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px',
              backgroundColor: '#EFF6FF',
              borderRadius: '10px',
              color: '#1A6FD4',
              border: '1px solid #DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Gestion & Viabilité des Entreprises
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569'
                }}>
                  {stats.total} entreprises
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                Contrôle des dossiers d'immatriculation (RCCM/NIF), conformité et autorisation des offres internationales.
              </p>
            </div>
          </div>

          <button 
            onClick={fetchCompanies}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* ── KPI Cards Compactes ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Total */}
          <div 
            onClick={() => setActiveTab('ALL')}
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1.5px solid ${activeTab === 'ALL' ? '#1A6FD4' : '#E2E8F0'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Entreprises</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{stats.total}</div>
          </div>

          {/* Viables */}
          <div 
            onClick={() => setActiveTab('VIABLE')}
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1.5px solid ${activeTab === 'VIABLE' ? '#16A34A' : '#E2E8F0'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#15803D', fontWeight: '600', textTransform: 'uppercase' }}>Certifiées Viables</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A', marginTop: '2px' }}>{stats.viable}</div>
          </div>

          {/* Non certifiées */}
          <div 
            onClick={() => setActiveTab('NON_VIABLE')}
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1.5px solid ${activeTab === 'NON_VIABLE' ? '#D97706' : '#E2E8F0'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#B45309', fontWeight: '600', textTransform: 'uppercase' }}>Non Certifiées</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>{stats.nonViable}</div>
          </div>

          {/* Offres Internationales */}
          <div 
            onClick={() => setActiveTab('INTL')}
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1.5px solid ${activeTab === 'INTL' ? '#9333EA' : '#E2E8F0'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#7E22CE', fontWeight: '600', textTransform: 'uppercase' }}>Offres Internationales</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#9333EA', marginTop: '2px' }}>{stats.intlAllowed}</div>
          </div>
        </div>

        {/* ── Filtres & Barre d'Outils ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid #E2E8F0',
          marginBottom: '14px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Recherche textuelle */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, secteur, RCCM, NIF, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filtres Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* Secteur */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tous les secteurs ({availableSectors.length})</option>
              {availableSectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Viabilité */}
            <select
              value={viabilityFilter}
              onChange={(e) => setViabilityFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Toute viabilité</option>
              <option value="VIABLE">Certifiées (Viables)</option>
              <option value="NON_VIABLE">Non Certifiées</option>
            </select>

            {/* International */}
            <select
              value={intlFilter}
              onChange={(e) => setIntlFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tout statut international</option>
              <option value="INTL_ALLOWED">International Autorisé</option>
              <option value="INTL_RESTRICTED">International Restreint</option>
            </select>

            {/* Reset Filtres */}
            {(searchQuery || sectorFilter !== 'ALL' || viabilityFilter !== 'ALL' || intlFilter !== 'ALL' || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSectorFilter('ALL');
                  setViabilityFilter('ALL');
                  setIntlFilter('ALL');
                  setActiveTab('ALL');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  border: '1px solid #FECDD3',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Tableau Professionnel Compact ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#1A6FD4' }} />
              <p style={{ fontSize: '13.5px' }}>Chargement des données...</p>
            </div>
          ) : paginatedCompanies.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
              Aucune entreprise ne correspond aux critères de recherche.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: '700',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '10px 14px' }}>Entreprise</th>
                    <th style={{ padding: '10px 14px' }}>Secteur</th>
                    <th style={{ padding: '10px 14px' }}>Localisation</th>
                    <th style={{ padding: '10px 14px' }}>Immatriculation (RCCM / NIF)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Complétude</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Offres Internationales</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Viabilité</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((comp) => (
                    <tr 
                      key={comp.id} 
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Entreprise (Logo + Nom + Email) */}
                      <td style={{ padding: '8px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {comp.logo_url ? (
                            <img 
                              src={comp.logo_url} 
                              alt={comp.company_name} 
                              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                            />
                          ) : (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#EFF6FF',
                              color: '#1A6FD4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '13px',
                              border: '1px solid #DBEAFE',
                              flexShrink: 0
                            }}>
                              {comp.company_name?.charAt(0)?.toUpperCase() || 'E'}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: '#0F172A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              <span>{comp.company_name}</span>
                              {comp.has_badge && <ShieldCheck size={14} style={{ color: '#1A6FD4' }} title="Badge Vérifié" />}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {comp.email || 'Email non renseigné'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Secteur */}
                      <td style={{ padding: '8px 14px', color: '#334155', fontWeight: '500' }}>
                        {comp.sector || 'Non spécifié'}
                      </td>

                      {/* Localisation */}
                      <td style={{ padding: '8px 14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {comp.prefecture?.translations?.[0]?.name || comp.commune?.translations?.[0]?.name || comp.custom_prefecture || 'Non localisé'}
                          </span>
                        </div>
                      </td>

                      {/* Immatriculation RCCM / NIF */}
                      <td style={{ padding: '8px 14px' }}>
                        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                          <div><span style={{ color: '#64748B' }}>RCCM:</span> <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0F172A' }}>{comp.rccm_number || '—'}</span></div>
                          <div><span style={{ color: '#64748B' }}>NIF:</span> <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0F172A' }}>{comp.nif_number || '—'}</span></div>
                        </div>
                      </td>

                      {/* Score Complétude */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: (comp.completeness_score || 0) >= 80 ? '#DCFCE7' : ((comp.completeness_score || 0) >= 50 ? '#FEF3C7' : '#FFE4E6'),
                          color: (comp.completeness_score || 0) >= 80 ? '#166534' : ((comp.completeness_score || 0) >= 50 ? '#92400E' : '#9F1239'),
                          border: `1px solid ${(comp.completeness_score || 0) >= 80 ? '#BBF7D0' : ((comp.completeness_score || 0) >= 50 ? '#FDE68A' : '#FECDD3')}`
                        }}>
                          {comp.completeness_score || 0}%
                        </span>
                      </td>

                      {/* Offres Internationales Toggle Button */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleInternational(comp.id, comp.can_publish_international)}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            backgroundColor: comp.can_publish_international ? '#F3E8FF' : '#F1F5F9',
                            color: comp.can_publish_international ? '#7E22CE' : '#64748B',
                            border: `1px solid ${comp.can_publish_international ? '#D8B4FE' : '#CBD5E1'}`
                          }}
                          title={comp.can_publish_international ? "Cliquer pour révoquer l'autorisation internationale" : "Cliquer pour accorder l'autorisation de publication internationale"}
                        >
                          <Globe size={12} />
                          <span>{comp.can_publish_international ? 'Autorisée' : 'Restreinte'}</span>
                        </button>
                      </td>

                      {/* Viabilité Toggle Button */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleViability(comp.id, comp.is_viable)}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            backgroundColor: comp.is_viable ? '#DCFCE7' : '#FEF3C7',
                            color: comp.is_viable ? '#15803D' : '#B45309',
                            border: `1px solid ${comp.is_viable ? '#86EFAC' : '#FDE68A'}`
                          }}
                        >
                          {comp.is_viable ? (
                            <>
                              <CheckCircle2 size={13} style={{ color: '#16A34A' }} />
                              <span>Viable (Certifié)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={13} style={{ color: '#D97706' }} />
                              <span>Non Certifié</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action : Voir Détails */}
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedCompany(comp)}
                          style={{
                            padding: '6px',
                            backgroundColor: '#EFF6FF',
                            color: '#1A6FD4',
                            borderRadius: '6px',
                            border: '1px solid #DBEAFE',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                          title="Voir fiche complète"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Contrôles de Pagination Professionnels ── */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            gap: '12px',
            fontSize: '12.5px',
            color: '#64748B'
          }}>
            {/* Info éléments affichés */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>
                Affichage de <strong style={{ color: '#0F172A' }}>{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> à{' '}
                <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * pageSize, totalItems)}</strong> sur{' '}
                <strong style={{ color: '#0F172A' }}>{totalItems}</strong> entreprises
              </span>

              {/* Sélecteur de taille de page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px' }}>Lignes / page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '3px 6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Boutons de navigation pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: currentPage <= 1 ? '#F1F5F9' : '#ffffff',
                  color: currentPage <= 1 ? '#94A3B8' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                <ChevronLeft size={14} /> Précédent
              </button>

              {/* Numéros de page */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span style={{ padding: '4px 6px', color: '#94A3B8' }}>...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          style={{
                            minWidth: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: currentPage === p ? '700' : '500',
                            backgroundColor: currentPage === p ? '#1A6FD4' : '#ffffff',
                            color: currentPage === p ? '#ffffff' : '#334155',
                            border: `1px solid ${currentPage === p ? '#1A6FD4' : '#CBD5E1'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: currentPage >= totalPages ? '#F1F5F9' : '#ffffff',
                  color: currentPage >= totalPages ? '#94A3B8' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Modal Détails de l'Entreprise ── */}
        {selectedCompany && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '22px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {/* Header Modal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedCompany.logo_url ? (
                    <img 
                      src={selectedCompany.logo_url} 
                      alt={selectedCompany.company_name} 
                      style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                    />
                  ) : (
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      color: '#1A6FD4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '18px',
                      border: '1px solid #DBEAFE'
                    }}>
                      {selectedCompany.company_name?.charAt(0)?.toUpperCase() || 'E'}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      {selectedCompany.company_name}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      {selectedCompany.sector || 'Secteur indéfini'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)} 
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    color: '#64748B',
                    backgroundColor: '#F1F5F9',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenu Modal */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Box Immatriculation RCCM & NIF */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div>
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: '#64748B', display: 'block' }}>
                      Numéro RCCM
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                      {selectedCompany.rccm_number || 'Non renseigné'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: '#64748B', display: 'block' }}>
                      Numéro NIF
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                      {selectedCompany.nif_number || 'Non renseigné'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Description de l'entreprise
                  </span>
                  <p style={{
                    fontSize: '12.5px',
                    color: '#334155',
                    backgroundColor: '#F8FAFC',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {selectedCompany.description || 'Aucune description fournie.'}
                  </p>
                </div>

                {/* Téléphone & Taille */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                      Téléphone contact
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                      {selectedCompany.contact_phone || 'Non renseigné'}
                    </span>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                      Taille (Employés)
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                      {selectedCompany.employee_count_range || 'Non spécifié'}
                    </span>
                  </div>
                </div>

                {/* Section Contrôle : Offres Internationales */}
                <div style={{
                  padding: '12px',
                  backgroundColor: '#FAF5FF',
                  borderRadius: '10px',
                  border: '1px solid #E9D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ fontWeight: '700', color: '#581C87', fontSize: '12.5px', display: 'block' }}>
                      Publication d'offres internationales
                    </span>
                    <span style={{ fontSize: '11px', color: '#7E22CE', marginTop: '1px', display: 'block' }}>
                      Autorise l'entreprise à publier des offres à l'étranger.
                    </span>
                  </div>
                  <button
                    onClick={() => toggleInternational(selectedCompany.id, selectedCompany.can_publish_international)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: selectedCompany.can_publish_international ? '#9333EA' : '#CBD5E1',
                      color: '#ffffff',
                      border: 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Globe size={13} />
                    {selectedCompany.can_publish_international ? 'Autorisée' : 'Désactivée'}
                  </button>
                </div>

                {/* Section Contrôle : Viabilité */}
                <div style={{
                  padding: '12px',
                  backgroundColor: selectedCompany.is_viable ? '#F0FDF4' : '#FFFBEB',
                  borderRadius: '10px',
                  border: `1px solid ${selectedCompany.is_viable ? '#BBF7D0' : '#FDE68A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ fontWeight: '700', color: selectedCompany.is_viable ? '#166534' : '#92400E', fontSize: '12.5px', display: 'block' }}>
                      Statut de Viabilité & Certification
                    </span>
                    <span style={{ fontSize: '11px', color: selectedCompany.is_viable ? '#15803D' : '#B45309', marginTop: '1px', display: 'block' }}>
                      {selectedCompany.is_viable 
                        ? 'Entreprise certifiée et vérifiée par l\'administration.' 
                        : 'Entreprise en cours d\'examen ou non certifiée.'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleViability(selectedCompany.id, selectedCompany.is_viable)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: selectedCompany.is_viable ? '#16A34A' : '#D97706',
                      color: '#ffffff',
                      border: 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {selectedCompany.is_viable ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {selectedCompany.is_viable ? 'Viable' : 'Certifier'}
                  </button>
                </div>
              </div>

              {/* Footer Modal */}
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedCompany(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0F172A',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0F172A'}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
export default CompanyManagement;
