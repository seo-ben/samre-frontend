import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Building2, CheckCircle2, XCircle, ShieldCheck, AlertCircle, 
  Search, ExternalLink, RefreshCw, FileText, Phone, Mail, MapPin, Eye, Globe, X
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/companies/list?per_page=100');
      const data = res.data.data?.data || res.data.data || res.data || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement entreprises', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleViability = async (companyId, currentStatus) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/v1/admin/companies/${companyId}/toggle-viability`, {
        is_viable: !currentStatus,
        viability_notes: !currentStatus ? 'Entreprise certifiée viable par l\'administration SAMRE.' : 'Viabilité retirée.',
      });
      setToastMessage({ 
        type: 'success', 
        text: !currentStatus ? 'Entreprise certifiée viable avec succès !' : 'Viabilité révoquée.' 
      });
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany(prev => ({ ...prev, is_viable: !currentStatus }));
      }
      fetchCompanies();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la viabilité.' });
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
      setToastMessage({ 
        type: 'success', 
        text: !currentStatus 
          ? 'Autorisation de publication internationale accordée !' 
          : 'Autorisation de publication internationale retirée.' 
      });
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany(prev => ({ ...prev, can_publish_international: !currentStatus }));
      }
      fetchCompanies();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Erreur lors de la mise à jour de l\'autorisation internationale.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rccm_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nif_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div style={{ padding: '24px', minHeight: '100%', fontFamily: 'var(--font-inter)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '14px 20px',
          borderRadius: '12px',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 2000,
          backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
          transition: 'all 0.3s ease'
        }}>
          <span>{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            style={{ color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#EFF6FF',
            borderRadius: '14px',
            color: '#1A6FD4',
            border: '1px solid #DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Gestion & Viabilité des Entreprises
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              Contrôle des dossiers d'immatriculation (RCCM/NIF), viabilité et autorisation des offres internationales.
            </p>
          </div>
        </div>

        <button 
          onClick={fetchCompanies}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#F1F5F9',
            color: '#334155',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div style={{ marginBottom: '20px', maxWidth: '480px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94A3B8' }} />
        <input
          type="text"
          placeholder="Rechercher une entreprise, secteur, N° RCCM..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px 10px 42px',
            backgroundColor: '#ffffff',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#0F172A',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Tableau des Entreprises */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#1A6FD4' }} />
            <p style={{ fontSize: '14px' }}>Chargement des entreprises...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            Aucune entreprise trouvée.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '16px' }}>Entreprise</th>
                  <th style={{ padding: '16px' }}>Secteur</th>
                  <th style={{ padding: '16px' }}>Localisation</th>
                  <th style={{ padding: '16px' }}>Immatriculation (RCCM/NIF)</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Complétude</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Offres Internationales</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Viabilité</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((comp) => (
                  <tr 
                    key={comp.id} 
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Entreprise (Logo + Nom + Email) */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {comp.logo_url ? (
                          <img 
                            src={comp.logo_url} 
                            alt={comp.company_name} 
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
                            fontSize: '16px',
                            border: '1px solid #DBEAFE'
                          }}>
                            {comp.company_name?.charAt(0)?.toUpperCase() || 'E'}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>
                            <span>{comp.company_name}</span>
                            {comp.has_badge && <ShieldCheck size={16} style={{ color: '#1A6FD4' }} title="Badge Vérifié" />}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{comp.email || 'Email non renseigné'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Secteur */}
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {comp.sector || 'Non spécifié'}
                    </td>

                    {/* Localisation */}
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} style={{ color: '#94A3B8' }} />
                        <span>{comp.prefecture?.translations?.[0]?.name || comp.commune?.translations?.[0]?.name || comp.custom_prefecture || 'Non localisé'}</span>
                      </div>
                    </td>

                    {/* Immatriculation RCCM / NIF */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        <div style={{ color: '#64748B' }}>RCCM : <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0F172A' }}>{comp.rccm_number || 'Non renseigné'}</span></div>
                        <div style={{ color: '#64748B' }}>NIF : <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0F172A' }}>{comp.nif_number || 'Non renseigné'}</span></div>
                      </div>
                    </td>

                    {/* Score Complétude */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: (comp.completeness_score || 0) >= 80 ? '#DCFCE7' : ((comp.completeness_score || 0) >= 50 ? '#FEF3C7' : '#FFE4E6'),
                        color: (comp.completeness_score || 0) >= 80 ? '#166534' : ((comp.completeness_score || 0) >= 50 ? '#92400E' : '#9F1239'),
                        border: `1px solid ${(comp.completeness_score || 0) >= 80 ? '#BBF7D0' : ((comp.completeness_score || 0) >= 50 ? '#FDE68A' : '#FECDD3')}`
                      }}>
                        {comp.completeness_score || 0}%
                      </span>
                    </td>

                    {/* Offres Internationales Toggle Button */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleInternational(comp.id, comp.can_publish_international)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          backgroundColor: comp.can_publish_international ? '#F3E8FF' : '#F1F5F9',
                          color: comp.can_publish_international ? '#7E22CE' : '#64748B',
                          border: `1px solid ${comp.can_publish_international ? '#D8B4FE' : '#CBD5E1'}`
                        }}
                        title={comp.can_publish_international ? "Cliquer pour révoquer l'autorisation internationale" : "Cliquer pour accorder l'autorisation de publication internationale"}
                      >
                        <Globe size={13} />
                        <span>{comp.can_publish_international ? 'Autorisée' : 'Restreinte'}</span>
                      </button>
                    </td>

                    {/* Viabilité Toggle Button */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleViability(comp.id, comp.is_viable)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          backgroundColor: comp.is_viable ? '#DCFCE7' : '#FEF3C7',
                          color: comp.is_viable ? '#15803D' : '#B45309',
                          border: `1px solid ${comp.is_viable ? '#86EFAC' : '#FDE68A'}`
                        }}
                      >
                        {comp.is_viable ? (
                          <>
                            <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                            <span>Viable (Certifié)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} style={{ color: '#D97706' }} />
                            <span>Non Certifié</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action : Voir Détails */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCompany(comp)}
                        style={{
                          padding: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#1A6FD4',
                          borderRadius: '8px',
                          border: '1px solid #DBEAFE',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        title="Voir détails dossier"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Détails de l'Entreprise (Arrière-plan opaque & Card Blanche nette) ── */}
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
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            padding: '24px',
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
              paddingBottom: '16px',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {selectedCompany.logo_url ? (
                  <img 
                    src={selectedCompany.logo_url} 
                    alt={selectedCompany.company_name} 
                    style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                  />
                ) : (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#EFF6FF',
                    color: '#1A6FD4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '20px',
                    border: '1px solid #DBEAFE'
                  }}>
                    {selectedCompany.company_name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {selectedCompany.company_name}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    {selectedCompany.sector || 'Secteur indéfini'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCompany(null)} 
                style={{
                  padding: '8px',
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
                <X size={18} />
              </button>
            </div>

            {/* Contenu Modal */}
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Box Immatriculation RCCM & NIF */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: '#F8FAFC',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#64748B', display: 'block', letterSpacing: '0.04em' }}>
                    Numéro RCCM
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {selectedCompany.rccm_number || 'Non renseigné'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#64748B', display: 'block', letterSpacing: '0.04em' }}>
                    Numéro NIF
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {selectedCompany.nif_number || 'Non renseigné'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Description de l'entreprise
                </span>
                <p style={{
                  fontSize: '13.5px',
                  color: '#334155',
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {selectedCompany.description || 'Aucune description fournie.'}
                </p>
              </div>

              {/* Téléphone & Taille */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                    Téléphone contact
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {selectedCompany.contact_phone || 'Non renseigné'}
                  </span>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                    Taille (Employés)
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A', marginTop: '2px', display: 'block' }}>
                    {selectedCompany.employee_count_range || 'Non spécifié'}
                  </span>
                </div>
              </div>

              {/* Section Contrôle : Offres Internationales */}
              <div style={{
                padding: '14px',
                backgroundColor: '#FAF5FF',
                borderRadius: '12px',
                border: '1px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontWeight: '700', color: '#581C87', fontSize: '13.5px', display: 'block' }}>
                    Publication d'offres internationales
                  </span>
                  <span style={{ fontSize: '12px', color: '#7E22CE', marginTop: '2px', display: 'block' }}>
                    Autorise l'entreprise à publier des offres de stage / emploi à l'étranger.
                  </span>
                </div>
                <button
                  onClick={() => toggleInternational(selectedCompany.id, selectedCompany.can_publish_international)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: selectedCompany.can_publish_international ? '#9333EA' : '#CBD5E1',
                    color: '#ffffff',
                    border: 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Globe size={14} />
                  {selectedCompany.can_publish_international ? 'Autorisée' : 'Désactivée'}
                </button>
              </div>

              {/* Section Contrôle : Viabilité */}
              <div style={{
                padding: '14px',
                backgroundColor: selectedCompany.is_viable ? '#F0FDF4' : '#FFFBEB',
                borderRadius: '12px',
                border: `1px solid ${selectedCompany.is_viable ? '#BBF7D0' : '#FDE68A'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontWeight: '700', color: selectedCompany.is_viable ? '#166534' : '#92400E', fontSize: '13.5px', display: 'block' }}>
                    Statut de Viabilité & Certification
                  </span>
                  <span style={{ fontSize: '12px', color: selectedCompany.is_viable ? '#15803D' : '#B45309', marginTop: '2px', display: 'block' }}>
                    {selectedCompany.is_viable 
                      ? 'Entreprise certifiée et vérifiée par l\'administration.' 
                      : 'Entreprise en cours d\'examen ou non certifiée.'}
                  </span>
                </div>
                <button
                  onClick={() => toggleViability(selectedCompany.id, selectedCompany.is_viable)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: selectedCompany.is_viable ? '#16A34A' : '#D97706',
                    color: '#ffffff',
                    border: 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {selectedCompany.is_viable ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {selectedCompany.is_viable ? 'Viable' : 'Certifier'}
                </button>
              </div>
            </div>

            {/* Footer Modal */}
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0F172A',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '13.5px',
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
