import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle2, XCircle, ShieldCheck, AlertCircle, 
  Search, ExternalLink, RefreshCw, FileText, Phone, Mail, MapPin, Eye
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
      setToastMessage({ type: 'success', text: !currentStatus ? 'Entreprise certifiée viable !' : 'Viabilité révoquée.' });
      fetchCompanies();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la viabilité.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rccm_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100">
      {toastMessage && (
        <div className={`p-4 rounded-xl text-white font-medium flex justify-between items-center ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestion & Viabilité des Entreprises</h1>
              <p className="text-slate-400 text-sm">Contrôle des dossiers d'immatriculation (RCCM/NIF), crédibilité et badges entreprise.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchCompanies}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-600/50 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une entreprise, secteur, N° RCCM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total Entreprises</span>
          <span className="text-xl font-bold text-white">{companies.length}</span>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Entreprises Viables</span>
          <span className="text-xl font-bold text-emerald-400">
            {companies.filter(c => c.is_viable).length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <span>Chargement des entreprises...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Aucune entreprise trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-medium border-b border-slate-700/50 uppercase text-xs">
                <tr>
                  <th className="p-4">Entreprise</th>
                  <th className="p-4">Secteur</th>
                  <th className="p-4">Localisation</th>
                  <th className="p-4">Immatriculation (RCCM/NIF)</th>
                  <th className="p-4 text-center">Score Complétude</th>
                  <th className="p-4 text-center">Viabilité / Crédibilité</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-medium text-white flex items-center gap-3">
                      {comp.logo_url ? (
                        <img src={comp.logo_url} alt={comp.company_name} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                          {comp.company_name?.charAt(0) || 'E'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{comp.company_name}</span>
                          {comp.has_badge && <ShieldCheck className="w-4 h-4 text-blue-400" title="Badge Vérifié" />}
                        </div>
                        <span className="text-xs text-slate-400">{comp.email || 'Email non renseigné'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{comp.sector || 'Non spécifié'}</td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.prefecture?.translations?.[0]?.name || comp.commune?.translations?.[0]?.name || comp.custom_prefecture || 'Non localisé'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="text-xs">
                        <div>RCCM : <span className="font-mono text-slate-200">{comp.rccm_number || 'Non renseigné'}</span></div>
                        <div>NIF : <span className="font-mono text-slate-200">{comp.nif_number || 'Non renseigné'}</span></div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (comp.completeness_score || 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        (comp.completeness_score || 0) >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {comp.completeness_score || 0}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleViability(comp.id, comp.is_viable)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto transition ${
                          comp.is_viable
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-600'
                        }`}
                      >
                        {comp.is_viable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Viable (Certifié)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Non Certifié</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedCompany(comp)}
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                        title="Voir détails dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer / Modal Détails */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                  {selectedCompany.company_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCompany.company_name}</h3>
                  <p className="text-xs text-slate-400">{selectedCompany.sector || 'Secteur indéfini'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <div>
                  <span className="text-slate-400 text-xs block">Numéro RCCM</span>
                  <span className="font-mono font-medium text-white">{selectedCompany.rccm_number || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Numéro NIF</span>
                  <span className="font-mono font-medium text-white">{selectedCompany.nif_number || 'Non renseigné'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-xs block">Description de l'entreprise</span>
                <p className="text-slate-200 text-sm mt-1">{selectedCompany.description || 'Aucune description fournie.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-xs block">Téléphone contact</span>
                  <span className="text-slate-200">{selectedCompany.contact_phone || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Taille (Employés)</span>
                  <span className="text-slate-200">{selectedCompany.employee_count_range || 'Non spécifié'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-600 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
