import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Copy, Check, Printer, ExternalLink, ChevronRight,
  Menu, X, FileText, CheckCircle2, AlertCircle, Info, ArrowUpRight
} from 'lucide-react';

export const UserGuidePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronisation de la section active avec le hash d'URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveSection(hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    window.history.replaceState(null, null, `#${id}`);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navigationGroups = [
    {
      title: "Prise en main",
      items: [
        { id: "intro", label: "Introduction à SAMRE" },
        { id: "auth-otp", label: "Inscription & Code OTP" },
        { id: "profile-roles", label: "Sélection du profil métier" },
      ]
    },
    {
      title: "Espace Candidat",
      items: [
        { id: "candidate-profile", label: "Profil & CV certifié" },
        { id: "candidate-apply", label: "Offres d'emploi & Postuler" },
      ]
    },
    {
      title: "Suivi de Stage (Stagiaire)",
      items: [
        { id: "internship-join", label: "Rejoindre avec le Code" },
        { id: "internship-convention", label: "Convention officielle (PDF)" },
        { id: "internship-checkin", label: "Pointage Présence (Auto & GPS)" },
        { id: "internship-calendar", label: "Calendrier au millimètre" },
        { id: "internship-logbook", label: "Carnet de bord quotidien" },
        { id: "internship-steps", label: "Progression (15% à 100%)" },
      ]
    },
    {
      title: "Espace Entreprise & Tuteur",
      items: [
        { id: "company-setup", label: "Horaires & Périmètre GPS" },
        { id: "company-supervision", label: "Supervision des arrivées" },
        { id: "company-certificate", label: "Délivrance du Certificat QR" },
      ]
    },
    {
      title: "Services & FAQ",
      items: [
        { id: "other-services", label: "Événements, Troc & Sondages" },
        { id: "faq", label: "Foire Aux Questions (FAQ)" },
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: '15px',
      lineHeight: 1.7
    }}>

      {/* ── Top Navigation (Style Documentation Premium : Stripe / GitHub Docs) ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between'
      }}>
        {/* Left: Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#334155'
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo-samre.png"
              alt="SAMRE"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#0d3b7a', letterSpacing: '-0.02em' }}>
                SAMRE
              </span>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                / Docs
              </span>
              <span style={{
                fontSize: '11px',
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '1px 6px',
                fontWeight: 600
              }}>
                v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '340px',
          maxWidth: '100%'
        }} className="hidden md:flex">
          <Search size={15} color="#94a3b8" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans la documentation..."
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              width: '100%',
              color: '#0f172a'
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

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopy}
            title="Copier le lien direct"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {copiedLink ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copié' : 'Partager'}</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#0d3b7a',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Printer size={14} />
            <span>Imprimer</span>
          </button>
        </div>
      </header>

      {/* ── Document Shell: Sidebar + Content + On-this-page ── */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr) 220px',
        gap: '40px',
        padding: '32px 24px'
      }} className="docs-container">

        {/* ── Left Sidebar Navigation ── */}
        <aside style={{
          position: 'sticky',
          top: '96px',
          height: 'calc(100vh - 120px)',
          overflowY: 'auto',
          paddingRight: '12px'
        }} className="docs-sidebar">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#64748b',
                marginBottom: '8px',
                paddingLeft: '10px'
              }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isCurrent = activeSection === item.id;
                  const matchesSearch = !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!matchesSearch) return null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        border: 'none',
                        backgroundColor: isCurrent ? '#f1f5f9' : 'transparent',
                        color: isCurrent ? '#0d3b7a' : '#334155',
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        borderLeft: isCurrent ? '3px solid #0d3b7a' : '3px solid transparent',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Center Article Body ── */}
        <main style={{ maxWidth: '820px', minWidth: 0 }} className="docs-main">
          
          {/* Breadcrumbs */}
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}>
            <span>Documentation</span>
            <ChevronRight size={12} />
            <span>Guide Utilisateur Officiel</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>SAMRE Mobile & Web</span>
          </div>

          {/* Document Title Header */}
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '24px', marginBottom: '36px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0'
            }}>
              Manuel d'Utilisation SAMRE
            </h1>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Ce guide détaille le fonctionnement complet de la plateforme : authentification sécurisée par numéro et code OTP, gestion de profil, suivi de stage certifié, carnet de présence au millimètre près et émission des attestations officielles avec QR Code.
            </p>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: INTRODUCTION                                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="intro" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              1. Introduction à la Plateforme
            </h2>
            <p>
              SAMRE est une solution intégrée conçue pour professionnaliser l'insertion des talents, encadrer le déroulement des stages en entreprise et dématérialiser la validation des compétences sans paperasse superflue.
            </p>
            <p>
              La plateforme répond à trois besoins majeurs :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Candidats et Stagiaires :</strong> Accéder à des offres vérifiées, formaliser leur période de stage par un contrat numérique clair et certifier leurs heures réelles grâce au pointage géolocalisé.</li>
              <li><strong>Entreprises et Tuteurs :</strong> Superviser en direct l'assiduité et la ponctualité des stagiaires, valider les étapes d'évaluation et délivrer un certificat officiel reconnu par le marché de l'emploi.</li>
              <li><strong>Partenaires et Professionnels :</strong> Développer leur réseau via les événements, le troc de compétences et les sondages d'opinion.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: AUTHENTIFICATION OTP                               */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="auth-otp" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              2. Inscription & Code de Vérification (OTP)
            </h2>
            <p>
              Afin d'éliminer les risques de fausses déclarations, de doublons ou de comptes fictifs, SAMRE certifie l'identité de chaque utilisateur à travers son <strong>numéro de téléphone mobile</strong> et un <strong>code secret unique reçu par SMS (OTP)</strong>.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '20px 0 8px 0' }}>
              Procédure d'inscription pas à pas :
            </h3>
            <ol style={{ paddingLeft: '24px', margin: '0 0 20px', lineHeight: 1.8 }}>
              <li>Ouvrez l'application SAMRE et choisissez <strong>Commencer</strong> ou <strong>Créer un compte</strong>.</li>
              <li>Sélectionnez l'indicatif correspondant à votre pays (ex : <code>+229</code> Bénin, <code>+33</code> France, <code>+225</code> Côte d'Ivoire, <code>+228</code> Togo).</li>
              <li>Saisissez votre numéro de téléphone personnel et confirmez.</li>
              <li>Vous recevez instantanément un SMS contenant un <strong>code à 6 chiffres</strong>.</li>
              <li>Saisissez les 6 chiffres dans les cases dédiées : la validation s'exécute automatiquement dès le dernier chiffre renseigné.</li>
            </ol>

            {/* Note Callout */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderLeft: '4px solid #0d3b7a',
              padding: '14px 18px',
              borderRadius: '0 8px 8px 0',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0d3b7a', marginBottom: '4px' }}>
                Note Importante — Numéro de téléphone immuable
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Le numéro validé par code OTP est scellé à votre compte afin de conférer une valeur probante aux conventions de stage et aux diplômes émis. Il ne peut pas être modifié librement par la suite.
              </div>
            </div>

            <div style={{
              backgroundColor: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              padding: '14px 18px',
              borderRadius: '0 8px 8px 0'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>
                En cas de délai de réception du SMS
              </div>
              <div style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                Un compte à rebours de 60 secondes est déclenché à l'envoi. Si le SMS n'est pas parvenu à expiration du délai, appuyez sur <strong>« Renvoyer le code »</strong>. Vérifiez que votre terminal n'est pas en mode hors-ligne.
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: SÉLECTION DU PROFIL                                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="profile-roles" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              3. Sélection du Profil Métier
            </h2>
            <p>
              Dès la validation du code OTP, l'écran <strong>« Qui êtes-vous ? »</strong> vous propose d'orienter votre espace de travail selon votre rôle :
            </p>

            {/* Table comparative des profils */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              margin: '20px 0',
              border: '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', width: '25%' }}>Profil</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', width: '35%' }}>Public Cible</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Fonctionnalités Clés</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0d3b7a' }}>Secrétaire / Candidat</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Étudiants, assistants, secrétaires et stagiaires</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>CV assisté par IA, candidature aux offres, code de stage, pointage présence, convention PDF.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#059669' }}>Entreprise / Recruteur</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Employeurs, DRH, tuteurs et gérants de structures</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Publication d'offres, code de stage, horaires & rayon GPS, audit des présences en temps réel, émission du certificat officiel.</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#7c3aed' }}>Visiteur / Autre</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Indépendants, partenaires institutionnels</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Salons & conférences avec e-ticket QR, troc de services inter-professionnels, participation aux sondages.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: CANDIDAT & CV                                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="candidate-profile" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              4. Espace Candidat : Profil & CV Numérique
            </h2>
            <p>
              Pour maximiser vos opportunités de sélection, l'application vous invite à compléter votre dossier :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Renseignements de base :</strong> Titre de poste recherché, compétences clés, formations académiques et expériences antérieures.</li>
              <li><strong>Génération de CV assistée :</strong> Mise en page automatique d'un curriculum vitae prêt à l'emploi.</li>
              <li><strong>Statut de visibilité :</strong> Option pour rendre votre profil consultable directement par les entreprises partenaires de SAMRE.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: OFFRES & CANDIDATURES                              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="candidate-apply" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              5. Consultation des Offres & Dépôt de Candidature
            </h2>
            <p>
              Depuis l'onglet <strong>Offres</strong>, filtrez par type de contrat (Stage professionnel, Stage académique, CDD, CDI), par localisation ou par domaine d'activité.
            </p>
            <p>
              En appuyant sur <strong>« Postuler »</strong>, votre profil complet est transmis sans friction au service de recrutement de l'entreprise. Vous pouvez suivre l'état d'examen de vos candidatures dans votre tableau de bord.
            </p>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: REJOINDRE LE SUIVI DE STAGE                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-join" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              6. Rejoindre son Entreprise (Code de Stage)
            </h2>
            <p>
              Lorsque votre période de stage débute, l'entreprise vous transmet son <strong>Code de Stage Unique</strong> (par ex : <code>STG-7B9K2P</code>) :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Appuyez sur le raccourci <strong>« Suivi de stage »</strong> sur l'écran d'accueil.</li>
              <li>Renseignez le code fourni par votre structure d'accueil.</li>
              <li>L'écran affiche la proposition de stage : coordonnées de l'entreprise, horaires contractuels (ex: <code>08:00 - 17:00</code>) et jours ouvrés.</li>
              <li>Appuyez sur <strong>« Accepter la convention et activer mon suivi »</strong>. L'application configure alors le périmètre de pointage et officialise l'accord réciproque.</li>
            </ol>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 7: CONVENTION OFFICIELLE PDF                          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-convention" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              7. Convention de Stage Officielle (PDF)
            </h2>
            <p>
              Dès que l'accord est scellé, un document contractuel officiel de 3 pages est édité :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Rendez-vous dans l'onglet <strong>Convention & Dossier</strong> ou cliquez sur l'icône <strong>PDF</strong>.</li>
              <li>Appuyez sur <strong>« Télécharger ma convention (PDF) »</strong>.</li>
              <li>Le fichier PDF intègre les mentions légales, les engagements des deux parties, les horaires, l'adresse de travail ainsi que les références d'accord numérique et le cachet certifié.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 8: POINTAGE PRÉSENCE (AUTO & GPS)                     */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-checkin" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              8. Le Pointage de Présence : Automatique ou Manuel
            </h2>
            <p>
              Pour certifier que le stagiaire est présent sur le lieu de travail conformément à la convention, l'application propose deux modalités :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '18px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ fontWeight: 700, color: '#0d3b7a', marginBottom: '8px' }}>
                  A. Pointage Automatique [ON]
                </div>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Dans l'onglet <strong>Aujourd'hui</strong>, activez l'interrupteur. Dès votre arrivée dans le périmètre de l'entreprise le matin avec votre téléphone, l'application valide automatiquement votre badgeage sans aucune manipulation. Le départ est consigné de même lorsque vous quittez les locaux.
                </p>
              </div>

              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '18px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                  B. Pointage Manuel (Bouton GPS)
                </div>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Si le mode automatique est désactivé ou pour un pointage ponctuel, ouvrez l'application à votre arrivée et appuyez sur <strong>« Pointer mon arrivée (GPS) »</strong>. La position satellite est vérifiée par rapport aux coordonnées de l'entreprise et valide la présence.
                </p>
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 9: CALENDRIER MENSUEL AU MILLIMÈTRE                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-calendar" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              9. Calendrier Mensuel au Millimètre Près
            </h2>
            <p>
              L'onglet <strong>Calendrier</strong> présente une vue intégrale sur chacun des mois du stage (Mois 1, Mois 2, Mois 3) :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Crochet Vert (✔) :</strong> Journée validée avec succès (présence certifiée).</li>
              <li><strong>Croix Rouge (✖) :</strong> Journée ouvrée sans enregistrement de présence (absence).</li>
              <li><strong>Badge Orange :</strong> Journée en cours en attente de pointage ou de clôture.</li>
              <li><strong>Fiche d'audit détaillée :</strong> En touchant n'importe quel jour du calendrier, vous affichez l'heure exacte d'arrivée, l'heure exacte de départ, la durée effective travaillée, la méthode de validation utilisée et les tâches accomplies.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 10: CARNET DE BORD QUOTIDIEN                          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-logbook" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              10. Consigner son Résumé de Journée (Carnet de bord)
            </h2>
            <p>
              Chaque jour, le stagiaire est invité à résumer brièvement ses activités :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Dans l'onglet <strong>Aujourd'hui</strong> ou depuis le calendrier, sélectionnez <strong>« Consigner mes missions du jour »</strong>.</li>
              <li>Rédigez en quelques lignes les tâches exécutées (ex: <em>« Archivage des dossiers comptables et accueil physique des usagers »</em>).</li>
              <li>Enregistrez. Le résumé est immédiatement consultable par le tuteur de stage.</li>
            </ol>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 11: PROGRESSION DU STAGE                              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="internship-steps" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              11. Les 5 Étapes de Progression vers la Certification
            </h2>
            <p>
              Le parcours de stage est jalonné en 5 étapes clés calculées de 15 % à 100 % :
            </p>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              margin: '16px 0',
              border: '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '15%' }}>Progression</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '30%' }}>Étape</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Action associée</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>15 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Accueil & Intégration</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Signature de la convention et paramétrage du suivi.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>50 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Missions & Pointage</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Réalisation continue des missions et pointage quotidien.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>75 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Bilan Mi-parcours</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Entretien intermédiaire avec le tuteur.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>90 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Rapport de Stage</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Finalisation du carnet de bord et synthèse des acquis.</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>100 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Certification SAMRE</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Clôture par l'entreprise et délivrance de l'attestation QR.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 12: ENTREPRISE & HORAIRES                             */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="company-setup" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              12. Espace Entreprise : Horaires & Périmètre GPS
            </h2>
            <p>
              Pour configurer le suivi dans votre structure :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Connectez-vous sur votre espace Entreprise.</li>
              <li>Renseignez les horaires officiels d'activité (ex: <code>08:00 - 17:00</code>), les jours ouvrables (du lundi au vendredi) et la tolérance accordée pour les retards (ex: 15 minutes).</li>
              <li>Localisez votre siège ou site d'exploitation pour fixer le rayon de géolocalisation (30 à 50 mètres).</li>
              <li>Récupérez votre <strong>Code de Stage Unique</strong> affiché sur votre tableau de bord et remettez-le à vos nouveaux stagiaires.</li>
            </ol>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 13: ENTREPRISE & SUPERVISION                          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="company-supervision" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              13. Supervision des Présences en Direct
            </h2>
            <p>
              Le tableau de bord entreprise permet de suivre en direct :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>La liste complète de vos stagiaires en cours d'immersion.</li>
              <li>Les badgeages d'arrivée en temps réel avec indicateur de ponctualité.</li>
              <li>Le taux global d'assiduité mensuelle calculé automatiquement.</li>
              <li>Les résumés de missions consignés chaque soir par les stagiaires.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 14: DÉLIVRANCE DU CERTIFICAT AVEC QR CODE             */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="company-certificate" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              14. Délivrance du Certificat Officiel avec QR Code
            </h2>
            <p>
              Au terme de la période de stage :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Ouvrez la fiche du stagiaire et cliquez sur <strong>« Clôturer le stage & Délivrer le Certificat »</strong>.</li>
              <li>Attribuez la mention d'honneur appropriée (<em>Assiduité Exemplaire</em>, <em>Mention Très Bien</em>, <em>Félicitations du Tuteur</em> ou <em>Stage Validé</em>).</li>
              <li>Inscrivez votre appréciation qualitative finale et validez l'émission.</li>
            </ol>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                Fonctionnement de l'authentification par QR Code
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Le certificat PDF généré embarque une signature cryptographique sous la forme d'un QR Code unique. Tout futur recruteur scannant ce code est redirigé vers une page officielle SAMRE qui authentifie sans équivoque les dates du stage, le nom de l'entreprise hôte et le volume d'heures réelles accomplies.
              </div>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 15: AUTRES SERVICES                                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="other-services" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              15. Services Complémentaires de la Plateforme
            </h2>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Événements & Billetterie QR :</strong> Réservation de places pour les conférences et salons professionnels avec e-ticket numérique à présenter à l'accueil.</li>
              <li><strong>Troc & Partenariats B2B :</strong> Mise en relation inter-entreprises pour échanger des prestations et compétences sans flux monétaire.</li>
              <li><strong>Sondages Rémunérés :</strong> Participation à des études d'opinion avec points de fidélité crédités dans votre portefeuille SAMRE.</li>
            </ul>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 16: FAQ                                               */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section id="faq" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              16. Foire Aux Questions (FAQ)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {[
                {
                  q: "Que faire si je ne reçois pas le code SMS (OTP) lors de l'inscription ?",
                  a: "Vérifiez que vous avez sélectionné le bon indicatif pays (ex: +229 pour le Bénin, +33 pour la France). Si le SMS tarde à arriver, patientez jusqu'à la fin du compte à rebours de sécurité (60 secondes) puis cliquez sur « Renvoyer le code »."
                },
                {
                  q: "Puis-je changer mon numéro de téléphone après l'inscription ?",
                  a: "Non. Le numéro de téléphone validé par SMS reste lié de façon définitive à votre compte afin de préserver la valeur juridique des conventions de stage et certificats signés. En cas de perte de carte SIM, contactez le support."
                },
                {
                  q: "Que faire si le pointage automatique ne s'est pas déclenché ce matin ?",
                  a: "Ouvrez simplement l'application et appuyez sur « Pointer mon arrivée (GPS) » dans l'onglet Aujourd'hui. Assurez-vous également que l'autorisation de géolocalisation pour SAMRE est réglée sur « Toujours autoriser » dans les réglages de votre smartphone."
                },
                {
                  q: "J'ai oublié de consigner mes missions hier, puis-je rattraper ?",
                  a: "Oui. Dans l'onglet Calendrier, touchez le jour précédent et sélectionnez « Consigner / Modifier mes activités » pour mettre à jour vos notes."
                },
                {
                  q: "Comment un recruteur s'assure-t-il de la validité de mon certificat ?",
                  a: "Il lui suffit de scanner le QR Code imprimé sur votre attestation avec son smartphone. Une page officielle de confirmation SAMRE certifie en direct la validité du document."
                }
              ].map((item, i) => (
                <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    {item.q}
                  </div>
                  <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Document Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '24px',
            marginTop: '40px',
            fontSize: '13px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span>© {new Date().getFullYear()} SAMRE Technologies. Tous droits réservés.</span>
            <span>Documentation certifiée officielle</span>
          </div>

        </main>

        {/* ── Right Column: "Sur cette page" Mini-TOC ── */}
        <aside style={{
          position: 'sticky',
          top: '96px',
          height: 'calc(100vh - 120px)',
          overflowY: 'auto'
        }} className="docs-on-this-page">
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748b',
            marginBottom: '12px'
          }}>
            Sur cette page
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <a href="#intro" style={{ color: activeSection === 'intro' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'intro' ? 700 : 400 }}>
              1. Introduction
            </a>
            <a href="#auth-otp" style={{ color: activeSection === 'auth-otp' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'auth-otp' ? 700 : 400 }}>
              2. Inscription & Code OTP
            </a>
            <a href="#profile-roles" style={{ color: activeSection === 'profile-roles' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'profile-roles' ? 700 : 400 }}>
              3. Profils Métier
            </a>
            <a href="#candidate-profile" style={{ color: activeSection === 'candidate-profile' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'candidate-profile' ? 700 : 400 }}>
              4. Espace Candidat & CV
            </a>
            <a href="#candidate-apply" style={{ color: activeSection === 'candidate-apply' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'candidate-apply' ? 700 : 400 }}>
              5. Offres d'emploi
            </a>
            <a href="#internship-join" style={{ color: activeSection === 'internship-join' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-join' ? 700 : 400 }}>
              6. Rejoindre avec le Code
            </a>
            <a href="#internship-convention" style={{ color: activeSection === 'internship-convention' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-convention' ? 700 : 400 }}>
              7. Convention PDF
            </a>
            <a href="#internship-checkin" style={{ color: activeSection === 'internship-checkin' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-checkin' ? 700 : 400 }}>
              8. Pointage Présence
            </a>
            <a href="#internship-calendar" style={{ color: activeSection === 'internship-calendar' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-calendar' ? 700 : 400 }}>
              9. Calendrier au millimètre
            </a>
            <a href="#internship-logbook" style={{ color: activeSection === 'internship-logbook' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-logbook' ? 700 : 400 }}>
              10. Carnet de bord
            </a>
            <a href="#internship-steps" style={{ color: activeSection === 'internship-steps' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'internship-steps' ? 700 : 400 }}>
              11. Progression de stage
            </a>
            <a href="#company-setup" style={{ color: activeSection === 'company-setup' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'company-setup' ? 700 : 400 }}>
              12. Horaires & Périmètre
            </a>
            <a href="#company-supervision" style={{ color: activeSection === 'company-supervision' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'company-supervision' ? 700 : 400 }}>
              13. Supervision en direct
            </a>
            <a href="#company-certificate" style={{ color: activeSection === 'company-certificate' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'company-certificate' ? 700 : 400 }}>
              14. Certificat avec QR Code
            </a>
            <a href="#other-services" style={{ color: activeSection === 'other-services' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'other-services' ? 700 : 400 }}>
              15. Services secondaires
            </a>
            <a href="#faq" style={{ color: activeSection === 'faq' ? '#0d3b7a' : '#64748b', textDecoration: 'none', fontWeight: activeSection === 'faq' ? 700 : 400 }}>
              16. FAQ
            </a>
          </nav>
        </aside>

      </div>

      <style>{`
        @media (max-width: 1024px) {
          .docs-container {
            grid-template-columns: 240px 1fr !important;
          }
          .docs-on-this-page {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .docs-container {
            grid-template-columns: 1fr !important;
            padding: 20px 16px !important;
          }
          .docs-sidebar {
            display: ${mobileMenuOpen ? 'block' : 'none'} !important;
            position: fixed !important;
            top: 64px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: #ffffff !important;
            z-index: 40 !important;
            padding: 20px !important;
            height: calc(100vh - 64px) !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }
        @media print {
          header, aside, .docs-sidebar, .docs-on-this-page, .mobile-menu-btn {
            display: none !important;
          }
          .docs-container {
            grid-template-columns: 1fr !important;
            padding: 0 !important;
          }
          body {
            font-size: 12pt !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserGuidePage;
