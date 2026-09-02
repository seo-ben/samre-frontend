import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import {
  Shield, FileText, Printer, Copy, Check,
  Loader2, AlertCircle, Calendar, Globe, Sparkles, RefreshCw
} from 'lucide-react';

export const PublicPageViewer = ({ forcedSlug = null }) => {
  const { slug: paramSlug } = useParams();
  const slug = forcedSlug || paramSlug || 'cgu';

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/v1/pages/${slug}`);
      setPage(res.data?.data || null);
    } catch (err) {
      console.error('Erreur chargement page légale:', err);
      setError('La page demandée est introuvable ou a été dépubliée.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-blue-600 selection:text-white">

      {/* ── Public Top Navigation Header (Aucun lien vers le login admin) ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Officiel SAMRE (Non-cliquable pour isoler totalement le portail admin) */}
          <div className="flex items-center gap-3 select-none">
            <img
              src="/logo-samre.png"
              alt="Logo SAMRE"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-slate-900 tracking-tight">
                  SAMRE
                </span>
                <span className="text-[10px] uppercase font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded tracking-wider">
                  Officiel
                </span>
              </div>
              <span className="block text-[11px] text-slate-400 font-medium -mt-0.5">
                Santé & Recrutement Togo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copier le lien"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Lien copié !' : 'Partager'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Imprimer cette page"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="animate-spin text-blue-600" size={36} />
            <p className="text-sm font-bold text-slate-600">Chargement du document officiel...</p>
          </div>
        ) : error || !page ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-red-200 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Document indisponible</h2>
            <p className="text-sm text-slate-500">{error || 'Cette page n\'existe pas.'}</p>
            <div className="pt-2">
              <button
                onClick={fetchPage}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Actualiser la page</span>
              </button>
            </div>
          </div>
        ) : (
          <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-12 space-y-8">
            
            {/* Header / Title Banner */}
            <div className="border-b border-slate-100 pb-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <Shield size={14} />
                <span>Document Légal & Conventionnel SAMRE</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {page.title}
              </h1>

              {page.excerpt && (
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                  {page.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>
                    Dernière mise à jour : {page.updated_at ? new Date(page.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Récente'}
                  </span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                    Version {page.version || '1.0'}
                  </span>
                </div>

                <span>•</span>

                <div>
                  Applicable à : <strong className="text-slate-700">
                    {page.target_audience === 'candidates' ? 'Candidats & Secrétaires' : page.target_audience === 'companies' ? 'Établissements de santé' : 'Tous les utilisateurs'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Rendered HTML Content */}
            <div
              className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-[15px] leading-relaxed space-y-4
                [&>h2]:text-lg [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:pt-4 [&>h2]:border-t [&>h2]:border-slate-100
                [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-6 [&>h3]:mb-2
                [&>p]:text-slate-600 [&>p]:leading-relaxed
                [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ul]:text-slate-600
                [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>ol]:text-slate-600
                [&>blockquote]:border-l-4 [&>blockquote]:border-blue-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600
                [&>code]:bg-slate-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>code]:text-blue-700
              "
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            {/* Document Footer Notice */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-blue-600" />
                <span>Plateforme certifiée • Conformité APDP Togo & OHADA</span>
              </div>
              <div>
                Réf : <code>SAMRE-DOC-{page.slug?.toUpperCase()}-v{page.version || '1.0'}</code>
              </div>
            </div>

          </article>
        )}
      </main>

      {/* ── Public Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900">SAMRE</span>
            <span>© 2026 Tous droits réservés.</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/p/cgu" className="hover:text-blue-600 transition">CGU</Link>
            <Link to="/p/privacy-policy" className="hover:text-blue-600 transition">Confidentialité</Link>
            <Link to="/p/mentions-legales" className="hover:text-blue-600 transition">Mentions Légales</Link>
            <Link to="/p/about-us" className="hover:text-blue-600 transition">À Propos</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
