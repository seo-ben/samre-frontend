import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MainLayout } from '../components/layout/MainLayout';
import apiClient from '../lib/apiClient';
import {
  UserCog, Plus, Search, Shield, Mail, Phone,
  CheckCircle2, XCircle, Trash2, Edit, AlertCircle, Loader2,
  RefreshCw, AlertTriangle, Layers, ChevronDown, ChevronUp, ChevronRight,
  LayoutDashboard, Users, Building2, Briefcase, CalendarDays, FileText,
  BadgeCheck, Vote, Handshake, Wallet, Star, Bell, BarChart3, Settings,
  Eye, CheckSquare, Square, ShieldCheck, KeyRound, ArrowRight, ArrowLeft,
  SlidersHorizontal, Sparkles, Filter, Check, X,
  Folder, FolderOpen, Minus, ListTree
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';

// Définition globale des actions possibles
export const ACTION_DEFINITIONS = {
  view: { label: 'Consulter', desc: 'Lecture et affichage', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  create: { label: 'Créer', desc: 'Ajouter des éléments', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  edit: { label: 'Modifier', desc: 'Éditer et mettre à jour', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  validate: { label: 'Valider', desc: 'Approuver ou rejeter', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  suspend: { label: 'Suspendre', desc: 'Bloquer / Débloquer', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  delete: { label: 'Supprimer', desc: 'Suppression définitive', color: 'bg-red-50 text-red-700 border-red-200' },
  export: { label: 'Exporter', desc: 'Télécharger CSV/Excel', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  adjust: { label: 'Créditer / Débiter', desc: 'Ajuster les soldes portefeuilles', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  payout: { label: 'Déclencher virement', desc: 'Virement vers compte personnel (Payouts Zayono)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  configure_payout: { label: 'Paramétrer virement', desc: 'Calendrier et conditions de virement auto', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  cancel: { label: 'Révoquer / Annuler', desc: 'Révoquer un abonnement actif', color: 'bg-rose-50 text-rose-800 border-rose-300' },
};

// Structure complète des Modules, Sous-menus et Actions par page
export const ADMIN_MODULES_CONFIG = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
    description: 'KPIs globaux, statistiques en direct et graphiques d\'activité',
    pages: [
      {
        path: '/dashboard',
        label: 'Vue d\'ensemble générale',
        allowedActions: ['view', 'export'],
        actionDetails: {
          view: { label: 'Consulter dashboard', desc: 'Afficher les métriques et graphiques' },
          export: { label: 'Exporter statistiques', desc: 'Téléchargement des rapports' }
        }
      }
    ]
  },
  {
    id: 'users',
    label: 'Utilisateurs & Profils',
    icon: Users,
    description: 'Candidats, Secrétaires, Visiteurs et profils enregistrés',
    pages: [
      {
        path: '/users',
        label: 'Gestion des Utilisateurs',
        allowedActions: ['view', 'edit', 'suspend', 'delete', 'export'],
        actionDetails: {
          view: { label: 'Consulter utilisateurs', desc: 'Afficher la liste et fiches' },
          edit: { label: 'Modifier profil', desc: 'Bouton d\'édition de profil' },
          suspend: { label: 'Suspendre / Réactiver', desc: 'Bloquer ou débloquer un compte' },
          delete: { label: 'Supprimer compte', desc: 'Suppression définitive' },
          export: { label: 'Exporter liste', desc: 'Télécharger la liste CSV' }
        }
      }
    ]
  },
  {
    id: 'companies',
    label: 'Entreprises & Viabilité',
    icon: Building2,
    description: 'Comptes employeurs, cabinets de recrutement et vérification',
    pages: [
      {
        path: '/companies',
        label: 'Entreprises & Viabilité',
        allowedActions: ['view', 'validate', 'edit', 'suspend', 'delete'],
        actionDetails: {
          view: { label: 'Consulter entreprises', desc: 'Afficher les fiches entreprises' },
          validate: { label: 'Certifier viabilité', desc: 'Bouton bascule de certification' },
          edit: { label: 'Offres internationales', desc: 'Bouton autorisation internationale' },
          suspend: { label: 'Suspendre entreprise', desc: 'Bloquer l\'accès employeur' },
          delete: { label: 'Supprimer entreprise', desc: 'Supprimer le compte entreprise' }
        }
      }
    ]
  },
  {
    id: 'offers',
    label: 'Offres d\'emploi',
    icon: Briefcase,
    description: 'Modération, validation et gestion des offres d\'emploi et de stages',
    pages: [
      {
        path: '/offers',
        label: 'Toutes les offres',
        allowedActions: ['view', 'create', 'edit', 'delete'],
        actionDetails: {
          view: { label: 'Consulter offres', desc: 'Afficher la liste' },
          create: { label: 'Nouvelle offre', desc: 'Bouton « Nouvelle offre »' },
          edit: { label: 'Modifier offre', desc: 'Bouton modifier' },
          delete: { label: 'Supprimer offre', desc: 'Bouton supprimer' }
        }
      },
      {
        path: '/offers/pending',
        label: 'Offres en attente',
        allowedActions: ['view', 'validate', 'delete'],
        actionDetails: {
          view: { label: 'Consulter en attente', desc: 'Afficher les offres soumises' },
          validate: { label: 'Approuver / Rejeter', desc: 'Valider ou refuser l\'offre' },
          delete: { label: 'Supprimer offre', desc: 'Suppression' }
        }
      },
      { path: '/offers/approved', label: 'Offres validées', allowedActions: ['view', 'edit', 'delete'] },
      { path: '/offers/expired', label: 'Offres expirées', allowedActions: ['view', 'edit', 'delete'] },
      { path: '/offers/deleted', label: 'Offres supprimées', allowedActions: ['view', 'delete'] }
    ]
  },
  {
    id: 'events',
    label: 'Événements & Salons',
    icon: CalendarDays,
    description: 'Gestion des salons professionnels, billetterie et webinaires',
    pages: [
      {
        path: '/events',
        label: 'Tous les événements',
        allowedActions: ['view', 'create', 'edit', 'validate', 'delete'],
        actionDetails: {
          view: { label: 'Consulter événements', desc: 'Afficher la liste' },
          create: { label: 'Nouvel événement', desc: 'Bouton « Créer un événement »' },
          edit: { label: 'Modifier événement', desc: 'Édition des détails' },
          validate: { label: 'Valider / Pause / Rejeter', desc: 'Modération de statut' },
          delete: { label: 'Supprimer événement', desc: 'Suppression' }
        }
      },
      { path: '/events/pending', label: 'Événements en attente', allowedActions: ['view', 'validate', 'delete'] },
      { path: '/events/approved', label: 'Événements validés', allowedActions: ['view', 'edit', 'delete'] },
      { path: '/events/expired', label: 'Événements expirés', allowedActions: ['view', 'delete'] },
      { path: '/events/deleted', label: 'Événements supprimés', allowedActions: ['view', 'delete'] },
      { path: '/events/categories', label: 'Catégories d\'événements', allowedActions: ['view', 'create', 'edit', 'delete'] }
    ]
  },
  {
    id: 'applications',
    label: 'Candidatures & Embauches',
    icon: FileText,
    description: 'Dossiers postulants, suivi des étapes et déclarations d\'embauche',
    pages: [
      { path: '/applications', label: 'Toutes les candidatures', allowedActions: ['view', 'export'] },
      { path: '/applications/by-status', label: 'Candidatures par statut', allowedActions: ['view', 'export'] },
      { path: '/applications/by-offer', label: 'Candidatures par offre', allowedActions: ['view', 'export'] },
      {
        path: '/hiring-declarations',
        label: 'Déclarations d\'embauche',
        allowedActions: ['view', 'validate', 'export'],
        actionDetails: {
          view: { label: 'Consulter déclarations', desc: 'Afficher les déclarations reçues' },
          validate: { label: 'Valider embauche', desc: 'Bouton « Valider l\'embauche »' },
          export: { label: 'Exporter CSV', desc: 'Télécharger les déclarations' }
        }
      }
    ]
  },
  {
    id: 'badges',
    label: 'Badges & Vérifications KYC',
    icon: BadgeCheck,
    description: 'Contrôle des pièces d\'identité, diplômes et badges officiels',
    pages: [
      {
        path: '/badges/pending',
        label: 'Demandes de badges en attente',
        allowedActions: ['view', 'validate'],
        actionDetails: {
          view: { label: 'Examiner dossiers', desc: 'Voir les justificatifs' },
          validate: { label: 'Valider / Attribuer badge', desc: 'Bouton valider ou rejeter' }
        }
      },
      { path: '/badges/candidates', label: 'Secrétaires vérifiées', allowedActions: ['view', 'validate'] },
      { path: '/badges/companies', label: 'Entreprises vérifiées', allowedActions: ['view', 'validate'] }
    ]
  },
  {
    id: 'surveys',
    label: 'Sondages & Enquêtes',
    icon: Vote,
    description: 'Questionnaires, baromètres et enquêtes d\'opinion',
    pages: [
      {
        path: '/surveys',
        label: 'Gestion des sondages',
        allowedActions: ['view', 'create', 'edit', 'delete', 'export'],
        actionDetails: {
          view: { label: 'Consulter sondages', desc: 'Afficher les sondages' },
          create: { label: 'Créer un sondage', desc: 'Bouton « Créer un sondage »' },
          edit: { label: 'Modifier sondage', desc: 'Bouton modifier' },
          delete: { label: 'Supprimer sondage', desc: 'Bouton corbeille' },
          export: { label: 'Exporter résultats', desc: 'Bouton exporter' }
        }
      }
    ]
  },
  {
    id: 'service-exchanges',
    label: 'Partenariats B2B (Troc)',
    icon: Handshake,
    description: 'Échanges inter-entreprises, prestations et collaborations',
    pages: [
      {
        path: '/service-exchanges',
        label: 'Bourse d\'échanges B2B',
        allowedActions: ['view', 'validate', 'delete'],
        actionDetails: {
          view: { label: 'Consulter annonces', desc: 'Afficher la bourse de troc' },
          validate: { label: 'Valider / Rejeter', desc: 'Bouton valider ou refuser' },
          delete: { label: 'Supprimer annonce', desc: 'Bouton supprimer' }
        }
      }
    ]
  },
  {
    id: 'finances',
    label: 'Finances & Wallets',
    icon: Wallet,
    description: 'Portefeuilles électroniques, transactions et comptabilité',
    pages: [
      {
        path: '/finances',
        label: 'Vue d\'ensemble financière',
        allowedActions: ['view', 'payout', 'configure_payout', 'adjust', 'export'],
        actionDetails: {
          view: { label: 'Consulter finances', desc: 'Affichage des métriques et soldes' },
          payout: { label: 'Déclencher un virement', desc: 'Bouton « Déclencher un virement » vers compte perso' },
          configure_payout: { label: 'Paramétrer virement', desc: 'Bouton « Paramétrer le calendrier »' },
          adjust: { label: 'Créditer / Débiter', desc: 'Boutons d\'ajustement de solde portefeuille' },
          export: { label: 'Exporter bilan', desc: 'Téléchargement des rapports' }
        }
      },
      {
        path: '/wallets',
        label: 'Portefeuilles (Wallets)',
        allowedActions: ['view', 'adjust', 'export'],
        actionDetails: {
          view: { label: 'Consulter portefeuilles', desc: 'Affichage des soldes des utilisateurs' },
          adjust: { label: 'Créditer / Débiter', desc: 'Boutons vert/rouge « Créditer » et « Débiter »' },
          export: { label: 'Exporter soldes', desc: 'Télécharger la liste des soldes' }
        }
      },
      {
        path: '/transactions',
        label: 'Historique des transactions',
        allowedActions: ['view', 'export'],
        actionDetails: {
          view: { label: 'Consulter transactions', desc: 'Historique des paiements' },
          export: { label: 'Export CSV', desc: 'Bouton « Export CSV »' }
        }
      }
    ]
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    icon: Star,
    description: 'Formules d\'adhésion, abonnés actifs et facturation',
    pages: [
      {
        path: '/subscriptions/control-center',
        label: 'Centre de contrôle',
        allowedActions: ['view', 'edit'],
        actionDetails: {
          view: { label: 'Consulter centre', desc: 'Affichage des règles de déblocage' },
          edit: { label: 'Enregistrer tarifs', desc: 'Bouton « Enregistrer les modifications »' }
        }
      },
      {
        path: '/subscriptions/plans',
        label: 'Plans d\'abonnement',
        allowedActions: ['view', 'create', 'edit', 'delete'],
        actionDetails: {
          view: { label: 'Consulter plans', desc: 'Afficher les formules d\'adhésion' },
          create: { label: 'Créer un plan', desc: 'Bouton bleu « Créer un plan »' },
          edit: { label: 'Modifier plan', desc: 'Bouton crayon d\'édition du plan' },
          delete: { label: 'Supprimer plan', desc: 'Bouton corbeille de suppression' }
        }
      },
      {
        path: '/subscriptions/active',
        label: 'Abonnés actifs',
        allowedActions: ['view', 'cancel'],
        actionDetails: {
          view: { label: 'Consulter abonnés', desc: 'Affichage des abonnements en cours' },
          cancel: { label: 'Révoquer abonnement', desc: 'Bouton rouge « Révoquer »' }
        }
      },
      {
        path: '/subscriptions/history',
        label: 'Historique des abonnements',
        allowedActions: ['view', 'cancel', 'export'],
        actionDetails: {
          view: { label: 'Consulter historique', desc: 'Historique des souscriptions' },
          cancel: { label: 'Révoquer abonnement', desc: 'Bouton « Révoquer » si actif' },
          export: { label: 'Exporter historique', desc: 'Téléchargement de l\'historique' }
        }
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications & Modération',
    icon: Bell,
    description: 'Campagnes Push, modération des signalements et demandes spéciales',
    pages: [
      {
        path: '/special-requests',
        label: 'Demandes spéciales entreprises',
        allowedActions: ['view', 'validate'],
        actionDetails: {
          view: { label: 'Consulter demandes', desc: 'Demandes spéciales reçues' },
          validate: { label: 'Traiter décision', desc: 'Bouton « Enregistrer la décision »' }
        }
      },
      {
        path: '/moderation/reports',
        label: 'Modération & Signalements',
        allowedActions: ['view', 'validate', 'delete'],
        actionDetails: {
          view: { label: 'Consulter signalements', desc: 'Afficher les signalements' },
          validate: { label: 'Traiter / Classer', desc: 'Sanctionner ou classer sans suite' },
          delete: { label: 'Supprimer contenu', desc: 'Supprimer le contenu signalé' }
        }
      },
      {
        path: '/notifications',
        label: 'Centre Notifications Push',
        allowedActions: ['view', 'create', 'delete'],
        actionDetails: {
          view: { label: 'Consulter notifications', desc: 'Historique des notifications' },
          create: { label: 'Créer campagne Push', desc: 'Bouton « Créer une campagne Push »' },
          delete: { label: 'Supprimer notification', desc: 'Bouton supprimer' }
        }
      }
    ]
  },
  {
    id: 'cms',
    label: 'CMS — Contenu',
    icon: Layers,
    description: 'Pages dynamiques CGU, publicités, bannières, langues et zones',
    pages: [
      { path: '/cms/ads', label: 'Pages publicitaires', allowedActions: ['view', 'create', 'edit', 'delete'] },
      { path: '/cms/company-banners', label: 'Bannières Dashboard', allowedActions: ['view', 'create', 'edit', 'delete'] },
      {
        path: '/cms/pages',
        label: 'Pages dynamiques (CGU, etc.)',
        allowedActions: ['view', 'create', 'edit', 'delete'],
        actionDetails: {
          view: { label: 'Consulter pages', desc: 'Affichage des pages' },
          create: { label: 'Nouvelle page', desc: 'Bouton « Créer une page »' },
          edit: { label: 'Modifier contenu', desc: 'Bouton modifier' },
          delete: { label: 'Supprimer page', desc: 'Bouton supprimer' }
        }
      },
      { path: '/cms/languages', label: 'Langues supportées', allowedActions: ['view', 'create', 'edit', 'delete'] },
      { path: '/cms/translations', label: 'Traductions App mobile', allowedActions: ['view', 'edit'] },
      { path: '/cms/locations', label: 'Zones géographiques', allowedActions: ['view', 'create', 'edit', 'delete'] },
      { path: '/cms/suggested-locations', label: 'Zones suggérées', allowedActions: ['view', 'validate', 'delete'] },
      { path: '/cms/categories', label: 'Catégories métiers', allowedActions: ['view', 'create', 'edit', 'delete'] },
      { path: '/cms/quotas', label: 'Paramètres & Quotas', allowedActions: ['view', 'edit'] },
      { path: '/cms/blur', label: 'Champs floutés', allowedActions: ['view', 'edit'] }
    ]
  },
  {
    id: 'stats',
    label: 'Statistiques & Analytics',
    icon: BarChart3,
    description: 'Rapports détaillés, exports comptables et métriques RH',
    pages: [
      { path: '/stats', label: 'Tableau Analytique', allowedActions: ['view'] },
      { path: '/stats/exports', label: 'Rapports & Exports CSV', allowedActions: ['view', 'export'] }
    ]
  },
  {
    id: 'audit-logs',
    label: 'Journal d\'audit & Sécurité',
    icon: ShieldCheck,
    description: 'Historique des connexions, modifications et actions admin',
    pages: [
      { path: '/audit-logs', label: 'Journal d\'audit de sécurité', allowedActions: ['view', 'export'] }
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    description: 'Gestion de l\'équipe d\'administration et permissions',
    pages: [
      {
        path: '/settings/staff',
        label: 'Comptes administrateurs & Droits',
        allowedActions: ['view', 'create', 'edit', 'suspend', 'delete'],
        actionDetails: {
          view: { label: 'Consulter staff', desc: 'Afficher les administrateurs' },
          create: { label: 'Créer administrateur', desc: 'Bouton « Créer un administrateur »' },
          edit: { label: 'Modifier droits', desc: 'Bouton d\'édition des droits' },
          suspend: { label: 'Suspendre / Réactiver', desc: 'Suspendre l\'accès au panel' },
          delete: { label: 'Supprimer administrateur', desc: 'Suppression de compte' }
        }
      }
    ]
  }
];

// Liste plate de toutes les routes et actions par défaut
const ALL_ROUTES = ADMIN_MODULES_CONFIG.flatMap(m => m.pages.map(p => p.path));

const ALL_ACTIONS_MAP = {};
ADMIN_MODULES_CONFIG.forEach(mod => {
  mod.pages.forEach(p => {
    ALL_ACTIONS_MAP[p.path] = [...p.allowedActions];
  });
});

export const StaffManagementPage = () => {
  const { can } = useAuth();
  const canCreate = can('create', '/settings/staff');
  const canEdit = can('edit', '/settings/staff');
  const canSuspend = can('suspend', '/settings/staff') || can('edit', '/settings/staff');
  const canDelete = can('delete', '/settings/staff');

  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'permissions'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' ou id du module
  const [moduleSearch, setModuleSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState(() => {
    const init = {};
    ADMIN_MODULES_CONFIG.forEach(m => { init[m.id] = true; });
    return init;
  });
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Permissions state
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [selectedActions, setSelectedActions] = useState({});

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    staff: null,
    loading: false,
  });

  // Identity Form State
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
      console.error('Erreur chargement staff:', err);
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
    setActiveTab('identity');
    setSelectedCategory('all');
    setModuleSearch('');
    const allExp = {};
    ADMIN_MODULES_CONFIG.forEach(m => { allExp[m.id] = true; });
    setExpandedModules(allExp);
    // Par défaut, donner accès complet à tout
    setSelectedRoutes([...ALL_ROUTES]);
    setSelectedActions(JSON.parse(JSON.stringify(ALL_ACTIONS_MAP)));

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
    setActiveTab('identity');
    setSelectedCategory('all');
    setModuleSearch('');
    const allExp = {};
    ADMIN_MODULES_CONFIG.forEach(m => { allExp[m.id] = true; });
    setExpandedModules(allExp);

    const hasExplicitRoutes = Array.isArray(staff.allowed_routes) && !staff.allowed_routes.includes('*');
    const existingRoutes = hasExplicitRoutes
      ? [...staff.allowed_routes]
      : (staff.allowed_routes?.includes('*') || staff.role?.name === 'super_admin' ? [...ALL_ROUTES] : ['/dashboard']);
    setSelectedRoutes(existingRoutes);

    // Charger les actions ou initialiser
    if (staff.allowed_actions && typeof staff.allowed_actions === 'object' && !Array.isArray(staff.allowed_actions)) {
      setSelectedActions(staff.allowed_actions);
    } else {
      const acts = {};
      existingRoutes.forEach(r => {
        acts[r] = ALL_ACTIONS_MAP[r] ? [...ALL_ACTIONS_MAP[r]] : ['view'];
      });
      setSelectedActions(acts);
    }

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

  // ── Presets rapides ──
  const applyFullAccessPreset = () => {
    setSelectedRoutes([...ALL_ROUTES]);
    setSelectedActions(JSON.parse(JSON.stringify(ALL_ACTIONS_MAP)));
  };

  const applyReadOnlyPreset = () => {
    setSelectedRoutes([...ALL_ROUTES]);
    const readOnlyActions = {};
    ALL_ROUTES.forEach(r => {
      readOnlyActions[r] = ['view'];
    });
    setSelectedActions(readOnlyActions);
  };

  const applyModeratorPreset = () => {
    setSelectedRoutes([...ALL_ROUTES]);
    const modActions = {};
    ADMIN_MODULES_CONFIG.forEach(mod => {
      mod.pages.forEach(p => {
        const allowed = p.allowedActions.filter(a => ['view', 'validate', 'edit'].includes(a));
        modActions[p.path] = allowed.length > 0 ? allowed : ['view'];
      });
    });
    setSelectedActions(modActions);
  };

  const applyClearAllPreset = () => {
    setSelectedRoutes([]);
    setSelectedActions({});
  };

  // ── Toggle Page ──
  const handleTogglePageRoute = (path) => {
    if (selectedRoutes.includes(path)) {
      setSelectedRoutes(prev => prev.filter(p => p !== path));
      setSelectedActions(prev => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    } else {
      setSelectedRoutes(prev => [...prev, path]);
      const defaultActions = ALL_ACTIONS_MAP[path] ? [...ALL_ACTIONS_MAP[path]] : ['view'];
      setSelectedActions(prev => ({ ...prev, [path]: defaultActions }));
    }
  };

  // ── Toggle Action Spécifique pour une Page ──
  const handleTogglePageAction = (path, actionId) => {
    const currentActions = selectedActions[path] || [];
    let updatedActions;

    if (currentActions.includes(actionId)) {
      updatedActions = currentActions.filter(a => a !== actionId);
    } else {
      updatedActions = [...currentActions, actionId];
    }

    setSelectedActions(prev => ({
      ...prev,
      [path]: updatedActions,
    }));
  };

  // ── Toggle Module complet ──
  const handleToggleModule = (mod) => {
    const modPaths = mod.pages.map(p => p.path);
    const allChecked = modPaths.every(p => selectedRoutes.includes(p));

    if (allChecked) {
      setSelectedRoutes(prev => prev.filter(p => !modPaths.includes(p)));
      setSelectedActions(prev => {
        const next = { ...prev };
        modPaths.forEach(p => delete next[p]);
        return next;
      });
    } else {
      setSelectedRoutes(prev => Array.from(new Set([...prev, ...modPaths])));
      setSelectedActions(prev => {
        const next = { ...prev };
        mod.pages.forEach(p => {
          next[p.path] = [...p.allowedActions];
        });
        return next;
      });
    }
  };

  // ── Contrôles Arborescence (Déplier / Replier) ──
  const toggleModuleExpanded = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const expandAllModules = () => {
    const allExp = {};
    ADMIN_MODULES_CONFIG.forEach(m => { allExp[m.id] = true; });
    setExpandedModules(allExp);
  };

  const collapseAllModules = () => {
    setExpandedModules({});
  };

  // Auto-déplier lors d'une recherche
  useEffect(() => {
    if (moduleSearch.trim()) {
      const q = moduleSearch.toLowerCase();
      const exp = {};
      ADMIN_MODULES_CONFIG.forEach(m => {
        const matches = m.label.toLowerCase().includes(q) ||
          m.pages.some(p => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
        if (matches) exp[m.id] = true;
      });
      setExpandedModules(prev => ({ ...prev, ...exp }));
    }
  }, [moduleSearch]);

  // ── Soumission du Formulaire ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (!formData.first_name?.trim() || !formData.last_name?.trim()) {
        setError('Le prénom et le nom de famille sont obligatoires.');
        setActiveTab('identity');
        setSubmitting(false);
        return;
      }

      if (!editingStaff) {
        if (!formData.email?.trim()) {
          setError("L'adresse email professionnelle est obligatoire.");
          setActiveTab('identity');
          setSubmitting(false);
          return;
        }
        if (!formData.phone?.trim()) {
          setError("Le numéro de téléphone est obligatoire.");
          setActiveTab('identity');
          setSubmitting(false);
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères.");
          setActiveTab('identity');
          setSubmitting(false);
          return;
        }
        if (!formData.role_id) {
          setError("Veuillez sélectionner un rôle de base pour cet administrateur.");
          setActiveTab('identity');
          setSubmitting(false);
          return;
        }
      }

      if (selectedRoutes.length === 0) {
        setError("Veuillez autoriser au moins une page d'accès pour cet administrateur.");
        setActiveTab('permissions');
        setSubmitting(false);
        return;
      }

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role_id: Number(formData.role_id),
        allowed_routes: selectedRoutes,
        allowed_actions: selectedActions,
      };

      if (editingStaff) {
        await apiClient.put(`/v1/admin/staff/${editingStaff.id}`, payload);
        showSuccess('Compte et matrice des droits mis à jour avec succès.');
      } else {
        await apiClient.post('/v1/admin/staff', {
          ...payload,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          country_id: formData.country_id ? Number(formData.country_id) : undefined,
          password: formData.password,
        });
        showSuccess('Nouveau collaborateur créé avec ses autorisations configurées.');
      }

      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      console.error('Erreur soumission staff:', err);
      const resData = err.response?.data;
      let msg = resData?.message || 'Erreur lors de l\'enregistrement.';

      if (resData?.errors && typeof resData.errors === 'object') {
        const fieldErrors = Object.entries(resData.errors).map(([field, fieldMsgs]) => {
          const text = Array.isArray(fieldMsgs) ? fieldMsgs.join(' ') : String(fieldMsgs);
          if (field === 'email' && text.toLowerCase().includes('taken')) return "Cette adresse email est déjà enregistrée.";
          if (field === 'phone' && text.toLowerCase().includes('taken')) return "Ce numéro de téléphone est déjà utilisé.";
          if (field === 'password' && (text.toLowerCase().includes('min') || text.toLowerCase().includes('least'))) return "Le mot de passe doit comporter au moins 6 caractères.";
          if (field === 'role_id') return "Le rôle sélectionné est invalide.";
          return text;
        });

        if (fieldErrors.length > 0) {
          msg = fieldErrors.join(' • ');
        }

        const identityFields = ['email', 'phone', 'password', 'first_name', 'last_name', 'role_id'];
        if (Object.keys(resData.errors).some(k => identityFields.includes(k))) {
          setActiveTab('identity');
        }
      }

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation Actions (Suspend, Delete, Reactivate) ──
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
      alert(err.response?.data?.message || 'Une erreur est survenue.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Modules filtrés par recherche et catégorie
  const displayedModules = useMemo(() => {
    let list = ADMIN_MODULES_CONFIG;
    if (selectedCategory !== 'all') {
      list = list.filter(m => m.id === selectedCategory);
    }
    if (moduleSearch.trim()) {
      const q = moduleSearch.toLowerCase();
      list = list.filter(m =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.pages.some(p => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, moduleSearch]);

  // Total des actions accordées
  const totalActiveActionsCount = useMemo(() => {
    return Object.values(selectedActions).reduce((acc, acts) => acc + (acts?.length || 0), 0);
  }, [selectedActions]);

  // Filtrage du tableau principal
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

        {/* ── En-tête Supérieur ── */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl shadow-xs">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comptes Administrateurs & Droits d'Accès</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Attribuez des autorisations sur-mesure : pages accessibles et actions spécifiques autorisées
              </p>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
            >
              <Plus size={18} />
              <span>Créer un administrateur</span>
            </button>
          )}
        </div>

        {/* ── Alertes & Notifications ── */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && !showModal && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={18} className="text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Barre de Filtres & Recherche ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, email ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les rôles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>

            <button
              onClick={fetchInitialData}
              disabled={loading}
              title="Rafraîchir"
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Tableau du Personnel (Aucun ID technique affiché) ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Administrateur</th>
                    <th className="px-4 py-2.5">Rôle</th>
                    <th className="px-4 py-2.5">Pages & Actions Autorisées</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredStaff.map((staff) => {
                    const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Admin';
                    const isSuspended = staff.user?.status === 'suspended';
                    const roleName = staff.role?.name || 'Administrateur';
                    const hasExplicitRoutes = Array.isArray(staff.allowed_routes) && !staff.allowed_routes.includes('*');
                    const hasFullAccess = !hasExplicitRoutes && (staff.role?.name === 'super_admin' || !staff.allowed_routes || staff.allowed_routes?.includes('*'));
                    const countPages = hasFullAccess ? ALL_ROUTES.length : (staff.allowed_routes?.length || 0);

                    let countActions = 0;
                    if (hasFullAccess) {
                      countActions = Object.values(ALL_ACTIONS_MAP).reduce((acc, acts) => acc + acts.length, 0);
                    } else if (staff.allowed_actions && typeof staff.allowed_actions === 'object') {
                      countActions = Object.values(staff.allowed_actions).reduce((acc, acts) => acc + (acts?.length || 0), 0);
                    } else {
                      countActions = countPages * 2;
                    }

                    return (
                      <tr key={staff.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                              {staff.first_name?.[0]?.toUpperCase()}{staff.last_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 truncate">{fullName}</div>
                              <div className="text-[11px] text-gray-400 font-medium truncate">{staff.user?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Shield size={11} />
                            <span>{roleName}</span>
                          </span>
                        </td>

                        <td className="px-4 py-2">
                          {hasFullAccess ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 size={11} />
                                <span>Accès Intégral ({ALL_ROUTES.length} pages)</span>
                              </span>
                              <span className="text-[10px] font-semibold text-gray-400">Toutes actions</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                <Layers size={11} />
                                <span>{countPages} page{countPages > 1 ? 's' : ''}</span>
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {countActions} action{countActions > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            <span>{staff.user?.phone || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-2">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                              <XCircle size={11} />
                              <span>Suspendu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={11} />
                              <span>Actif</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditModal(staff)}
                                title="Modifier les droits d'accès & informations"
                                className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition cursor-pointer"
                              >
                                <Edit size={15} />
                              </button>
                            )}

                            {canSuspend && (
                              isSuspended ? (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, type: 'reactivate', staff, loading: false })}
                                  title="Réactiver le compte"
                                  className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition cursor-pointer"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, type: 'suspend', staff, loading: false })}
                                  title="Suspendre les accès"
                                  className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition cursor-pointer"
                                >
                                  <AlertTriangle size={15} />
                                </button>
                              )
                            )}

                            {canDelete && (
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'delete', staff, loading: false })}
                                title="Supprimer définitivement"
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 size={15} />
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

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ── NOUVEAU MODAL FLUIDE, RESPONSIVE ET 100% SANS SLIDER BLOQUANT ───────── */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {showModal && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '860px',
                maxHeight: '88vh',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
              }}
            >
              
              {/* ── En-tête Sticky du Modal ── */}
              <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                      {editingStaff ? 'Configuration des Droits Administrateur' : 'Créer un Compte Administrateur'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {editingStaff ? `Modification pour ${editingStaff.first_name} ${editingStaff.last_name}` : 'Définissez les accès et les actions permises par module'}
                    </p>
                  </div>
                </div>

                {/* Sélecteur d'étapes (Tabs) */}
                <div className="flex items-center bg-gray-100/80 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('identity')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'identity'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UserCog size={14} className={activeTab === 'identity' ? 'text-blue-600' : 'text-gray-500'} />
                    <span>1. Profil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('permissions')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'permissions'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <SlidersHorizontal size={14} className={activeTab === 'permissions' ? 'text-blue-600' : 'text-gray-500'} />
                    <span>2. Droits & Actions ({selectedRoutes.length} pages)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Message d'erreur dans le Modal ── */}
              {error && (
                <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Corps du Modal (UN SEUL CONTENEUR SCROLLABLE, FLUIDE ET NATUREL) ── */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* ───────────────────────────────────────────────────────────── */}
                {/* ── ONGLET 1 : INFORMATIONS PERSONNELLES & RÔLE ────────────── */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === 'identity' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Bloc Informations d'identité */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <UserCog size={16} className="text-blue-600" />
                        <span>Identité du Collaborateur</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Prénom *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jean"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Nom de famille *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Dupont"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          />
                        </div>
                      </div>

                      {!editingStaff && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Mail size={13} className="text-gray-400" />
                                <span>Email professionnel (Identifiant unique) *</span>
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="collaborateur@samre.tg"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Phone size={13} className="text-gray-400" />
                                <span>Numéro de téléphone *</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="+228 90 00 00 00"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                              <KeyRound size={13} className="text-gray-400" />
                              <span>Mot de passe provisoire (au moins 6 caractères) *</span>
                            </label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••••••"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                              Le collaborateur pourra modifier son mot de passe en toute sécurité après connexion.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bloc Rôle */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <Shield size={16} className="text-indigo-600" />
                        <span>Rôle de Base</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {roles.map(r => {
                          const isSelected = String(formData.role_id) === String(r.id);

                          return (
                            <div
                              key={r.id}
                              onClick={() => setFormData({ ...formData, role_id: r.id })}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                                isSelected
                                  ? 'bg-blue-50/50 border-blue-600 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm capitalize">{r.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{r.description || 'Rôle standard pour l\'administration.'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bouton pour aller à l'étape 2 */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab('permissions')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <span>Passer aux Droits d'Accès & Actions ➔</span>
                      </button>
                    </div>

                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* ── ONGLET 2 : MATRICE DES DROITS ET ACTIONS PAR PAGE ──────── */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeTab === 'permissions' && (
                  <div className="space-y-6 max-w-4xl mx-auto">

                    {/* 1. Barre de Contrôle Supérieure (Recherche + Raccourcis) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        
                        {/* Recherche */}
                        <div className="relative flex-1">
                          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher une page ou un module (ex: offres, utilisateurs, finances...)"
                            value={moduleSearch}
                            onChange={(e) => setModuleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        {/* Raccourcis rapides */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={applyFullAccessPreset}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 shadow-2xs transition cursor-pointer"
                          >
                            👑 Tout autoriser
                          </button>
                          <button
                            type="button"
                            onClick={applyReadOnlyPreset}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 shadow-2xs transition cursor-pointer"
                          >
                            👁️ Lecture seule
                          </button>
                          <button
                            type="button"
                            onClick={applyModeratorPreset}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 shadow-2xs transition cursor-pointer"
                          >
                            ⚖️ Modérateur
                          </button>
                          <button
                            type="button"
                            onClick={applyClearAllPreset}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            Réinitialiser
                          </button>
                        </div>

                      </div>

                      {/* 2. Filtres par Catégorie (Pills horizontaux avec wrapping fluide) */}
                      <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-gray-400 font-bold mr-1">Filtrer :</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                            selectedCategory === 'all'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Tous les modules ({ADMIN_MODULES_CONFIG.length})
                        </button>
                        {ADMIN_MODULES_CONFIG.map(m => {
                          const isCatSelected = selectedCategory === m.id;
                          const modPaths = m.pages.map(p => p.path);
                          const activeCount = modPaths.filter(p => selectedRoutes.includes(p)).length;

                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedCategory(m.id)}
                              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isCatSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span>{m.label}</span>
                              {activeCount > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                  isCatSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {activeCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Arborescence de Fichiers (Tree View comme demandé) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                      
                      {/* En-tête de l'arborescence avec contrôles */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-extrabold">
                          <ListTree size={16} className="text-blue-600" />
                          <span>Arborescence des Dossiers & Pages ({ALL_ROUTES.length} pages disponibles)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={expandAllModules}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer shadow-2xs"
                          >
                            <FolderOpen size={13} className="text-amber-500" />
                            <span>Tout déplier</span>
                          </button>

                          <button
                            type="button"
                            onClick={collapseAllModules}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5 text-[11px] cursor-pointer shadow-2xs"
                          >
                            <Folder size={13} className="text-amber-500" />
                            <span>Tout replier</span>
                          </button>
                        </div>
                      </div>

                      {/* Liste Arborescente */}
                      <div className="p-3 sm:p-4 divide-y divide-slate-100">
                        {displayedModules.length === 0 ? (
                          <div className="p-10 text-center text-slate-400 font-medium text-xs">
                            Aucun dossier ou page ne correspond à votre recherche.
                          </div>
                        ) : (
                          displayedModules.map(mod => {
                            const modPaths = mod.pages.map(p => p.path);
                            const activeCount = modPaths.filter(p => selectedRoutes.includes(p)).length;
                            const isAllChecked = activeCount === modPaths.length && modPaths.length > 0;
                            const isIndeterminate = activeCount > 0 && !isAllChecked;
                            const isExpanded = expandedModules[mod.id] !== false;

                            return (
                              <div key={mod.id} className="py-2 first:pt-0 last:pb-0">
                                
                                {/* ── Ligne Dossier (Niveau 1 : Module Parent) ── */}
                                <div className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50/80 transition group select-none">
                                  
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* Flèche Déplier / Replier */}
                                    <button
                                      type="button"
                                      onClick={() => toggleModuleExpanded(mod.id)}
                                      className="w-5 h-5 rounded hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown size={15} className="text-slate-700 stroke-[2.5]" />
                                      ) : (
                                        <ChevronRight size={15} className="text-slate-400" />
                                      )}
                                    </button>

                                    {/* Checkbox Dossier Parent */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleModule(mod)}
                                      className="cursor-pointer shrink-0"
                                    >
                                      {isAllChecked ? (
                                        <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                                          <Check size={11} className="stroke-[3]" />
                                        </div>
                                      ) : isIndeterminate ? (
                                        <div className="w-4 h-4 rounded bg-blue-100 border border-blue-400 text-blue-600 flex items-center justify-center">
                                          <Minus size={11} className="stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="w-4 h-4 rounded border border-slate-300 bg-white hover:border-slate-400" />
                                      )}
                                    </button>

                                    {/* Icône Dossier & Titre */}
                                    <div
                                      onClick={() => toggleModuleExpanded(mod.id)}
                                      className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                                    >
                                      {isExpanded ? (
                                        <FolderOpen size={18} className="text-amber-500 fill-amber-100 shrink-0" />
                                      ) : (
                                        <Folder size={18} className="text-amber-500 fill-amber-100 shrink-0" />
                                      )}
                                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {mod.label}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                        ({mod.pages.length} page{mod.pages.length > 1 ? 's' : ''})
                                      </span>
                                    </div>
                                  </div>

                                  {/* Badge d'état & Action Rapide */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      activeCount > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {activeCount}/{mod.pages.length} active{activeCount > 1 ? 's' : ''}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleModule(mod)}
                                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 cursor-pointer"
                                    >
                                      {isAllChecked ? 'Décocher tout' : 'Cocher tout'}
                                    </button>
                                  </div>

                                </div>

                                {/* ── Sous-arborescence des Pages & Droits (si dossier déplié) ── */}
                                {isExpanded && (
                                  <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-200/80 my-1 space-y-2">
                                    {mod.pages.map(page => {
                                      const isPageActive = selectedRoutes.includes(page.path);
                                      const currentActions = selectedActions[page.path] || [];

                                      return (
                                        <div key={page.path} className="space-y-1.5 py-1">
                                          
                                          {/* Ligne Fichier (Niveau 2 : Page) */}
                                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition select-none">
                                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                              <input
                                                type="checkbox"
                                                checked={isPageActive}
                                                onChange={() => handleTogglePageRoute(page.path)}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                                              />
                                              <FileText size={15} className={isPageActive ? "text-blue-600 shrink-0" : "text-slate-400 shrink-0"} />
                                              <span className={`text-xs ${isPageActive ? 'font-bold text-slate-900' : 'font-medium text-slate-600'} truncate`}>
                                                {page.label}
                                              </span>
                                              <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded hidden md:inline shrink-0">
                                                {page.path}
                                              </code>
                                            </label>

                                            <div className="shrink-0">
                                              {isPageActive ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  {currentActions.length} action{currentActions.length > 1 ? 's' : ''}
                                                </span>
                                              ) : (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                  Désactivé
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Ligne Actions (Niveau 3 : Droits d'actions spécifiques) */}
                                          {isPageActive && (
                                            <div className="ml-7 pl-3 border-l-2 border-dashed border-slate-200/80 pt-1 pb-1.5">
                                              <div className="flex items-center flex-wrap gap-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                                  Droits :
                                                </span>
                                                {page.allowedActions.map(actionKey => {
                                                  const customDetail = page.actionDetails?.[actionKey];
                                                  const def = ACTION_DEFINITIONS[actionKey] || { label: actionKey, color: 'bg-gray-50 text-gray-700 border-gray-200' };
                                                  const label = customDetail?.label || def.label;
                                                  const desc = customDetail?.desc || def.desc;
                                                  const isActionGranted = currentActions.includes(actionKey);

                                                  return (
                                                    <button
                                                      type="button"
                                                      key={actionKey}
                                                      onClick={() => handleTogglePageAction(page.path, actionKey)}
                                                      title={desc}
                                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer select-none ${
                                                        isActionGranted
                                                          ? `${def.color} shadow-2xs font-extrabold ring-1 ring-black/5`
                                                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                                      }`}
                                                    >
                                                      <div className={`w-3 h-3 rounded flex items-center justify-center transition ${
                                                        isActionGranted ? 'bg-current text-white' : 'border border-slate-300 bg-white'
                                                      }`}>
                                                        {isActionGranted && <Check size={8} className="stroke-[3]" />}
                                                      </div>
                                                      <span>{label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* ── Pied Sticky du Modal avec Résumé et Enregistrement ── */}
              <div className="px-5 sm:px-7 py-4 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'permissions') {
                      setActiveTab('identity');
                    } else {
                      setShowModal(false);
                    }
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-100 transition flex items-center gap-2 cursor-pointer"
                >
                  {activeTab === 'permissions' ? (
                    <>
                      <ArrowLeft size={14} />
                      <span>Retour au profil</span>
                    </>
                  ) : (
                    <span>Annuler</span>
                  )}
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-gray-900">
                      {selectedRoutes.length} pages • {totalActiveActionsCount} actions configurées
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {selectedRoutes.length === ALL_ROUTES.length ? 'Accès intégral actif' : 'Permissions personnalisées'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingStaff ? 'Enregistrer les modifications' : 'Créer l\'administrateur'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>,
          document.body
        )}

        {/* ── Modal de Confirmation (Suspendre / Supprimer / Réactiver) ── */}
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
              : 'L\'administrateur pourra à nouveau se connecter et retrouver ses pages et actions autorisées.'
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
