import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, Menu, X } from 'lucide-react';

export const UserGuidePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronisation avec le hash d'URL
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

  const navigationGroups = [
    {
      title: "Prise en main commune",
      items: [
        { id: "intro", label: "1. Présentation de SAMRE" },
        { id: "auth-otp", label: "2. Inscription & Code OTP (SMS)" },
        { id: "profile-roles", label: "3. Choix du profil utilisateur" },
      ]
    },
    {
      title: "Espace Candidat & Stagiaire",
      items: [
        { id: "candidate-profile", label: "4. Profil & CV généré par IA" },
        { id: "candidate-apply", label: "5. Recherche d'offres & Candidatures" },
        { id: "internship-join", label: "6. Code de Stage & Accord numérique" },
        { id: "internship-convention", label: "7. Convention officielle en PDF" },
        { id: "internship-checkin", label: "8. Pointage Présence (Auto & GPS)" },
        { id: "internship-calendar", label: "9. Calendrier mensuel au millimètre" },
        { id: "internship-logbook", label: "10. Carnet de bord des missions" },
        { id: "internship-steps", label: "11. Progression vers la certification" },
      ]
    },
    {
      title: "Espace Entreprise & Tuteur",
      items: [
        { id: "company-setup", label: "12. Horaires, jours ouvrés & GPS" },
        { id: "company-code", label: "13. Gestion du Code de Stage" },
        { id: "company-supervision", label: "14. Supervision des arrivées en direct" },
        { id: "company-evaluations", label: "15. Validation des étapes & Bilans" },
        { id: "company-certificate", label: "16. Délivrance du Certificat avec QR Code" },
        { id: "company-offers", label: "17. Publication d'offres & Recrutement" },
        { id: "company-branding", label: "18. Bannières & Visibilité de marque" },
      ]
    },
    {
      title: "Espace Visiteur & Partenaire",
      items: [
        { id: "visitor-events", label: "19. Événements, Forums & Billetterie QR" },
        { id: "visitor-barter", label: "20. Place de marché Troc de compétences" },
        { id: "visitor-surveys", label: "21. Sondages & Récompenses" },
      ]
    },
    {
      title: "Questions Fréquentes (FAQ)",
      items: [
        { id: "faq-candidats", label: "22. FAQ Candidats & Stagiaires" },
        { id: "faq-entreprises", label: "23. FAQ Entreprises & Tuteurs" },
        { id: "faq-visiteurs", label: "24. FAQ Visiteurs & Support" },
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

      {/* ── Top Navigation Épurée (Sans bouton Imprimer ni Partager) ── */}
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
        {/* Left: Brand Logo & Title */}
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
                / Documentation Utilisateur
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

        {/* Right: Barre de recherche discrète */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '320px',
          maxWidth: '100%'
        }} className="hidden md:flex">
          <Search size={15} color="#94a3b8" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (OTP, contrat, horaires, QR Code...)"
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
      </header>

      {/* ── Document Shell: Sidebar + Content ── */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '270px minmax(0, 1fr)',
        gap: '40px',
        padding: '32px 24px'
      }} className="docs-container">

        {/* ── Left Sidebar Navigation (Sans aucune bordure sur les liens) ── */}
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
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#64748b',
                marginBottom: '8px',
                paddingLeft: '8px'
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
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        border: 'none',
                        backgroundColor: isCurrent ? '#f1f5f9' : 'transparent',
                        color: isCurrent ? '#0d3b7a' : '#334155',
                        fontWeight: isCurrent ? 700 : 400,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {item.label}
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
            <span>Guide d'Utilisation Officiel</span>
            <ChevronRight size={12} />
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Candidats, Entreprises & Visiteurs</span>
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
              Guide d'Utilisation Général SAMRE
            </h1>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Documentation officielle pour les trois profils utilisateurs : Candidats & Stagiaires, Entreprises & Tuteurs, et Visiteurs & Partenaires.
            </p>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PARTIE 1 : PRISE EN MAIN COMMUNE                             */}
          {/* ═════════════════════════════════════════════════════════════ */}

          <section id="intro" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              1. Présentation de SAMRE
            </h2>
            <p>
              SAMRE est une plateforme numérique conçue pour simplifier l'insertion professionnelle, sécuriser les stages en entreprise et fluidifier les recrutements. L'application mobile accompagne les stagiaires et les employeurs de la signature de la convention jusqu'à la remise du certificat officiel.
            </p>
            <p>
              Chaque utilisateur dispose d'un espace adapté à son statut avec des fonctionnalités dédiées et un journal d'activité sécurisé.
            </p>
          </section>

          <section id="auth-otp" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              2. Inscription & Code de Vérification (OTP)
            </h2>
            <p>
              Pour assurer l'authenticité des comptes et éviter toute usurpation, SAMRE s'appuie sur une vérification directe par numéro de téléphone mobile et code SMS unique (OTP).
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '20px 0 8px 0' }}>
              Étapes de création de compte :
            </h3>
            <ol style={{ paddingLeft: '24px', margin: '0 0 16px', lineHeight: 1.8 }}>
              <li>Lancez l'application et appuyez sur <strong>Commencer</strong> ou <strong>Créer un compte</strong>.</li>
              <li>Sélectionnez l'indicatif téléphonique de votre pays (ex : <code>+229</code> Bénin, <code>+33</code> France, <code>+225</code> Côte d'Ivoire, <code>+228</code> Togo).</li>
              <li>Saisissez votre numéro personnel et validez.</li>
              <li>Vous recevez par SMS un <strong>code de sécurité à 6 chiffres</strong>.</li>
              <li>Saisissez ce code dans l'application : l'accès est déverrouillé automatiquement.</li>
            </ol>

            <p style={{ color: '#475569', fontSize: '14px', marginTop: '12px' }}>
              <strong>Note importante sur le numéro de téléphone :</strong> Le numéro validé par code OTP est strictement lié à votre compte afin de garantir la validité juridique des conventions et attestations signées. Il ne peut pas être modifié librement après l'inscription.
            </p>

            <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>
              <strong>Délai de réception :</strong> Si le SMS n'arrive pas immédiatement, patientez la fin du compte à rebours de sécurité (60 secondes) puis appuyez sur <strong>« Renvoyer le code »</strong>. Assurez-vous d'avoir une couverture réseau GSM suffisante.
            </p>
          </section>

          <section id="profile-roles" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              3. Choix du Profil Utilisateur
            </h2>
            <p>
              Dès la vérification de votre code SMS, vous devez sélectionner votre rôle métier. L'interface s'ajuste immédiatement selon vos besoins :
            </p>

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
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', width: '35%' }}>Destinataires</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Usage Principal</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0d3b7a' }}>Secrétaire / Candidat</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Étudiants, stagiaires, demandeurs d'emploi, assistants</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Création de CV, recherche d'offres, saisie du code de stage, pointage présence, convention PDF.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0d3b7a' }}>Entreprise / Recruteur</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Directeurs, RH, tuteurs de stage, secrétaires d'entreprise</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Horaires de bureau, périmètre GPS, code stagiaire, suivi des présences en temps réel, certificat avec QR Code.</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0d3b7a' }}>Visiteur / Autre</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Indépendants, partenaires, grand public</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>Salons professionnels, billetterie électronique avec QR Code, place de marché de troc de compétences, sondages.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PARTIE 2 : GUIDE CANDIDAT & STAGIAIRE                        */}
          {/* ═════════════════════════════════════════════════════════════ */}

          <section id="candidate-profile" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              4. Espace Candidat : Profil & CV Assisté par IA
            </h2>
            <p>
              Pour augmenter vos chances auprès des recruteurs partenaires, renseignez soigneusement votre profil dans l'onglet <strong>Profil</strong> :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Coordonnées & Titre :</strong> Spécifiez le poste visé (ex : <em>Secrétaire de Direction</em>, <em>Comptable Junior</em>, <em>Développeur Web</em>).</li>
              <li><strong>Formations & Diplômes :</strong> Détaillez vos établissements et niveaux d'études.</li>
              <li><strong>Expériences & Compétences :</strong> Listez vos savoir-faire techniques et pratiques.</li>
              <li><strong>CV Numérique Automatique :</strong> Vos informations sont automatiquement structurées dans un CV professionnel téléchargeable en PDF.</li>
            </ul>
          </section>

          <section id="candidate-apply" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              5. Recherche d'Offres & Candidatures
            </h2>
            <p>
              L'onglet <strong>Offres</strong> rassemble les annonces publiées par les structures vérifiées :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Filtrez par localisation géographique, type de contrat (Stage professionnel, Stage académique, CDD, CDI) et secteur d'activité.</li>
              <li>Consultez les missions requises, les horaires et les critères d'éligibilité.</li>
              <li>Appuyez sur <strong>« Postuler »</strong> pour soumettre votre candidature en un clic. L'entreprise reçoit instantanément votre dossier complet.</li>
            </ul>
          </section>

          <section id="internship-join" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              6. Code de Stage & Accord Numérique Réciproque
            </h2>
            <p>
              Lorsque votre période de stage démarre dans une entreprise, celle-ci vous remet son <strong>Code de Stage Unique</strong> (ex : <code>STG-7B9K2P</code>) :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Sur l'accueil, appuyez sur le bouton <strong>« Suivi de stage »</strong>.</li>
              <li>Saisissez le code transmis par votre superviseur ou tuteur.</li>
              <li>L'écran affiche la fiche contractuelle : nom de l'entreprise d'accueil, horaires d'embauche et de sortie (ex : <code>08:00 - 17:00</code>), jours travaillés hebdomadaires.</li>
              <li>Appuyez sur <strong>« Accepter la convention et activer mon suivi »</strong>.</li>
              <li>L'accord numérique réciproque est alors enregistré et scellé. Votre suivi de stage est officiellement actif.</li>
            </ol>
          </section>

          <section id="internship-convention" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              7. Consultation & Téléchargement de la Convention (PDF)
            </h2>
            <p>
              Dès que l'accord est validé, vous pouvez télécharger votre convention officielle :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Rendez-vous dans l'onglet <strong>Convention & Dossier</strong> ou appuyez sur l'icône rouge PDF en haut de l'écran.</li>
              <li>Sélectionnez <strong>« Télécharger ma convention (PDF) »</strong>.</li>
              <li>Le document contractuel complet (3 pages) comprend les articles légaux, les horaires, l'adresse exacte du lieu de stage, la référence unique du dossier et les signatures numériques certifiées des deux parties.</li>
            </ul>
          </section>

          <section id="internship-checkin" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              8. Le Pointage de Présence : Mode Automatique & Manuel GPS
            </h2>
            <p>
              Pour justifier de votre assiduité dans les locaux de l'entreprise, l'application dispose de deux options simples :
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '16px 0 6px 0' }}>
              Option A : Pointage Automatique (Recommandé)
            </h3>
            <p>
              Dans l'onglet <strong>Aujourd'hui</strong>, activez l'interrupteur <strong>Pointage Automatique [ON]</strong>. Dès que vous pénétrez dans le rayon GPS des bureaux le matin avec votre téléphone (même écran éteint dans votre poche), votre arrivée est validée automatiquement. À votre sortie des locaux le soir, l'heure de départ est enregistrée sans intervention manuelle.
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '16px 0 6px 0' }}>
              Option B : Pointage Manuel par GPS
            </h3>
            <p>
              Si vous préférez badger manuellement ou si le mode automatique était désactivé, ouvrez simplement l'application à votre arrivée et appuyez sur <strong>« Pointer mon arrivée (GPS) »</strong>. Votre position par rapport au site de l'entreprise est vérifiée et consigne votre heure avec la mention <em>À l'heure</em> ou vos minutes de retard éventuelles.
            </p>
          </section>

          <section id="internship-calendar" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              9. Calendrier Mensuel au Millimètre Près
            </h2>
            <p>
              L'onglet <strong>Calendrier</strong> offre une visibilité totale mois par mois (Mois 1, Mois 2, Mois 3) :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Crochet Vert (✔) :</strong> Journée validée avec succès (présence certifiée).</li>
              <li><strong>Croix Rouge (✖) :</strong> Journée ouvrée sans enregistrement de présence (absence).</li>
              <li><strong>Badge Orange :</strong> Journée d'aujourd'hui en cours.</li>
              <li><strong>Cases Grisées :</strong> Week-ends et jours de repos contractuels.</li>
              <li><strong>Audit détaillé d'une journée :</strong> Touchez n'importe quel jour du calendrier pour afficher la fiche complète : heure exacte d'arrivée, heure de départ, temps réel travaillé, méthode de validation (Geofence ou GPS manuel) et tâches accomplies.</li>
            </ul>
          </section>

          <section id="internship-logbook" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              10. Consigner son Carnet de Bord Quotidien
            </h2>
            <p>
              Chaque jour ouvré, le stagiaire renseigne en 1 minute un court résumé de ses activités :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Dans l'onglet <strong>Aujourd'hui</strong> ou en cliquant sur le jour dans le calendrier, sélectionnez <strong>« Consigner mes missions du jour »</strong>.</li>
              <li>Décrivez les tâches accomplies (ex : <em>« Accueil physique et téléphonique, enregistrement des courriers entrants et mise à jour du registre des fournisseurs »</em>).</li>
              <li>Enregistrez. Ce carnet est directement visible par le tuteur de stage pour évaluer votre progression.</li>
            </ol>
          </section>

          <section id="internship-steps" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              11. Les 5 Étapes vers la Certification
            </h2>
            <p>
              Dans l'onglet <strong>Convention & Dossier</strong>, votre progression est mesurée de 15 % à 100 % :
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
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '15%' }}>Avancement</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '30%' }}>Étape</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description de l'étape</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>15 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Accueil & Intégration</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Signature de la convention et paramétrage des horaires.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>50 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Missions & Pointage</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Exécution quotidienne des activités et badgeage régulier.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>75 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Bilan Mi-parcours</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Entretien intermédiaire avec le tuteur de stage.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d3b7a' }}>90 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Rapport de Stage</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Finalisation du carnet de bord et synthèse des acquis.</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16a34a' }}>100 %</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Certification SAMRE</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>Clôture par l'employeur et délivrance du Certificat avec QR Code.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PARTIE 3 : GUIDE ENTREPRISE, RECUTEUR & TUTEUR              */}
          {/* ═════════════════════════════════════════════════════════════ */}

          <section id="company-setup" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              12. Espace Entreprise : Horaires, Jours Ouvrés & Périmètre GPS
            </h2>
            <p>
              L'espace Entreprise permet aux employeurs, directeurs des ressources humaines, tuteurs et secrétaires de superviser facilement leurs stagiaires sans lourdeur administrative.
            </p>
            <p>
              Dès la première connexion, configurez les paramètres de travail de votre structure :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Complétez la fiche de l'entreprise : raison sociale, logo, adresse physique et contact officiel.</li>
              <li>Définissez vos <strong>horaires de bureau</strong> : heure d'embauche le matin (ex : <code>08:00</code>) et heure de débauche le soir (ex : <code>17:00</code>).</li>
              <li>Fixez la <strong>tolérance de retard</strong> accordée aux collaborateurs (ex : <code>15 minutes</code>). Tout badgeage effectué au-delà de cette tolérance est automatiquement comptabilisé en retard.</li>
              <li>Sélectionnez les <strong>jours ouvrés</strong> (ex : du lundi au vendredi). Les week-ends et jours de repos ne sont pas comptés comme des absences.</li>
              <li>Positionnez votre adresse sur la carte pour définir le <strong>périmètre GPS</strong> (rayon de 30 à 50 mètres autour du bâtiment de travail).</li>
            </ol>
          </section>

          <section id="company-code" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              13. Gestion du Code de Stage Entreprise
            </h2>
            <p>
              Chaque entreprise inscrite dispose d'un <strong>Code de Stage Unique</strong> affiché en tête de son tableau de bord (ex : <code>STAGE-NOMENTREPRISE</code> ou <code>STG-XXXXXX</code>) :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Communiquez ce code à chaque nouveau stagiaire accueilli au sein de vos équipes.</li>
              <li>Dès que le stagiaire saisit ce code sur son smartphone et valide la convention, il apparaît automatiquement dans votre liste de stagiaires actifs.</li>
              <li>Aucune création manuelle de compte ni échange complexe de fichiers papier n'est nécessaire.</li>
            </ul>
          </section>

          <section id="company-supervision" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              14. Supervision des Présences & Ponctualité en Temps Réel
            </h2>
            <p>
              Depuis l'onglet <strong>Suivi des Stagiaires</strong> de la console entreprise, le tuteur dispose d'un contrôle transparent :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li><strong>Présence en direct :</strong> Visualisez instantanément qui est actuellement présent au bureau et qui est absent.</li>
              <li><strong>Ponctualité :</strong> Le système indique l'heure exacte d'arrivée et calcule automatiquement le nombre de minutes de retard éventuelles.</li>
              <li><strong>Taux d'assiduité mensuel :</strong> Calcul automatique du pourcentage de présence sur les jours ouvrés du mois.</li>
              <li><strong>Lecture des carnets de bord :</strong> Consultez chaque soir les résumés des activités consignées par chaque stagiaire pour apprécier leur travail.</li>
            </ul>
          </section>

          <section id="company-evaluations" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              15. Suivi Pédagogique & Validation des Étapes
            </h2>
            <p>
              Au fil des mois d'immersion, le tuteur encadre l'évolution du stagiaire :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Sur la fiche du stagiaire, validez l'avancement de l'étape <em>Bilan Mi-parcours</em> (75 %) après avoir conduit l'entretien intermédiaire.</li>
              <li>Validez l'étape <em>Rapport de Stage</em> (90 %) après réception et relecture du document de synthèse.</li>
              <li>Vous pouvez ajouter des remarques et appréciations pédagogiques directement transmises sur le profil du stagiaire.</li>
            </ul>
          </section>

          <section id="company-certificate" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              16. Clôture de Stage & Délivrance du Certificat Officiel avec QR Code
            </h2>
            <p>
              À l'échéance du stage, l'entreprise délivre l'attestation numérique certifiée :
            </p>
            <ol style={{ paddingLeft: '24px', margin: '12px 0 16px', lineHeight: 1.8 }}>
              <li>Sur la fiche du stagiaire, appuyez sur <strong>« Clôturer le stage & Délivrer le Certificat »</strong>.</li>
              <li>Choisissez la mention méritée :
                <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                  <li><em>Assiduité Exemplaire</em> (pour un taux de présence supérieur à 95 %)</li>
                  <li><em>Mention Très Bien</em></li>
                  <li><em>Félicitations du Tuteur</em></li>
                  <li><em>Stage Validé avec Succès</em></li>
                </ul>
              </li>
              <li>Rédigez l'appréciation globale sur la qualité du travail et le professionnalisme démontré.</li>
              <li>Validez l'émission : le document est généré et horodaté instantanément.</li>
            </ol>

            <p style={{ color: '#475569', fontSize: '14px', marginTop: '12px' }}>
              <strong>Authenticité par QR Code infalsifiable :</strong> Le certificat émis porte un QR Code officiel infalsifiable. Tout futur recruteur scannant ce code est redirigé vers une page publique de vérification SAMRE qui confirme sans ambiguïté les dates réelles du stage, le nom de votre entreprise, le total des heures effectuées et la mention attribuée.
            </p>
          </section>

          <section id="company-offers" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              17. Publication d'Offres d'Emploi & Gestion des Candidatures
            </h2>
            <p>
              L'entreprise peut publier ses opportunités de recrutement :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Rédigez le titre de l'offre, les missions, les compétences recherchées et le niveau de qualification souhaité.</li>
              <li>Définissez la rémunération ou indemnité éventuelle et le lieu de travail.</li>
              <li>Recevez les candidatures dans votre espace de gestion, consultez les CV des postulants et modifiez les statuts (<em>En attente</em>, <em>Retenu pour entretien</em>, <em>Accepté</em>, <em>Refusé</em>).</li>
            </ul>
          </section>

          <section id="company-branding" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              18. Bannières Publicitaires & Visibilité de Marque
            </h2>
            <p>
              Les entreprises peuvent valoriser leurs activités sur la plateforme SAMRE à travers des bannières visibles sur l'application mobile et le portail web. Les demandes d'affichage sont soumises à la modération pour garantir la conformité aux standards de la plateforme.
            </p>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PARTIE 4 : GUIDE VISITEUR & SERVICES PARTENAIRES             */}
          {/* ═════════════════════════════════════════════════════════════ */}

          <section id="visitor-events" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              19. Événements Professionnels, Salons & Billetterie QR Code
            </h2>
            <p>
              Le catalogue <strong>Événements</strong> recense les rendez-vous professionnels (salons pour l'emploi, masterclasses, ateliers de formation et conférences) :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Consultez la date, le lieu, le programme des interventions et les intervenants.</li>
              <li>Réservez votre place en ligne et recevez un <strong>e-ticket électronique doté d'un QR Code sécurisé</strong>.</li>
              <li>À l'entrée de l'événement, présentez votre smartphone : le personnel d'accueil scanne votre billet pour valider votre admission.</li>
            </ul>
          </section>

          <section id="visitor-barter" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              20. Place de Marché de Troc & Échange de Compétences B2B
            </h2>
            <p>
              Le module <strong>Troc de Services</strong> permet aux indépendants, créateurs d'entreprises et professionnels de collaborer sans décaissement de trésorerie :
            </p>
            <ul style={{ paddingLeft: '24px', margin: '12px 0 16px' }}>
              <li>Publiez une offre de service basée sur votre expertise (ex : <em>« Conception graphique de logo »</em> ou <em>« Traduction de documents »</em>).</li>
              <li>Indiquez la compétence recherchée en contrepartie (ex : <em>« Création de site web »</em> ou <em>« Conseil juridique »</em>).</li>
              <li>Échangez directement avec vos pairs et validez la réalisation des prestations mutuelles.</li>
            </ul>
          </section>

          <section id="visitor-surveys" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              21. Sondages d'Opinion & Portefeuille de Récompenses
            </h2>
            <p>
              Participez aux enquêtes sur les tendances du marché du travail, l'orientation professionnelle et les besoins des recruteurs. Vos réponses vous permettent de cumuler des points convertibles dans votre portefeuille numérique SAMRE.
            </p>
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* PARTIE 5 : QUESTIONS FRÉQUENTES (FAQ)                        */}
          {/* ═════════════════════════════════════════════════════════════ */}

          <section id="faq-candidats" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              22. FAQ Candidats & Stagiaires
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Que faire si le pointage automatique ne s'est pas déclenché ce matin ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Ouvrez l'application et appuyez sur le bouton <strong>« Pointer mon arrivée (GPS) »</strong> dans l'onglet Aujourd'hui. Vérifiez que la localisation de votre téléphone est activée et réglée sur <em>« Toujours autoriser »</em> dans les paramètres de votre appareil.
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  J'ai oublié de consigner mes missions hier, puis-je rattraper aujourd'hui ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Oui. Dans l'onglet <strong>Calendrier</strong>, appuyez sur la date d'hier puis cliquez sur <strong>« Consigner / Modifier mes activités »</strong> pour enregistrer votre résumé.
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Comment télécharger ma convention signée ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Rendez-vous dans l'onglet <strong>Convention & Dossier</strong> ou cliquez sur l'icône rouge PDF en haut de l'écran, puis appuyez sur <strong>« Télécharger ma convention (PDF) »</strong>.
                </div>
              </div>
            </div>
          </section>

          <section id="faq-entreprises" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              23. FAQ Entreprises & Tuteurs
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Comment transmettre le code de stage à mes stagiaires ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Votre code unique est affiché en haut de votre tableau de bord entreprise. Il suffit de le transmettre à vos stagiaires lors de leur premier jour. Dès qu'ils l'entrent dans leur téléphone, ils sont reliés à votre console.
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Comment le système gère-t-il les retards ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Si un stagiaire arrive après l'heure d'embauche plus la tolérance configurée (ex : 08h15 pour un horaire de 08h00 avec 15 min de tolérance), son arrivée est enregistrée avec le nombre exact de minutes de retard. Cela est répercuté automatiquement sur son assiduité globale.
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Comment un tiers ou futur recruteur vérifie-t-il le certificat de stage ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Chaque certificat officiel intègre un QR Code cryptographique. En scannant ce code avec n'importe quel smartphone, le recruteur accède à une page officielle certifiant les dates réelles, le nom de l'entreprise et la mention obtenue.
                </div>
              </div>
            </div>
          </section>

          <section id="faq-visiteurs" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              24. FAQ Visiteurs & Support Technique
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Que faire si je ne reçois pas le code SMS lors de la connexion ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Vérifiez que vous avez sélectionné le bon indicatif pays. Si le SMS tarde, patientez jusqu'à l'expiration du compte à rebours de 60 secondes et cliquez sur « Renvoyer le code ».
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Puis-je changer de profil après mon inscription ?
                </div>
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  Si vous êtes visiteur et souhaitez devenir candidat ou entreprise, vous pouvez faire évoluer votre compte depuis le menu Profil & Paramètres ou contacter le support SAMRE.
                </div>
              </div>
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
            <span>Documentation Officielle Utilisateur</span>
          </div>

        </main>

      </div>

      <style>{`
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
          header, aside, .docs-sidebar, .mobile-menu-btn {
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
