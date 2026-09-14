import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone, ShieldCheck, KeyRound, UserCheck, Briefcase, Calendar,
  CheckCircle2, XCircle, Clock, MapPin, Award, QrCode, FileText,
  Search, ChevronRight, ChevronDown, Printer, Copy, Check, Download,
  Sparkles, ExternalLink, HelpCircle, ArrowRight, Building2, Users,
  Ticket, RefreshCw, Zap, Compass, CheckSquare, Shield, AlertTriangle
} from 'lucide-react';

export const UserGuidePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAudience, setActiveAudience] = useState('all'); // 'all', 'candidate', 'company', 'visitor'
  const [expandedFaq, setExpandedFaq] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState('otp-registration');

  // FAQ Accordion Toggle
  const toggleFaq = (index) => {
    setExpandedFaq(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // FAQ data
  const faqs = [
    {
      q: "Que faire si je ne reçois pas le code SMS (OTP) lors de l'inscription ?",
      a: "Vérifiez que vous avez sélectionné le bon indicatif pays (ex: +229 pour le Bénin, +33 pour la France). Si le SMS tarde à arriver, patientez jusqu'à la fin du compte à rebours de sécurité (60 secondes) puis cliquez sur « Renvoyer le code ». Assurez-vous que votre smartphone capte convenablement le réseau cellulaire et n'est pas en mode avion.",
      badge: "Inscription & OTP",
      audience: "all"
    },
    {
      q: "Puis-je modifier mon numéro de téléphone après mon inscription ?",
      a: "Non. Pour des impératifs stricts de sécurité juridique et pour garantir l'inviolabilité des conventions de stage et certificats officiels émis, le numéro validé par SMS reste lié de façon définitive à votre compte. En cas de changement impératif (perte ou vol de SIM), une demande doit être adressée directement au support SAMRE.",
      badge: "Sécurité",
      audience: "all"
    },
    {
      q: "Que faire si le pointage automatique ne s'est pas déclenché ce matin ?",
      a: "Pas de panique ! Ouvrez l'application et appuyez directement sur le bouton « Pointer mon arrivée (GPS) » dans l'onglet Aujourd'hui. Pensez également à vérifier dans les paramètres de votre téléphone que l'autorisation de géolocalisation pour SAMRE est bien réglée sur « Toujours autoriser ».",
      badge: "Pointage de Stage",
      audience: "candidate"
    },
    {
      q: "J'ai oublié de consigner mes missions hier, est-il possible de rattraper ?",
      a: "Oui absolument. Rendez-vous dans l'onglet « Calendrier », touchez la case de la journée d'hier et appuyez sur « Consigner / Modifier mes activités ». Votre tuteur aura accès à votre historique actualisé.",
      badge: "Carnet de bord",
      audience: "candidate"
    },
    {
      q: "Comment un futur recruteur vérifie-t-il l'authenticité de mon Certificat SAMRE ?",
      a: "Chaque certificat généré comporte un QR Code cryptographique unique. Le recruteur scanne ce QR Code avec son appareil photo : il est instantanément redirigé vers une page officielle SAMRE qui certifie l'identité de l'entreprise d'accueil, les dates du stage, les missions validées et le taux d'assiduité réel.",
      badge: "Certification QR",
      audience: "candidate"
    },
    {
      q: "Comment configurer les horaires de bureau en tant qu'entreprise ?",
      a: "Dans votre espace Entreprise, accédez aux paramètres de votre profil pour renseigner : l'heure d'embauche le matin (ex: 08:00), l'heure de fin (ex: 17:00), la tolérance de retard (ex: 15 min), les jours ouvrés (du lundi au vendredi) et le périmètre GPS de vos locaux (rayon de 30 à 50 mètres).",
      badge: "Entreprise & Tuteur",
      audience: "company"
    },
    {
      q: "Que se passe-t-il si un stagiaire arrive après l'heure limite ?",
      a: "Le système valide son arrivée tout en enregistrant le nombre exact de minutes de retard. Cela est consigné dans le journal d'audit et se répercute avec transparence dans le calcul mensuel du taux de ponctualité.",
      badge: "Assiduité",
      audience: "company"
    },
    {
      q: "Puis-je rompre le suivi en cas de force majeure ?",
      a: "Oui. Dans l'onglet Convention & Dossier, l'option « Se détacher de cette entreprise » permet de clôturer le suivi après confirmation explicite.",
      badge: "Convention",
      audience: "candidate"
    }
  ];

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(item => {
      const matchAudience = activeAudience === 'all' || item.audience === 'all' || item.audience === activeAudience;
      const matchQuery = !searchQuery || 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAudience && matchQuery;
    });
  }, [faqs, activeAudience, searchQuery]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

      {/* ── Top Bar / Header Public ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo SAMRE + Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo-samre.png"
              alt="Logo Officiel SAMRE"
              style={{
                height: '46px',
                width: 'auto',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback icon if image fails
                e.target.style.display = 'none';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontWeight: 900,
                  fontSize: '20px',
                  color: '#0d3b7a',
                  letterSpacing: '-0.02em'
                }}>
                  SAMRE
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'linear-gradient(135deg, #1a6fd4, #0d3b7a)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '20px'
                }}>
                  Guide Utilisateur
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                Documentation Officielle d'Utilisation
              </span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search Input in Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              padding: '6px 14px',
              width: '280px',
              border: '1px solid #e2e8f0'
            }} className="hidden md:flex">
              <Search size={16} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (OTP, stage, pointage...)"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  width: '100%',
                  color: '#1e293b'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px' }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleCopyLink}
              title="Copier le lien"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              {copiedLink ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Imprimer / Exporter en PDF"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#0d3b7a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 59, 122, 0.25)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a6fd4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d3b7a'}
            >
              <Printer size={14} />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner with SAMRE Brand Signature ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a2540 0%, #0d3b7a 40%, #1a6fd4 85%, #f5a623 100%)',
        color: '#ffffff',
        padding: '52px 20px 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative ambient circles */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 166, 35, 0.22) 0%, rgba(245, 166, 35, 0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '10%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26, 111, 212, 0.3) 0%, rgba(26, 111, 212, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px 14px',
              borderRadius: '30px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '18px',
              backdropFilter: 'blur(8px)'
            }}>
              <Sparkles size={14} color="#f5a623" />
              Plateforme Mobile & Web SAMRE
            </div>

            <h1 style={{
              fontSize: '38px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0'
            }}>
              Guide d'Utilisation Officiel de l'Application
            </h1>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#e2e8f0',
              margin: '0 0 28px 0',
              fontWeight: 400
            }}>
              Accédez à toutes les explications pratiques pour maîtriser l'application SAMRE : inscription sécurisée par numéro et code OTP, choix du profil, pointage d'assiduité automatique et manuel par GPS, calendrier de stage au millimètre près et délivrance du certificat officiel infalsifiable.
            </p>

            {/* Quick Badge Highlights */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '8px 14px',
                borderRadius: '8px',
                backdropFilter: 'blur(6px)'
              }}>
                <KeyRound size={16} color="#f5a623" />
                <span>Validation OTP SMS Sécurisée</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '8px 14px',
                borderRadius: '8px',
                backdropFilter: 'blur(6px)'
              }}>
                <MapPin size={16} color="#34d399" />
                <span>Pointage Automatique & GPS</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '8px 14px',
                borderRadius: '8px',
                backdropFilter: 'blur(6px)'
              }}>
                <Calendar size={16} color="#60a5fa" />
                <span>Calendrier au Millimètre Près</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '8px 14px',
                borderRadius: '8px',
                backdropFilter: 'blur(6px)'
              }}>
                <QrCode size={16} color="#fbbf24" />
                <span>Certificat Officiel Infalsifiable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience Selector Filter Bar ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 20px',
        position: 'sticky',
        top: '72px',
        zIndex: 40,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
              Filtrer par profil :
            </span>

            {[
              { id: 'all', label: 'Tous les guides', icon: Compass },
              { id: 'candidate', label: 'Candidats & Stagiaires', icon: UserCheck, color: '#1a6fd4' },
              { id: 'company', label: 'Entreprises & Tuteurs', icon: Building2, color: '#059669' },
              { id: 'visitor', label: 'Visiteurs & Partenaires', icon: Users, color: '#7c3aed' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeAudience === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAudience(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: isActive ? '1px solid #0d3b7a' : '1px solid #e2e8f0',
                    backgroundColor: isActive ? '#0d3b7a' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={14} color={isActive ? '#ffffff' : (tab.color || '#64748b')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Mis à jour pour la version mobile 2026
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar Navigation + Content ── */}
      <div style={{
        maxWidth: '1280px',
        margin: '32px auto 64px',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '36px',
        alignItems: 'start'
      }}>

        {/* ── Sticky Left Sidebar Navigation ── */}
        <aside style={{
          position: 'sticky',
          top: '150px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
            margin: '0 0 16px 0'
          }}>
            Table des Matières
          </h3>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'otp-registration', label: '1. Inscription & Code OTP', icon: KeyRound, audience: 'all' },
              { id: 'profile-choice', label: '2. Choix du Profil Métier', icon: UserCheck, audience: 'all' },
              { id: 'candidate-jobs', label: '3. Espace Candidat & Offres', icon: Briefcase, audience: 'candidate' },
              { id: 'internship-join', label: '4. Code de Stage & Contrat PDF', icon: FileText, audience: 'candidate' },
              { id: 'internship-attendance', label: '5. Pointage Auto & GPS', icon: MapPin, audience: 'candidate' },
              { id: 'internship-calendar', label: '6. Calendrier au Millimètre', icon: Calendar, audience: 'candidate' },
              { id: 'company-setup', label: '7. Espace Entreprise & Horaires', icon: Building2, audience: 'company' },
              { id: 'company-certificate', label: '8. Certificat Officiel & QR Code', icon: Award, audience: 'company' },
              { id: 'other-services', label: '9. Billetterie & Troc de services', icon: Ticket, audience: 'all' },
              { id: 'faq-section', label: '10. Foire Aux Questions (FAQ)', icon: HelpCircle, audience: 'all' },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;
              const isDimmed = activeAudience !== 'all' && item.audience !== 'all' && item.audience !== activeAudience;
              if (isDimmed) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    border: 'none',
                    color: isSelected ? '#1a6fd4' : '#334155',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={isSelected ? '#1a6fd4' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <ChevronRight size={14} color="#1a6fd4" />}
                </button>
              );
            })}
          </nav>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

          {/* Quick Help Box */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0d3b7a', marginBottom: '4px' }}>
              <ShieldCheck size={16} color="#0d3b7a" />
              Sécurité SAMRE
            </div>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.45 }}>
              L'application certifie l'identité des stagiaires et protège les données des entreprises partenaires selon les normes les plus strictes.
            </p>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: INSCRIPTION PAR TÉLÉPHONE & CODE OTP              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="otp-registration" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0d3b7a, #1a6fd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <KeyRound size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a6fd4' }}>
                  Étape 1 • Authentification Sécurisée
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Inscription avec Numéro de Téléphone & Code OTP SMS
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Pour garantir la véracité des signatures de conventions et l'authenticité des certificats délivrés, SAMRE ne repose pas sur de simples mots de passe faciles à pirater ou à usurper. Votre identité est sécurisée directement par votre <strong>numéro de téléphone mobile</strong> validé par un <strong>code secret SMS (OTP à 6 chiffres)</strong>.
            </p>

            {/* Visual Stepper */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              {[
                {
                  step: "01",
                  title: "Saisie du Numéro",
                  desc: "Sélectionnez votre indicatif pays (ex: 🇧🇯 +229, 🇫🇷 +33, 🇨🇮 +225) et tapez votre numéro personnel.",
                  icon: Smartphone,
                  color: "#1a6fd4"
                },
                {
                  step: "02",
                  title: "Réception du SMS",
                  desc: "Un SMS immédiat vous transmet votre code de sécurité unique à 6 chiffres (ex: 482 195).",
                  icon: KeyRound,
                  color: "#f5a623"
                },
                {
                  step: "03",
                  title: "Validation Instantanée",
                  desc: "Dès que le 6ᵉ chiffre est renseigné, l'application vérifie et sécurise votre connexion en un quart de seconde.",
                  icon: CheckCircle2,
                  color: "#10b981"
                },
                {
                  step: "04",
                  title: "Numéro Fixé & Garanti",
                  desc: "Ce numéro est scellé à votre compte afin de certifier juridiquement vos conventions et diplômes.",
                  icon: ShieldCheck,
                  color: "#0d3b7a"
                }
              ].map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <div key={idx} style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color
                      }}>
                        <CardIcon size={18} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>
                        {card.step}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                      {card.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Note d'information */}
            <div style={{
              marginTop: '20px',
              backgroundColor: '#eff6ff',
              borderLeft: '4px solid #1a6fd4',
              borderRadius: '0 10px 10px 0',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <Sparkles size={18} color="#1a6fd4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>
                <strong>Astuce en cas de retard SMS :</strong> Si le SMS met quelques secondes à arriver à cause du réseau de votre opérateur, un compte à rebours s'affiche. Une fois le temps écoulé, un bouton <strong>« Renvoyer le code »</strong> devient actif pour déclencher un nouvel envoi sans quitter l'écran.
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: CHOIX DU PROFIL UTILISATEUR                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="profile-choice" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <UserCheck size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                  Étape 2 • Personnalisation Métier
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Sélection du Type de Profil (« Qui êtes-vous ? »)
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Juste après la validation de votre code OTP, l'écran vous propose de sélectionner le rôle correspondant à votre situation. Ce choix configure sur-mesure votre interface, vos menus et vos autorisations.
            </p>

            {/* Profile Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
              marginTop: '20px'
            }}>
              {/* Profil Candidat */}
              <div style={{
                border: '2px solid #3b82f6',
                borderRadius: '14px',
                padding: '24px',
                backgroundColor: '#ffffff',
                position: 'relative'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '14px'
                }}>
                  <UserCheck size={14} />
                  PROFIL 1
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', margin: '0 0 8px 0' }}>
                  Secrétaire / Candidat / Stagiaire
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Pour les étudiants, assistants, secrétaires et demandeurs d'emploi en quête de stage ou d'insertion professionnelle.
                </p>
                <ul style={{
                  paddingLeft: '18px',
                  margin: 0,
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.6
                }}>
                  <li>Créer un CV valorisé par intelligence artificielle</li>
                  <li>Postuler aux offres de stage et d'emploi</li>
                  <li>Saisir le <strong>Code de Stage</strong> de son entreprise</li>
                  <li>Pointer son arrivée et son départ (Auto ou GPS)</li>
                  <li>Consigner ses missions dans le carnet de bord</li>
                  <li>Obtenir sa Convention PDF et son Certificat officiel</li>
                </ul>
              </div>

              {/* Profil Entreprise */}
              <div style={{
                border: '2px solid #10b981',
                borderRadius: '14px',
                padding: '24px',
                backgroundColor: '#ffffff',
                position: 'relative'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '14px'
                }}>
                  <Building2 size={14} />
                  PROFIL 2
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', margin: '0 0 8px 0' }}>
                  Entreprise / Recruteur / Tuteur
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Pour les dirigeants, responsables RH, tuteurs et secrétaires d'entreprise encadrant du personnel.
                </p>
                <ul style={{
                  paddingLeft: '18px',
                  margin: 0,
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.6
                }}>
                  <li>Publier des offres d'emploi et de stage</li>
                  <li>Paramétrer les horaires officiels et le périmètre GPS</li>
                  <li>Transmettre le Code Unique de Stage aux stagiaires</li>
                  <li>Superviser la ponctualité et les présences en temps réel</li>
                  <li>Valider les étapes de progression du stagiaire</li>
                  <li>Délivrer le <strong>Certificat Officiel SAMRE avec QR Code</strong></li>
                </ul>
              </div>

              {/* Profil Visiteur */}
              <div style={{
                border: '2px solid #8b5cf6',
                borderRadius: '14px',
                padding: '24px',
                backgroundColor: '#ffffff',
                position: 'relative'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ede9fe',
                  color: '#5b21b6',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '14px'
                }}>
                  <Users size={14} />
                  PROFIL 3
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#5b21b6', margin: '0 0 8px 0' }}>
                  Visiteur / Partenaire / Autre
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Pour les professionnels indépendants, curieux et partenaires de l'écosystème SAMRE.
                </p>
                <ul style={{
                  paddingLeft: '18px',
                  margin: 0,
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.6
                }}>
                  <li>Explorer les salons, conférences et masterclasses</li>
                  <li>Réserver des places avec e-ticket QR Code sécurisé</li>
                  <li>Participer à la place de marché de troc de compétences</li>
                  <li>Répondre aux sondages et cumuler des récompenses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: ESPACE CANDIDAT & OFFRES                           */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="candidate-jobs" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Briefcase size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2563eb' }}>
                  Guide Candidat • Chapitre 1
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Espace Candidat : Profil, CV IA & Candidatures
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              L'application SAMRE intègre une place de marché dynamique pour décrocher un stage ou un emploi qualifié :
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginTop: '18px'
            }}>
              <div style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#2563eb" />
                  Profil & CV valorisé à 100 %
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Renseignez vos diplômes, compétences et expériences. L'assistant intelligent structure automatiquement votre CV dans un format prêt à être consulté ou téléchargé au format PDF professionnel.
                </p>
              </div>

              <div style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#f5a623" />
                  Postuler en 1 clic
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Filtrez les annonces par domaine, type de contrat ou ville. Un simple appui sur « Postuler » transmet instantanément votre dossier à l'entreprise recruteuse avec notification de confirmation.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: CODE DE STAGE & ACCORD NUMÉRIQUE                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-join" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0d3b7a, #1a6fd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <FileText size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a6fd4' }}>
                  Guide Stagiaire • Chapitre 2
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Rejoindre son Entreprise avec le Code de Stage & Contrat PDF
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Le suivi de stage débute le jour où votre entreprise d'accueil vous communique son <strong>Code Unique de Stage</strong> (par ex : <code>STG-7B9K2P</code>) :
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '16px'
            }}>
              <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.8 }}>
                <li>Depuis l'accueil, appuyez sur le raccourci <strong>« Suivi de stage »</strong>.</li>
                <li>Tapez le code fourni par votre tuteur ou votre secrétaire.</li>
                <li>L'application affiche le contrat de convention avec le nom de l'entreprise, les horaires contractuels (ex : <code>08:00 - 17:00</code>) et les jours travaillés.</li>
                <li>Appuyez sur <strong>« Accepter la convention et activer mon suivi »</strong> : l'autorisation de géolocalisation est sollicitée immédiatement.</li>
                <li><strong>Accord Numérique Réciproque :</strong> Le stage est alors officiellement scellé entre vous et l'entreprise !</li>
                <li>Vous pouvez alors récupérer à tout moment votre <strong>Convention de Stage officielle en PDF (3 pages)</strong> en cliquant sur l'icône rouge PDF.</li>
              </ol>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: POINTAGE AUTOMATIQUE & MANUEL GPS                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-attendance" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706' }}>
                  Guide Stagiaire • Chapitre 3
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Le Pointage de Présence : Mode Automatique vs Manuel GPS
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Pour attester de vos heures réelles de présence dans les locaux de l'entreprise, deux options sont intégrées :
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {/* Option A */}
              <div style={{
                border: '1px solid #93c5fd',
                borderRadius: '14px',
                backgroundColor: '#eff6ff',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                    Option A (Recommandée)
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: '#1e40af',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    0 CLIC ⚡
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', margin: '0 0 10px 0' }}>
                  Pointage Automatique [ON]
                </h3>
                <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.6, margin: 0 }}>
                  Activez simplement l'interrupteur dans l'onglet Aujourd'hui. Dès que vous pénétrez dans le rayon GPS de l'entreprise le matin avec votre téléphone (même écran éteint dans la poche), votre arrivée est enregistrée automatiquement. De même, votre départ est validé en fin de journée lorsque vous quittez les locaux.
                </p>
              </div>

              {/* Option B */}
              <div style={{
                border: '1px solid #fde68a',
                borderRadius: '14px',
                backgroundColor: '#fffbeb',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                    Option B (Secours)
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    MANUEL 📍
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#92400e', margin: '0 0 10px 0' }}>
                  Bouton « Pointer mon arrivée (GPS) »
                </h3>
                <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                  Si vous préférez badger manuellement ou si le mode automatique n'était pas activé, ouvrez simplement l'application à votre arrivée et touchez le bouton orange. L'application vérifie vos coordonnées satellites et certifie votre pointage avec la mention <em>À l'heure</em> ou vos minutes de retard éventuelles.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: CALENDRIER MENSUEL AU MILLIMÈTRE PRÈS              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-calendar" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                  Guide Stagiaire & Supervision • Chapitre 4
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Le Calendrier Mensuel au Millimètre Près (Crochets & Croix)
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              L'onglet <strong>Calendrier</strong> permet d'inspecter l'intégralité du stage mois par mois (Mois 1, Mois 2, Mois 3) avec une transparence absolue :
            </p>

            {/* Visual Calendar Simulation */}
            <div style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              marginTop: '18px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ backgroundColor: '#1e293b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>
                    Mois 1 (En cours)
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    Mois 2
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    Mois 3
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                  Assiduité globale : 96.5 %
                </span>
              </div>

              {/* Mini Grid representation */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px',
                textAlign: 'center',
                fontSize: '12px'
              }}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
                  <div key={i} style={{ color: '#94a3b8', fontWeight: 700, paddingBottom: '4px' }}>
                    {d}
                  </div>
                ))}
                
                {/* Simulated Days */}
                {[
                  { day: 1, status: 'validated' },
                  { day: 2, status: 'validated' },
                  { day: 3, status: 'validated' },
                  { day: 4, status: 'validated' },
                  { day: 5, status: 'validated' },
                  { day: 6, status: 'weekend' },
                  { day: 7, status: 'weekend' },
                  { day: 8, status: 'validated' },
                  { day: 9, status: 'validated' },
                  { day: 10, status: 'validated' },
                  { day: 11, status: 'missed' },
                  { day: 12, status: 'today' },
                  { day: 13, status: 'weekend' },
                  { day: 14, status: 'weekend' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    backgroundColor: item.status === 'today' ? 'rgba(245, 166, 35, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: item.status === 'today' ? '1px solid #f5a623' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>{item.day}</span>
                    {item.status === 'validated' && <CheckCircle2 size={16} color="#22c55e" />}
                    {item.status === 'missed' && <XCircle size={16} color="#ef4444" />}
                    {item.status === 'today' && <Clock size={16} color="#f5a623" />}
                    {item.status === 'weekend' && <span style={{ fontSize: '10px', color: '#64748b' }}>repos</span>}
                  </div>
                ))}
              </div>

              {/* Detailed inspection breakdown */}
              <div style={{
                marginTop: '18px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div><strong>Inspection Jour sélectionné :</strong> 10 Septembre</div>
                <div>🚪 Arrivée : <strong>08:04</strong></div>
                <div>🏁 Départ : <strong>17:02</strong></div>
                <div>⏱ Durée : <strong>8h58 réelles</strong></div>
                <div>📍 Méthode : <span style={{ color: '#60a5fa' }}>Auto Geofence</span></div>
              </div>
            </div>

            {/* Carnet de bord des missions */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                Consigner ses missions dans le carnet de bord
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Chaque jour, le stagiaire renseigne en 1 minute un court résumé de ses activités (ex: <em>« Traitement des courriers, gestion des appels entrants et préparation des dossiers d'admissions »</em>). Ce carnet est directement consultable par le tuteur pour suivre la montée en compétences.
              </p>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 7: ESPACE ENTREPRISE & SUPERVISION                    */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="company-setup" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                  Guide Entreprise • Chapitre 5
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Espace Entreprise : Horaires Officiels & Supervision en Direct
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Pour les directeurs, gérants et secrétaires d'entreprise, SAMRE automatise la gestion du personnel sans contrainte administrative :
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '18px'
            }}>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', margin: '0 0 4px 0' }}>
                  1. Paramétrage des Horaires
                </h5>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Fixez l'heure de début, l'heure de fin, la tolérance de retard accordée (ex: 15 min) et le rayon GPS de vos locaux.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', margin: '0 0 4px 0' }}>
                  2. Code de Suivi Unique
                </h5>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Transmettez votre code de stage (ex: <code>STAGE-VOTRENOM</code>). Dès saisie, le stagiaire est rattaché à votre console.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', margin: '0 0 4px 0' }}>
                  3. Supervision en Temps Réel
                </h5>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Consultez qui est au bureau à l'instant T, qui est ponctuel et découvrez le résumé des missions quotidiennes consignées.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 8: CERTIFICAT OFFICIEL AVEC QR CODE                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="company-certificate" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f5a623, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Award size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706' }}>
                  Guide Entreprise & Validation • Chapitre 6
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Délivrance du Certificat Officiel SAMRE avec QR Code Infalsifiable
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              À l'issue de la période de stage, l'entreprise valide les compétences acquises et délivre un <strong>Certificat Officiel Numérique Sécurisé</strong> :
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              mdFlexDirection: 'row',
              gap: '24px',
              backgroundColor: '#fffbeb',
              border: '2px dashed #f5a623',
              borderRadius: '14px',
              padding: '24px',
              marginTop: '18px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '10px'
                }}>
                  <QrCode size={14} />
                  Sceau d'Authenticité SAMRE
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#78350f', margin: '0 0 10px 0' }}>
                  Une attestation reconnue par les employeurs
                </h3>
                <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                  L'entreprise sélectionne la mention méritée (<em>Assiduité Exemplaire</em>, <em>Mention Très Bien</em>, <em>Félicitations du Tuteur</em>) et appose son appréciation. Le certificat généré inclut un <strong>QR Code officiel</strong> : n'importe quel recruteur le scannant avec son smartphone vérifie sur-le-champ l'authenticité des heures effectuées et du diplôme délivré.
                </p>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '16px 24px',
                minWidth: '180px',
                textAlign: 'center'
              }}>
                <QrCode size={64} color="#0d3b7a" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0d3b7a', marginTop: '8px' }}>
                  QR CODE SÉCURISÉ
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  Vérification en 1 seconde
                </span>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 9: AUTRES SERVICES (BILLETTERIE, TROC, SONDAGES)      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="other-services" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Ticket size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7c3aed' }}>
                  Services Complémentaires • Chapitre 7
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Événements, Troc de Compétences & Sondages Rémunérés
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Au-delà de l'emploi et des stages, SAMRE anime un écosystème professionnel complet :
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '18px'
            }}>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Ticket size={24} color="#7c3aed" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                  Salons & Billetterie QR
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Réservez vos places aux forums pour l'emploi, webinaires et masterclasses. Votre billet numérique avec QR Code est scanné directement à l'entrée.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <RefreshCw size={24} color="#10b981" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                  Troc & Échange de Services
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Échangez vos expertises (comptabilité, design, traduction, développement) sans décaissement de trésorerie pour accélérer vos projets.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <CheckSquare size={24} color="#f5a623" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                  Sondages & Récompenses
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Participez aux études sur les besoins du marché de l'emploi et cumulez des points de récompense convertibles dans votre portefeuille SAMRE.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 10: FOIRE AUX QUESTIONS (FAQ)                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="faq-section" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0d3b7a, #1a6fd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <HelpCircle size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a6fd4' }}>
                  Assistance Immédiate
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Foire Aux Questions (FAQ) & Réponses Fréquentes
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '12px' }}>
              Retrouvez les réponses aux interrogations les plus courantes de nos utilisateurs :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {filteredFaqs.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  color: '#64748b'
                }}>
                  Aucune question ne correspond à votre recherche « {searchQuery} ».
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaq[idx] ?? (idx === 0);
                  return (
                    <div key={idx} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.15s'
                    }}>
                      <button
                        onClick={() => toggleFaq(idx)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '16px 20px',
                          backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            backgroundColor: '#e2e8f0',
                            color: '#475569',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            whiteSpace: 'nowrap'
                          }}>
                            {faq.badge}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                            {faq.q}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          color="#64748b"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0
                          }}
                        />
                      </button>

                      {isExpanded && (
                        <div style={{
                          padding: '0 20px 18px 20px',
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                          color: '#475569',
                          lineHeight: 1.6,
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ── Footer Public SAMRE ── */}
      <footer style={{
        backgroundColor: '#0d3b7a',
        color: '#ffffff',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '48px 20px 32px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src="/logo-samre.png"
                alt="Logo SAMRE"
                style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  SAMRE
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#93c5fd' }}>
                  Plateforme Officielle pour l'Emploi & le Suivi de Stage Certifié
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '18px', fontSize: '13px', flexWrap: 'wrap' }}>
              <Link to="/cgu" style={{ color: '#e2e8f0', textDecoration: 'none' }}>
                Conditions Générales (CGU)
              </Link>
              <Link to="/privacy" style={{ color: '#e2e8f0', textDecoration: 'none' }}>
                Politique de Confidentialité
              </Link>
              <Link to="/mentions-legales" style={{ color: '#e2e8f0', textDecoration: 'none' }}>
                Mentions Légales
              </Link>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#93c5fd'
          }}>
            <span>© {new Date().getFullYear()} SAMRE. Tous droits réservés.</span>
            <span>Sécurité renforcée • Authentification OTP • Certificats avec QR Code</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserGuidePage;
