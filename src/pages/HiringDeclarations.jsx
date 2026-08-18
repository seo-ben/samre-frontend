import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Briefcase, CheckCircle2, Clock, XCircle, Search,
  Filter, RefreshCw, User, Building2, Phone, Mail,
  Calendar, Eye, Award, Check, ChevronLeft, ChevronRight, X, MapPin
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const HiringDeclarationsPage = () => {
  const [declarations, setDeclarations] = useState([]);
  const [stats, setStats] = useState({
    total_declarations: 0,
    pending_review_count: 0,
    validated_count: 0,
    rejected_count: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');

  // Modal Fiche de détail
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchDeclarations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (originFilter !== 'all') params.hiring_origin = originFilter;

      const res = await apiClient.get('/v1/admin/hiring-declarations', { params });
      if (res.data?.data) {
        setDeclarations(res.data.data.declarations || []);
        if (res.data.data.stats) setStats(res.data.data.stats);
        if (res.data.data.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des déclarations d\'embauche', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, originFilter]);

  useEffect(() => {
    fetchDeclarations(1);
  }, [search, statusFilter, originFilter, fetchDeclarations]);

  const handleUpdateStatus = async (declarationId, newStatus) => {
    setStatusUpdatingId(declarationId);
    try {
      await apiClient.put(`/v1/admin/hiring-declarations/${declarationId}/status`, {
        status: newStatus,
      });
      fetchDeclarations(pagination.current_page);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0'
          }}>
            <CheckCircle2 size={13} /> Validée
          </span>
        );
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3'
          }}>
            <XCircle size={13} /> Rejetée
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a'
          }}>
            <Clock size={13} /> En attente
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .dec-table { width: 100%; border-collapse: collapse; text-align: left; }
        .dec-table th { padding: 12px 16px; font-weight: 600; color: #64748b; font-size: 13px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .dec-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
        .dec-table tr:hover { background: #f8fafc; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', fontFamily: 'var(--font-inter)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--black-deep)', margin: '0 0 4px 0' }}>
              Déclarations d'Embauche
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--gray-medium)', margin: 0 }}>
              Consultez et validez les déclarations d'embauche soumises par les secrétaires
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => fetchDeclarations(pagination.current_page)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                border: '1px solid var(--gray-border)', background: '#fff',
                fontSize: '13px', fontWeight: '500', color: '#334155', cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--gray-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Déclarations</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{stats.total_declarations}</div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', textTransform: 'uppercase' }}>En Attente</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#d97706' }}>{stats.pending_review_count}</div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#047857', textTransform: 'uppercase' }}>Validées</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{stats.validated_count}</div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#be123c', textTransform: 'uppercase' }}>Rejetées</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#e11d48' }}>{stats.rejected_count}</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par secrétaire, entreprise, poste..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 14px 8px 36px',
                border: '1px solid var(--gray-border)', borderRadius: '8px', background: '#fff',
                fontSize: '13px', color: 'var(--black-deep)', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid var(--gray-border)', borderRadius: '8px',
                background: '#fff', fontSize: '13px', fontWeight: '500', color: '#334155', outline: 'none'
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente ⏳</option>
              <option value="validated">Validées ✅</option>
              <option value="rejected">Rejetées ❌</option>
            </select>

            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid var(--gray-border)', borderRadius: '8px',
                background: '#fff', fontSize: '13px', fontWeight: '500', color: '#334155', outline: 'none'
              }}
            >
              <option value="all">Toutes origines</option>
              <option value="SAMRE">Via SAMRE</option>
              <option value="Externe">Autre / Externe</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--gray-border)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Chargement des déclarations...</div>
            ) : declarations.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Aucune déclaration d'embauche trouvée.</div>
            ) : (
              <table className="dec-table">
                <thead>
                  <tr>
                    <th>Secrétaire</th>
                    <th>Entreprise & Poste</th>
                    <th>Contrat & Salaire</th>
                    <th>Origine & Prise de poste</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map((dec) => {
                    const cand = dec.candidate_profile;
                    const u = dec.user || cand?.user;
                    const candidateName = cand
                      ? `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Secrétaire'
                      : u?.phone || 'Secrétaire';

                    return (
                      <tr key={dec.id}>
                        {/* Secrétaire */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: '#f1f5f9', border: '1px solid #cbd5e1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', fontSize: '12px', color: '#475569', flexShrink: 0
                            }}>
                              {candidateName[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.2' }}>{candidateName}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{u?.phone || u?.email || cand?.profession}</div>
                            </div>
                          </div>
                        </td>

                        {/* Entreprise & Poste */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.2' }}>{dec.company_name || 'Non précisé'}</div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                            {dec.position || 'Poste non précisé'} {dec.sector ? `• ${dec.sector}` : ''}
                          </div>
                        </td>

                        {/* Contrat & Salaire */}
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{dec.contract_type || 'Contrat N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '500', marginTop: '2px' }}>
                            {dec.salary_range || 'Salaire N/A'}
                          </div>
                        </td>

                        {/* Origine & Prise de poste */}
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                            fontSize: '11px', fontWeight: '600',
                            backgroundColor: dec.hiring_origin === 'SAMRE' ? '#eff6ff' : '#f1f5f9',
                            color: dec.hiring_origin === 'SAMRE' ? '#1d4ed8' : '#475569'
                          }}>
                            {dec.hiring_origin || 'N/A'}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                            {dec.start_date ? new Date(dec.start_date).toLocaleDateString('fr-FR') : 'Date N/A'}
                          </div>
                        </td>

                        {/* Statut */}
                        <td>
                          {getStatusBadge(dec.status)}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', itemsAlign: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            {/* Validation rapide */}
                            {dec.status !== 'validated' && (
                              <button
                                onClick={() => handleUpdateStatus(dec.id, 'validated')}
                                disabled={statusUpdatingId === dec.id}
                                style={{
                                  padding: '4px 8px', borderRadius: '6px',
                                  border: '1px solid #a7f3d0', background: '#ecfdf5',
                                  color: '#047857', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                                title="Valider l'embauche"
                              >
                                <Check size={14} />
                              </button>
                            )}

                            {/* Voir fiche */}
                            <button
                              onClick={() => {
                                setSelectedDeclaration(dec);
                                setShowDetailModal(true);
                              }}
                              style={{
                                padding: '5px', borderRadius: '6px', border: '1px solid var(--gray-border)',
                                background: '#fff', color: '#64748b', cursor: 'pointer'
                              }}
                              title="Voir la fiche complète"
                            >
                              <Eye size={16} />
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

          {/* Footer Pagination */}
          {pagination.last_page > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Affichage {(pagination.current_page - 1) * pagination.per_page + 1} à {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} déclarations
              </span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => fetchDeclarations(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.current_page === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ padding: '4px 12px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                  onClick={() => fetchDeclarations(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: pagination.current_page === pagination.last_page ? 'not-allowed' : 'pointer', opacity: pagination.current_page === pagination.last_page ? 0.5 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Fiche de détail complète */}
      {showDetailModal && selectedDeclaration && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(15, 25, 35, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '580px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Fiche de Déclaration d'Embauche
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Déclarée le {new Date(selectedDeclaration.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Info Candidat */}
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Secrétaire Déclarée
                </div>
                <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong>Nom & Prénom :</strong> {selectedDeclaration.candidate_profile?.first_name} {selectedDeclaration.candidate_profile?.last_name}</div>
                  <div><strong>Profession :</strong> {selectedDeclaration.candidate_profile?.profession || 'N/A'}</div>
                  <div><strong>Téléphone :</strong> {selectedDeclaration.user?.phone || selectedDeclaration.candidate_profile?.user?.phone || 'N/A'}</div>
                  <div><strong>Email :</strong> {selectedDeclaration.user?.email || selectedDeclaration.candidate_profile?.user?.email || 'N/A'}</div>
                </div>
              </div>

              {/* Info Embauche */}
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Détails du Poste & du Contrat
                </div>
                <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong>Entreprise :</strong> {selectedDeclaration.company_name}</div>
                  <div><strong>Poste occupé :</strong> {selectedDeclaration.position}</div>
                  <div><strong>Secteur :</strong> {selectedDeclaration.sector || 'N/A'}</div>
                  <div><strong>Type de contrat :</strong> {selectedDeclaration.contract_type || 'N/A'}</div>
                  <div><strong>Fourchette salariale :</strong> <span style={{ color: '#059669', fontWeight: '600' }}>{selectedDeclaration.salary_range || 'N/A'}</span></div>
                  <div><strong>Date prise de poste :</strong> {selectedDeclaration.start_date ? new Date(selectedDeclaration.start_date).toLocaleDateString('fr-FR') : 'N/A'}</div>
                  <div><strong>Origine embauche :</strong> <span style={{ color: '#1d4ed8', fontWeight: '600' }}>{selectedDeclaration.hiring_origin || 'N/A'}</span></div>
                  <div><strong>Localisation :</strong> {selectedDeclaration.location || 'N/A'}</div>
                </div>
              </div>

              {/* Explications secrétaire */}
              {selectedDeclaration.notes && (
                <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e' }}>
                  <strong>Explications / Remarques de la secrétaire :</strong>
                  <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{selectedDeclaration.notes}</p>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedDeclaration.status !== 'validated' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedDeclaration.id, 'validated');
                      setShowDetailModal(false);
                    }}
                    style={{ padding: '6px 12px', background: '#059669', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    Valider la déclaration
                  </button>
                )}
                {selectedDeclaration.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedDeclaration.id, 'rejected');
                      setShowDetailModal(false);
                    }}
                    style={{ padding: '6px 12px', background: '#e11d48', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    Rejeter la déclaration
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '6px 14px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default HiringDeclarationsPage;
