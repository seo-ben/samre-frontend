import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  LayoutTemplate, Search, Plus, ExternalLink, Copy, Check,
  Edit, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
  FileText, Shield, Globe, Users, Clock, ArrowRight, Sparkles
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const DynamicPagesManagementPage = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Editor Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [activeEditorTab, setActiveEditorTab] = useState('edit'); // 'edit' or 'preview'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    version: '1.0',
    target_audience: 'all',
    is_published: true,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    page: null,
    loading: false,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/v1/admin/pages');
      setPages(res.data?.data || []);
    } catch (err) {
      console.error('Erreur chargement pages dynamiques:', err);
      setError('Impossible de charger la liste des pages dynamiques.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingPage(null);
    setActiveEditorTab('edit');
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '<h2>1. Titre de section</h2>\n<p>Rédigez ici le contenu de votre page...</p>',
      version: '1.0',
      target_audience: 'all',
      is_published: true,
    });
    setShowEditor(true);
  };

  const handleOpenEditModal = (page) => {
    setEditingPage(page);
    setActiveEditorTab('edit');
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      excerpt: page.excerpt || '',
      content: page.content || '',
      version: page.version || '1.0',
      target_audience: page.target_audience || 'all',
      is_published: !!page.is_published,
    });
    setShowEditor(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (editingPage) {
        await apiClient.put(`/v1/admin/pages/${editingPage.id}`, formData);
        showSuccess(`La page "${formData.title}" a été mise à jour avec succès.`);
      } else {
        await apiClient.post('/v1/admin/pages', formData);
        showSuccess(`La page "${formData.title}" a été créée et publiée.`);
      }

      setShowEditor(false);
      fetchPages();
    } catch (err) {
      console.error('Erreur enregistrement page:', err);
      const msg = err.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement de la page.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const { page } = deleteModal;
    if (!page) return;

    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await apiClient.delete(`/v1/admin/pages/${page.id}`);
      showSuccess(`La page "${page.title}" a été supprimée.`);
      setDeleteModal({ isOpen: false, page: null, loading: false });
      fetchPages();
    } catch (err) {
      console.error('Erreur suppression page:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const copyPublicUrl = (slug) => {
    const origin = window.location.origin;
    const url = `${origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Helper toolbar for quick HTML formatting in textarea
  const insertTag = (openTag, closeTag = '') => {
    const textarea = document.getElementById('page-content-area');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${openTag}${selected || 'Texte ici'}${closeTag}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + replacement.length - closeTag.length);
    }, 10);
  };

  // Filtered pages
  const filteredPages = pages.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
    const matchesAudience = audienceFilter === 'all' || p.target_audience === audienceFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'published' ? p.is_published : !p.is_published);

    return matchesSearch && matchesAudience && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Top Header ── */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <LayoutTemplate className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pages Dynamiques & Textes Légaux</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Éditez les CGU, Politiques de confidentialité, Mentions légales et pages institutionnelles diffusées sur le web et mobile
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <Plus size={16} />
            <span>Créer une nouvelle page</span>
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

        {/* ── Quick Public Links Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { slug: 'cgu', title: 'CGU Utilisateurs', desc: 'Conditions générales obligatoires', icon: Shield, color: 'text-blue-600 bg-blue-50' },
            { slug: 'privacy-policy', title: 'Protection des Données', desc: 'Politique de confidentialité & APDP', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
            { slug: 'mentions-legales', title: 'Mentions Légales', desc: 'Éditeur et hébergement officiel', icon: Globe, color: 'text-purple-600 bg-purple-50' },
            { slug: 'about-us', title: 'À Propos de SAMRE', desc: 'Présentation et mission médicale', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <a
                    href={`/p/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 bg-blue-50/70 hover:bg-blue-100 px-2 py-1 rounded-md transition"
                  >
                    <span>Ouvrir</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <code>/p/{item.slug}</code>
                <button
                  onClick={() => copyPublicUrl(item.slug)}
                  title="Copier le lien public"
                  className="hover:text-blue-600 transition"
                >
                  {copiedSlug === item.slug ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters & Search ── */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher une page par titre ou slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les publics</option>
              <option value="candidates">Candidats uniquement</option>
              <option value="companies">Entreprises uniquement</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="published">Publiée</option>
              <option value="draft">Brouillon</option>
            </select>
          </div>
        </div>

        {/* ── Pages Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-semibold">Chargement des pages dynamiques...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-medium">
              <FileText size={40} className="mx-auto mb-2 text-gray-300" />
              <p>Aucune page trouvée avec ces critères.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Titre & Slug</th>
                    <th className="px-6 py-3.5">Version</th>
                    <th className="px-6 py-3.5">Cible</th>
                    <th className="px-6 py-3.5">Statut</th>
                    <th className="px-6 py-3.5">Dernière Mise à Jour</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredPages.map((page) => {
                    const isProtected = ['cgu', 'privacy-policy'].includes(page.slug);

                    return (
                      <tr key={page.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{page.title}</span>
                              {isProtected && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Système
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                /p/{page.slug}
                              </code>
                              <button
                                onClick={() => copyPublicUrl(page.slug)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copier le lien public"
                              >
                                {copiedSlug === page.slug ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                            {page.excerpt && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-md">
                                {page.excerpt}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            v{page.version || '1.0'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-600 font-medium">
                            {page.target_audience === 'candidates'
                              ? 'Candidats'
                              : page.target_audience === 'companies'
                              ? 'Entreprises'
                              : 'Tous les utilisateurs'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {page.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} />
                              <span>Publiée</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                              <EyeOff size={12} />
                              <span>Brouillon</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-500">
                          {page.updated_at ? new Date(page.updated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/p/${page.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Voir la page web publique"
                              className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition"
                            >
                              <ExternalLink size={16} />
                            </a>

                            <button
                              onClick={() => handleOpenEditModal(page)}
                              title="Modifier le contenu"
                              className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition"
                            >
                              <Edit size={16} />
                            </button>

                            {!isProtected && (
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, page, loading: false })}
                                title="Supprimer la page"
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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

        {/* ── Modal / Tiroir d'Édition Plein Écran ── */}
        {showEditor && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      {editingPage ? `Éditer : ${editingPage.title}` : 'Créer une page dynamique'}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Le contenu sera immédiatement reflété sur le web et les applications mobiles
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('edit')}
                      className={`px-3 py-1.5 rounded-md transition ${activeEditorTab === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      Éditeur
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`px-3 py-1.5 rounded-md transition ${activeEditorTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      Aperçu Rendu
                    </button>
                  </div>

                  <button
                    onClick={() => setShowEditor(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {activeEditorTab === 'edit' ? (
                  <form id="dynamic-page-form" onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Titre de la page *</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="ex: Conditions Générales d'Utilisation"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Slug URL *</label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="cgu"
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono text-xs font-bold text-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Version</label>
                        <input
                          type="text"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          placeholder="1.2"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Public cible</label>
                        <select
                          value={formData.target_audience}
                          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-xs bg-white"
                        >
                          <option value="all">Tous (Candidats & Entreprises)</option>
                          <option value="candidates">Candidats uniquement</option>
                          <option value="companies">Entreprises uniquement</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-gray-700">Publier immédiatement</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Court extrait descriptif (Résumé)</label>
                      <input
                        type="text"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Brève description de cette page (affichée dans les métadonnées et aperçus)..."
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-xs"
                      />
                    </div>

                    {/* Quick HTML Insertion Toolbar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700">Contenu de la page (HTML / Markdown pris en charge) *</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => insertTag('<h2>', '</h2>')}
                            className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            H2 Titre
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTag('<h3>', '</h3>')}
                            className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            H3 Sous-titre
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTag('<strong>', '</strong>')}
                            className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            Gras
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')}
                            className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            Liste
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTag('<p>', '</p>')}
                            className="px-2 py-0.5 text-[11px] font-bold bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            Paragraphe
                          </button>
                        </div>
                      </div>

                      <textarea
                        id="page-content-area"
                        required
                        rows={14}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono text-xs leading-relaxed"
                        placeholder="Écrivez le contenu ici..."
                      />
                    </div>
                  </form>
                ) : (
                  /* Live Preview Tab */
                  <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 min-h-[400px]">
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                      <div className="border-b border-gray-100 pb-4">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Aperçu Web</span>
                        <h1 className="text-2xl font-black text-gray-900 mt-1">{formData.title || 'Titre de la page'}</h1>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>Version {formData.version || '1.0'}</span>
                          <span>•</span>
                          <span>Dernière mise à jour : Aujourd'hui</span>
                        </div>
                      </div>

                      <div
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  form="dynamic-page-form"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20 text-sm"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingPage ? 'Enregistrer les modifications' : 'Créer et publier la page'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Modal Suppression ── */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, page: null, loading: false })}
          onConfirm={handleDeleteConfirm}
          loading={deleteModal.loading}
          title="Supprimer cette page dynamique ?"
          message={`Êtes-vous certain de vouloir supprimer la page "${deleteModal.page?.title}" ? Cette action est irréversible et le lien public sera désactivé.`}
          confirmLabel="Supprimer définitivement"
          variant="danger"
        />

      </div>
    </MainLayout>
  );
};
