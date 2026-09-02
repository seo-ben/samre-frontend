import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCheck, Mail, Phone, Shield, CheckCircle2,
  AlertCircle, Loader2, Save, Key, Clock, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminProfilePage = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/v1/admin/profile');
      const data = res.data?.data || {};
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch (err) {
      console.error('Erreur chargement profil admin:', err);
      setError('Impossible de charger les informations de votre profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const res = await apiClient.put('/v1/admin/profile', formData);
      setProfile(res.data?.data || profile);
      setSuccessMsg('Votre profil administrateur a été mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Super Admin';
  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'AD';

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mon Profil Administrateur</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Consultez et modifiez vos informations personnelles et identifiants de contact
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings/password')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition"
          >
            <Key size={15} />
            <span>Changer mon mot de passe</span>
          </button>
        </div>

        {/* ── Alerts ── */}
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

        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-200">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-semibold">Chargement de votre profil...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Card: Summary & Avatar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                {initials}
              </div>

              <h2 className="text-lg font-black text-gray-900">{fullName}</h2>
              <div className="text-xs text-gray-400 mt-0.5">Identifiant #{profile?.id}</div>

              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Shield size={13} />
                  <span>{profile?.role || 'Super Admin'}</span>
                </span>
              </div>

              <div className="w-full border-t border-gray-100 my-5"></div>

              <div className="w-full space-y-3 text-left text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="font-semibold text-gray-400">Statut du compte</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={11} /> Actif
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="font-semibold text-gray-400">Type de compte</span>
                  <span className="font-bold text-gray-800">Admin Staff</span>
                </div>
              </div>

              {/* Permissions list preview */}
              {profile?.permissions?.length > 0 && (
                <div className="w-full mt-5 text-left">
                  <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span>Permissions actives ({profile.permissions.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                    {profile.permissions.map((perm, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium font-mono">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Profile Form */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-base font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                <span>Modifier mes coordonnées</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email professionnel *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+228 90 00 00 00"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{submitting ? 'Enregistrement...' : 'Mettre à jour mon profil'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
};
