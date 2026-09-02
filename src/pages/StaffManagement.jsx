import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  UserCog, Plus, Search, Shield, ShieldCheck, Mail, Phone,
  Lock, CheckCircle2, XCircle, Trash2, Edit, AlertCircle, Loader2,
  MoreHorizontal, Eye, UserPlus, RefreshCw, AlertTriangle
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const StaffManagementPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete & Suspend confirmation states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'delete', 'suspend', 'reactivate'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (editingStaff) {
        await apiClient.put(`/v1/admin/staff/${editingStaff.id}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: Number(formData.role_id),
        });
        showSuccess('Compte administrateur mis à jour avec succès.');
      } else {
        await apiClient.post('/v1/admin/staff', {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          country_id: Number(formData.country_id),
          role_id: Number(formData.role_id),
          password: formData.password,
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
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comptes Administrateurs & Staff</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Gérez les accès, rôles et permissions de votre équipe d'administration SAMRE
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <UserPlus size={16} />
            <span>Ajouter un administrateur</span>
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
                placeholder="Rechercher par nom, email ou téléphone..."
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

        {/* ── Staff Table ── */}
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
                    <th className="px-6 py-3.5">Rôle & Permissions</th>
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Statut</th>
                    <th className="px-6 py-3.5">Création</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredStaff.map((staff) => {
                    const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Admin';
                    const isSuspended = staff.user?.status === 'suspended';
                    const roleName = staff.role?.name || 'Administrateur';

                    return (
                      <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                              {staff.first_name?.[0]?.toUpperCase()}{staff.last_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{fullName}</div>
                              <div className="text-xs text-gray-400">ID #{staff.id} • User #{staff.user_id}</div>
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
                          <div className="flex flex-col gap-1 text-xs text-gray-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-gray-400" />
                              <span>{staff.user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400" />
                              <span>{staff.user?.phone || 'N/A'}</span>
                            </div>
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

                        <td className="px-6 py-4 text-xs text-gray-500">
                          {staff.created_at ? new Date(staff.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              title="Modifier les informations"
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

        {/* ── Modal Création / Modification Staff ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Shield className="text-blue-600" size={20} />
                  <span>{editingStaff ? 'Modifier le compte staff' : 'Ajouter un nouvel administrateur'}</span>
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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
                        placeholder="admin@samre.tg"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone *</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rôle Administrateur *</label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.description ? `— ${r.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingStaff ? 'Enregistrer les modifications' : 'Créer l\'administrateur'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal de Confirmation Générique ── */}
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
              ? 'Cette action supprimera irrévocablement le compte et toutes ses sessions actives.'
              : confirmModal.type === 'suspend'
              ? 'L\'administrateur ne pourra plus se connecter au tableau de bord jusqu\'à réactivation.'
              : 'L\'administrateur pourra à nouveau se connecter avec ses identifiants habituels.'
          }
          confirmLabel={
            confirmModal.type === 'delete'
              ? 'Supprimer le compte'
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
