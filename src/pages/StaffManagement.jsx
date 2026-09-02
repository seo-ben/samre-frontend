import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  UserCog, Plus, Search, Shield, ShieldCheck, Mail, Phone,
  Lock, CheckCircle2, XCircle, Trash2, Edit, AlertCircle, Loader2,
  RefreshCw, AlertTriangle, CheckSquare, Square, Layers, ChevronDown, ChevronRight,
  LayoutDashboard, Users, Building2, Briefcase, CalendarDays, FileText,
  BadgeCheck, Vote, Handshake, Wallet, Star, Bell, BarChart3, Settings
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Structure complète des Menus & Sous-menus de l'application Admin SAMRE
export const ADMIN_NAVIGATION_MODULES = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
    pages: [
      { label: 'Vue d\'ensemble générale', path: '/dashboard' }
    ]
  },
  {
    id: 'users',
    label: 'Utilisateurs & Profils',
    icon: Users,
    pages: [
      { label: 'Gestion des Utilisateurs (Candidats, Visiteurs)', path: '/users' }
    ]
  },
  {
    id: 'companies',
    label: 'Entreprises & Viabilité',
    icon: Building2,
    pages: [
      { label: 'Entreprises, Cabinets & Viabilité', path: '/companies' }
    ]
  },
  {
    id: 'offers',
    label: 'Offres d\'emploi',
    icon: Briefcase,
    pages: [
      { label: 'Toutes les offres', path: '/offers' },
      { label: 'Offres en attente', path: '/offers/pending' },
      { label: 'Offres validées', path: '/offers/approved' },
      { label: 'Offres expirées', path: '/offers/expired' },
      { label: 'Offres supprimées', path: '/offers/deleted' }
    ]
  },
  {
    id: 'events',
    label: 'Événements & Salons',
    icon: CalendarDays,
    pages: [
      { label: 'Tous les événements', path: '/events' },
      { label: 'Événements en attente', path: '/events/pending' },
      { label: 'Événements validés', path: '/events/approved' },
      { label: 'Événements expirés', path: '/events/expired' },
      { label: 'Événements supprimés', path: '/events/deleted' },
      { label: 'Catégories d\'événements', path: '/events/categories' }
    ]
  },
  {
    id: 'applications',
    label: 'Candidatures & Embauches',
    icon: FileText,
    pages: [
      { label: 'Toutes les candidatures', path: '/applications' },
      { label: 'Candidatures par statut', path: '/applications/by-status' },
      { label: 'Candidatures par offre', path: '/applications/by-offer' },
      { label: 'Déclarations d\'embauche', path: '/hiring-declarations' }
    ]
  },
  {
    id: 'badges',
    label: 'Badges & Vérifications KYC',
    icon: BadgeCheck,
    pages: [
      { label: 'Demandes en attente de badge', path: '/badges/pending' },
      { label: 'Secrétaires vérifiées', path: '/badges/candidates' },
      { label: 'Entreprises vérifiées', path: '/badges/companies' }
    ]
  },
  {
    id: 'surveys',
    label: 'Sondages & Enquêtes',
    icon: Vote,
    pages: [
      { label: 'Gestion des sondages', path: '/surveys' }
    ]
  },
  {
    id: 'service-exchanges',
    label: 'Partenariats B2B (Troc)',
    icon: Handshake,
    pages: [
      { label: 'Bourse d\'échanges inter-entreprises', path: '/service-exchanges' }
    ]
  },
  {
    id: 'finances',
    label: 'Finances & Wallets',
    icon: Wallet,
    pages: [
      { label: 'Vue d\'ensemble financière', path: '/finances' },
      { label: 'Portefeuilles (Wallets)', path: '/wallets' },
      { label: 'Historique des transactions', path: '/transactions' }
    ]
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    icon: Star,
    pages: [
      { label: 'Centre de contrôle des abonnements', path: '/subscriptions/control-center' },
      { label: 'Plans d\'abonnement', path: '/subscriptions/plans' },
      { label: 'Abonnés actifs', path: '/subscriptions/active' },
      { label: 'Historique des abonnements', path: '/subscriptions/history' }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications & Alertes',
    icon: Bell,
    pages: [
      { label: 'Demandes spéciales', path: '/special-requests' },
      { label: 'Modération & Signalements', path: '/moderation/reports' },
      { label: 'Centre Notifications Push', path: '/notifications' }
    ]
  },
  {
    id: 'cms',
    label: 'CMS — Contenu',
    icon: Layers,
    pages: [
      { label: 'Pages publicitaires', path: '/cms/ads' },
      { label: 'Bannières Dashboard', path: '/cms/company-banners' },
      { label: 'Pages dynamiques (CGU, etc.)', path: '/cms/pages' },
      { label: 'Langues', path: '/cms/languages' },
      { label: 'Traductions App mobile', path: '/cms/translations' },
      { label: 'Zones géographiques', path: '/cms/locations' },
      { label: 'Zones suggérées', path: '/cms/suggested-locations' },
      { label: 'Catégories métiers', path: '/cms/categories' },
      { label: 'Paramètres & Quotas', path: '/cms/quotas' },
      { label: 'Champs floutés', path: '/cms/blur' }
    ]
  },
  {
    id: 'stats',
    label: 'Statistiques & Analytics',
    icon: BarChart3,
    pages: [
      { label: 'Tableau Analytique', path: '/stats' },
      { label: 'Rapports & Exports CSV', path: '/stats/exports' }
    ]
  },
  {
    id: 'audit-logs',
    label: 'Journal d\'audit & Logs',
    icon: ShieldCheck,
    pages: [
      { label: 'Journal d\'audit de sécurité', path: '/audit-logs' }
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    pages: [
      { label: 'Comptes administrateurs & Staff', path: '/settings/staff' }
    ]
  }
];

// Liste de toutes les routes disponibles
const ALL_PAGE_PATHS = ADMIN_NAVIGATION_MODULES.flatMap(m => m.pages.map(p => p.path));

export const StaffManagementPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected routes for permissions
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    staff: null,
    loading: false,
  });

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country_id: 1,
    role_id: '',
    password: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [staffRes, rolesRes] = await Promise.all([
        apiClient.get('/v1/admin/staff'),
        apiClient.get('/v1/admin/roles'),
      ]);

      setStaffList(staffRes.data?.data || []);
      setRoles(rolesRes.data?.data || []);

      if (rolesRes.data?.data?.length > 0 && !formData.role_id) {
        setFormData(prev => ({ ...prev, role_id: rolesRes.data.data[0].id }));
      }
    } catch (err) {
      console.error('Erreur chargement personnel admin:', err);
      setError('Impossible de charger la liste du personnel administrateur.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setSelectedRoutes([...ALL_PAGE_PATHS]); // Par défaut, tout est coché
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      country_id: 1,
      role_id: roles[0]?.id || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    const existingRoutes = Array.isArray(staff.allowed_routes) && staff.allowed_routes.length > 0
      ? staff.allowed_routes
      : (staff.role?.name === 'super_admin' ? [...ALL_PAGE_PATHS] : ['/dashboard']);
    setSelectedRoutes(existingRoutes);

    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.user?.email || '',
      phone: staff.user?.phone || '',
      country_id: staff.user?.country_id || 1,
      role_id: staff.role_id || (staff.role?.id ?? ''),
      password: '',
    });
    setShowModal(true);
  };

  // Toggle all pages
  const handleSelectAllRoutes = () => {
    setSelectedRoutes([...ALL_PAGE_PATHS]);
  };

  const handleDeselectAllRoutes = () => {
    setSelectedRoutes([]);
  };

  // Toggle a single page
  const handleToggleRoute = (path) => {
    setSelectedRoutes(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  // Toggle an entire module
  const handleToggleModule = (mod) => {
    const modulePaths = mod.pages.map(p => p.path);
    const allSelected = modulePaths.every(p => selectedRoutes.includes(p));

    if (allSelected) {
      setSelectedRoutes(prev => prev.filter(p => !modulePaths.includes(p)));
    } else {
      setSelectedRoutes(prev => Array.from(new Set([...prev, ...modulePaths])));
    }
  };

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (selectedRoutes.length === 0) {
        setError('Veuillez cocher au moins une page accessible pour cet administrateur.');
        setSubmitting(false);
        return;
      }

      if (editingStaff) {
        await apiClient.put(`/v1/admin/staff/${editingStaff.id}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: Number(formData.role_id),
          allowed_routes: selectedRoutes,
        });
        showSuccess('Compte et autorisations mis à jour avec succès.');
      } else {
        await apiClient.post('/v1/admin/staff', {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          country_id: Number(formData.country_id),
          role_id: Number(formData.role_id),
          password: formData.password,
          allowed_routes: selectedRoutes,
        });
        showSuccess('Nouveau compte administrateur créé avec succès.');
      }

      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      console.error('Erreur soumission staff:', err);
      const msg = err.response?.data?.message || 'Erreur lors de l\'enregistrement du compte staff.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    const { type, staff } = confirmModal;
    if (!staff) return;

    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));

      if (type === 'delete') {
        await apiClient.delete(`/v1/admin/staff/${staff.id}`);
        showSuccess(`Le compte de ${staff.first_name} ${staff.last_name} a été supprimé.`);
      } else if (type === 'suspend') {
        await apiClient.post(`/v1/admin/staff/${staff.id}/suspend`);
        showSuccess(`Le compte de ${staff.first_name} ${staff.last_name} a été suspendu.`);
      } else if (type === 'reactivate') {
        await apiClient.post(`/v1/admin/staff/${staff.id}/reactivate`);
        showSuccess(`Le compte de ${staff.first_name} ${staff.last_name} a été réactivé.`);
      }

      setConfirmModal({ isOpen: false, type: null, staff: null, loading: false });
      fetchInitialData();
    } catch (err) {
      console.error('Erreur action staff:', err);
      alert(err.response?.data?.message || 'Une erreur est survenue lors de l\'opération.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const email = (s.user?.email || '').toLowerCase();
    const phone = (s.user?.phone || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query);
    const matchesRole = roleFilter === 'all' || String(s.role_id || s.role?.id) === String(roleFilter);
    const matchesStatus = statusFilter === 'all' || s.user?.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Top Header Bar ── */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comptes Administrateurs & Droits d'Accès</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Attribuez des autorisations sur-mesure en cochant les menus et sous-menus accessibles
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <Plus size={16} />
            <span>Créer un administrateur</span>
          </button>
        </div>

        {/* ── Alerts Banner ── */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Filters & Search ── */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, email ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les rôles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>

            <button
              onClick={fetchInitialData}
              disabled={loading}
              title="Rafraîchir"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Staff Table (Without IDs) ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-semibold">Chargement des comptes administrateurs...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-medium">
              <UserCog size={40} className="mx-auto mb-2 text-gray-300" />
              <p>Aucun compte administrateur trouvé avec ces filtres.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Administrateur</th>
                    <th className="px-6 py-3.5">Rôle</th>
                    <th className="px-6 py-3.5">Pages & Menus Autorisés</th>
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Statut</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredStaff.map((staff) => {
                    const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Admin';
                    const isSuspended = staff.user?.status === 'suspended';
                    const roleName = staff.role?.name || 'Administrateur';
                    const hasFullAccess = staff.role?.name === 'super_admin' || !staff.allowed_routes || staff.allowed_routes.includes('*');
                    const countPages = hasFullAccess ? ALL_PAGE_PATHS.length : (staff.allowed_routes?.length || 0);

                    return (
                      <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                              {staff.first_name?.[0]?.toUpperCase()}{staff.last_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{fullName}</div>
                              <div className="text-xs text-gray-500 font-medium">{staff.user?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Shield size={12} />
                            <span>{roleName}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {hasFullAccess ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 size={12} />
                              <span>Accès Intégral ({ALL_PAGE_PATHS.length} pages)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Layers size={12} />
                              <span>{countPages} page{countPages > 1 ? 's' : ''} autorisée{countPages > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <Phone size={13} className="text-gray-400" />
                            <span>{staff.user?.phone || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <XCircle size={12} />
                              <span>Suspendu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} />
                              <span>Actif</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              title="Modifier les autorisations et informations"
                              className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition"
                            >
                              <Edit size={16} />
                            </button>

                            {isSuspended ? (
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'reactivate', staff, loading: false })}
                                title="Réactiver le compte"
                                className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'suspend', staff, loading: false })}
                                title="Suspendre les accès"
                                className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition"
                              >
                                <AlertTriangle size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => setConfirmModal({ isOpen: true, type: 'delete', staff, loading: false })}
                              title="Supprimer définitivement"
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal Création / Modification Staff avec Sélecteur de Menus & Sous-menus ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Shield className="text-blue-600" size={20} />
                  <span>{editingStaff ? 'Modifier les accès administrateur' : 'Créer un administrateur & droits d\'accès'}</span>
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  ✕
                </button>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <form id="staff-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 py-4 space-y-4 text-sm pr-1">
                
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jean"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dupont"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                {!editingStaff && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email professionnel *</label>
                      <input
                        type="email"
                        required
                        placeholder="collaborateur@samre.tg"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Numéro de téléphone *</label>
                        <input
                          type="text"
                          required
                          placeholder="+228 90 00 00 00"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe temporaire *</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rôle Principal</label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium bg-white text-sm"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.description ? `(${r.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── SÉLECTEUR DE MENUS & SOUS-MENUS ACCESSIBLES ── */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Layers size={14} className="text-blue-600" />
                        <span>Pages et Menus Autorisés ({selectedRoutes.length} sur {ALL_PAGE_PATHS.length})</span>
                      </label>
                      <p className="text-[11px] text-gray-500">
                        Cochez les sections auxquelles ce collaborateur aura accès dans sa barre latérale
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllRoutes}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition"
                      >
                        Tout cocher
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllRoutes}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded transition"
                      >
                        Tout décocher
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 border border-gray-200 rounded-xl p-2.5 max-h-72 overflow-y-auto bg-slate-50/50">
                    {ADMIN_NAVIGATION_MODULES.map((mod) => {
                      const modulePaths = mod.pages.map(p => p.path);
                      const isAllChecked = modulePaths.every(p => selectedRoutes.includes(p));
                      const isPartiallyChecked = !isAllChecked && modulePaths.some(p => selectedRoutes.includes(p));
                      const isExpanded = expandedModules[mod.id] ?? true;

                      return (
                        <div key={mod.id} className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs">
                          {/* Module Header */}
                          <div className="flex items-center justify-between p-2.5 bg-gray-50/80 hover:bg-gray-100/80 transition cursor-pointer">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                ref={(el) => {
                                  if (el) el.indeterminate = isPartiallyChecked;
                                }}
                                onChange={() => handleToggleModule(mod)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <mod.icon size={15} className="text-gray-600" />
                              <span className="text-xs font-black text-gray-800">{mod.label}</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => toggleModuleAccordion(mod.id)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </div>

                          {/* Submenus / Pages Checklist */}
                          {isExpanded && (
                            <div className="p-2.5 pl-8 space-y-1.5 border-t border-gray-100 bg-white">
                              {mod.pages.map((page) => {
                                const isChecked = selectedRoutes.includes(page.path);

                                return (
                                  <label
                                    key={page.path}
                                    className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-blue-50/40 transition"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleRoute(page.path)}
                                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className={`text-xs ${isChecked ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                      {page.label}
                                    </span>
                                    <code className="text-[10px] text-gray-400 ml-auto font-mono">{page.path}</code>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </form>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="staff-form"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingStaff ? 'Enregistrer les autorisations' : 'Créer l\'administrateur'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Modal Confirmation ── */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: null, staff: null, loading: false })}
          onConfirm={handleConfirmAction}
          loading={confirmModal.loading}
          title={
            confirmModal.type === 'delete'
              ? 'Supprimer définitivement ce compte ?'
              : confirmModal.type === 'suspend'
              ? 'Suspendre les accès de cet administrateur ?'
              : 'Réactiver ce compte administrateur ?'
          }
          message={
            confirmModal.type === 'delete'
              ? 'Cette action supprimera irrévocablement le compte et toutes ses autorisations.'
              : confirmModal.type === 'suspend'
              ? 'L\'administrateur ne pourra plus accéder à aucune page jusqu\'à sa réactivation.'
              : 'L\'administrateur pourra à nouveau se connecter et retrouver ses pages autorisées.'
          }
          confirmLabel={
            confirmModal.type === 'delete'
              ? 'Supprimer'
              : confirmModal.type === 'suspend'
              ? 'Suspendre'
              : 'Réactiver'
          }
          variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        />

      </div>
    </MainLayout>
  );
};
