import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  Key, Lock, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPasswordPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.new_password.length < 8) {
      setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    if (formData.new_password === formData.current_password) {
      setError('Le nouveau mot de passe doit être différent du mot de passe actuel.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.put('/v1/admin/password', formData);

      setSuccessMsg('Votre mot de passe administrateur a été modifié avec succès.');
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      const msg = err.response?.data?.message || 'Erreur lors de la modification du mot de passe.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Changer mon mot de passe</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Sécurisez votre compte d'accès administrateur SAMRE avec un mot de passe fort
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings/profile')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={14} />
            <span>Retour au profil</span>
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

        {/* ── Form Card ── */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="w-full border-t border-gray-100 my-2"></div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Au moins 8 caractères..."
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Confirmez le nouveau mot de passe *
              </label>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Répétez le nouveau mot de passe..."
                  value={formData.new_password_confirmation}
                  onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Requirements Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-blue-600" />
                <span>Exigences de sécurité :</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11.5px] text-slate-500">
                <li className={formData.new_password.length >= 8 ? 'text-emerald-600 font-bold' : ''}>
                  Au moins 8 caractères de longueur
                </li>
                <li className={formData.new_password && formData.new_password !== formData.current_password ? 'text-emerald-600 font-bold' : ''}>
                  Différent de votre mot de passe actuel
                </li>
                <li className={formData.new_password && formData.new_password === formData.new_password_confirmation ? 'text-emerald-600 font-bold' : ''}>
                  Les deux champs de confirmation doivent correspondre
                </li>
              </ul>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>{submitting ? 'Modification...' : 'Modifier le mot de passe'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </MainLayout>
  );
};
