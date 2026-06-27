# Design System Prompt — SAMRE Admin Panel
## React | Référentiel Visuel & Composants UI

---

## 1. Identité Visuelle & Palette de Couleurs

### Couleurs extraites du logo SAMRE

```
Primaire Bleu         #1A6FD4   → actions principales, liens, focus
Primaire Bleu Foncé   #0D3B7A   → sidebar, headers, éléments actifs
Accent Or             #F5A623   → badges, highlights, notifications, CTA secondaires
Accent Jaune Vif      #FFD000   → hover states, indicateurs, graphiques
Noir Profond          #0F1923   → fond sidebar, textes principaux
Blanc Pur             #FFFFFF   → fond des cards, modals, inputs
Gris Clair            #F4F6FA   → fond général du dashboard
Gris Moyen            #8A94A6   → textes secondaires, placeholders
Gris Bordure          #E2E8F0   → séparateurs, bordures légères
```

### Couleurs Sémantiques

```
Succès    #22C55E   → statut Acceptée, validé, badge actif
Attention #F5A623   → statut En cours, en attente
Danger    #EF4444   → statut Refusée, suppression, erreur
Info      #1A6FD4   → statut Soumise, information
```

---

## 2. Typographie

```
Famille principale   : Inter (Google Fonts)
Famille secondaire   : Poppins (titres, headers)

Tailles :
  - Titre de page      : Poppins 28px / Bold / #0F1923
  - Titre de section   : Poppins 20px / SemiBold / #0F1923
  - Titre de card      : Inter 16px / SemiBold / #0F1923
  - Corps texte        : Inter 14px / Regular / #0F1923
  - Texte secondaire   : Inter 13px / Regular / #8A94A6
  - Label input        : Inter 13px / Medium / #0F1923
  - Micro texte        : Inter 11px / Regular / #8A94A6

Letter spacing : 0.01em sur les titres
Line height    : 1.6 sur le corps, 1.3 sur les titres
```

---

## 3. Sidebar

```
Fond                  : #0D3B7A (bleu foncé profond)
Largeur ouverte       : 260px
Largeur réduite       : 72px
Transition            : ease-in-out 0.3s

Logo SAMRE en haut    :
  - Logo centré 48px de hauteur
  - Nom "SAMRE" en Poppins Bold 18px blanc
  - Séparateur fin #1A6FD4 opacity 0.3

Item de navigation    :
  - Fond par défaut   : transparent
  - Fond hover        : #1A6FD4 opacity 0.15, border-left 3px solid #F5A623
  - Fond actif        : #1A6FD4, border-left 3px solid #FFD000
  - Icône             : 20px, couleur #8A94A6 → blanc si actif
  - Texte             : Inter 14px Medium, couleur #A0AEC0 → blanc si actif
  - Border radius item: 10px (droite arrondie uniquement)
  - Padding           : 12px 16px
  - Transition hover  : 0.2s ease

Sous-menu             :
  - Fond              : #0A2D5E
  - Padding left      : 48px
  - Texte             : Inter 13px, #8A94A6 → #F5A623 si actif
  - Indicateur actif  : point rond 6px #F5A623

Badge compteur        :
  - Fond              : #F5A623
  - Texte             : #0F1923, 10px Bold
  - Border radius     : 999px
  - Padding           : 2px 7px

Avatar admin en bas   :
  - Photo ronde 36px border 2px #F5A623
  - Nom Inter 13px Bold blanc
  - Rôle Inter 11px #8A94A6
  - Icône déconnexion à droite, rouge au hover
```

---

## 4. Header / Topbar

```
Fond                  : #FFFFFF
Hauteur               : 64px
Ombre                 : 0 1px 0 #E2E8F0
Border bottom         : 1px solid #E2E8F0

Contenu (gauche → droite) :
  - Bouton toggle sidebar : icône hamburger #0D3B7A
  - Fil d'Ariane (breadcrumb) :
      · Séparateur " / "
      · Page actuelle : Poppins 15px SemiBold #0F1923
      · Pages parentes : Inter 14px #8A94A6

  - (droite) Barre de recherche globale :
      · Fond #F4F6FA, border 1px #E2E8F0
      · Border radius 12px
      · Icône loupe #8A94A6
      · Placeholder "Rechercher..."
      · Width 280px

  - Icône notifications :
      · Cloche 22px #0D3B7A
      · Badge rouge compteur
      · Dropdown au clic : liste des 5 dernières notifs

  - Avatar admin :
      · Photo ronde 36px
      · Dropdown : Profil / Paramètres / Déconnexion
```

---

## 5. Cards

### Card Statistique (KPI)
```
Fond                  : #FFFFFF
Border radius         : 16px
Ombre                 : 0 4px 24px rgba(13, 59, 122, 0.08)
Padding               : 24px
Border left           : 4px solid (couleur selon type)
Hover                 : ombre 0 8px 32px rgba(13, 59, 122, 0.14), translateY(-2px)
Transition            : 0.25s ease

Contenu :
  - Icône dans carré arrondi 44px :
      · Fond : couleur primaire opacity 0.12
      · Icône : 22px couleur primaire
      · Border radius : 12px
  - Valeur principale : Poppins 32px Bold #0F1923
  - Label : Inter 13px #8A94A6
  - Variation (ex: +12%) :
      · Vert si positif, rouge si négatif
      · Flèche + pourcentage Inter 12px SemiBold
```

### Card Contenu (liste, tableau, formulaire)
```
Fond                  : #FFFFFF
Border radius         : 20px
Ombre                 : 0 2px 16px rgba(13, 59, 122, 0.06)
Padding               : 24px
Border                : 1px solid #E2E8F0

Header de card :
  - Titre Poppins 16px SemiBold #0F1923
  - Sous-titre Inter 13px #8A94A6
  - Actions à droite (boutons, filtres, export)
  - Séparateur 1px #E2E8F0 sous le header
```

### Card Profil Utilisateur / Entreprise
```
Fond                  : #FFFFFF
Border radius         : 20px
Ombre                 : 0 4px 20px rgba(13, 59, 122, 0.08)
Padding               : 20px
Hover                 : border 1px solid #1A6FD4

Contenu :
  - Avatar rond 56px, border 2px #F5A623
  - Badge vérifié : cercle #22C55E avec checkmark blanc
  - Nom Poppins 15px SemiBold
  - Rôle / ville Inter 13px #8A94A6
  - Tags compétences : pills arrondies
  - Actions : boutons icônes en bas
```

---

## 6. Boutons

```
PRIMARY :
  Fond              : #1A6FD4
  Texte             : #FFFFFF, Inter 14px SemiBold
  Border radius     : 12px
  Padding           : 10px 24px
  Hover             : #0D3B7A, ombre 0 4px 16px rgba(26,111,212,0.35)
  Active            : scale(0.97)
  Transition        : 0.2s ease

SECONDARY :
  Fond              : transparent
  Border            : 1.5px solid #1A6FD4
  Texte             : #1A6FD4
  Border radius     : 12px
  Hover             : fond #1A6FD4 opacity 0.08

ACCENT (CTA fort) :
  Fond              : linear-gradient(135deg, #F5A623, #FFD000)
  Texte             : #0F1923, Inter 14px Bold
  Border radius     : 12px
  Ombre             : 0 4px 16px rgba(245,166,35,0.4)
  Hover             : brightness(1.05), translateY(-1px)

DANGER :
  Fond              : #FEF2F2
  Texte             : #EF4444
  Border           : 1px solid #EF4444
  Hover             : fond #EF4444, texte blanc

ICON BUTTON :
  Fond              : #F4F6FA
  Border radius     : 10px
  Padding           : 8px
  Icône             : 18px #0D3B7A
  Hover             : fond #1A6FD4 opacity 0.1

Taille Small  : padding 6px 16px, font 12px
Taille Medium : padding 10px 24px, font 14px (défaut)
Taille Large  : padding 14px 32px, font 15px
```

---

## 7. Tableaux (Tables)

```
Fond header           : #F4F6FA
Texte header          : Inter 12px SemiBold uppercase #8A94A6, letter-spacing 0.05em
Border radius table   : 16px (overflow hidden)
Ligne paire           : #FFFFFF
Ligne impaire         : #F9FAFB
Hover ligne           : #EFF6FF (bleu très clair)
Border entre lignes   : 1px solid #E2E8F0
Padding cellule       : 14px 16px
Transition hover      : 0.15s ease

Colonne actions       :
  - Icônes boutons groupés
  - Voir (bleu) / Modifier (or) / Supprimer (rouge)
  - Tooltip au hover

Pagination            :
  - Boutons précédent / suivant
  - Numéros de pages : border radius 8px
  - Page active : fond #1A6FD4 texte blanc
  - Fond inactif : #F4F6FA

Tri colonnes          :
  - Flèches up/down à côté du header
  - Couleur active : #1A6FD4
```

---

## 8. Graphiques & Courbes

```
Librairie             : Recharts (React)
Fond des graphiques   : transparent

Palette de couleurs graphiques :
  Série 1 : #1A6FD4 (bleu primaire)
  Série 2 : #F5A623 (or)
  Série 3 : #22C55E (vert)
  Série 4 : #EF4444 (rouge)
  Série 5 : #8B5CF6 (violet)

LINE CHART (courbes statistiques) :
  - Ligne épaisseur  : 2.5px
  - Courbe           : type="monotone" (lissée)
  - Point hover      : cercle 6px fond blanc border 2px couleur série
  - Aire sous courbe : gradient opacity 0.12 → 0
  - Grille           : lignes horizontales #E2E8F0 dashed
  - Axes             : Inter 12px #8A94A6
  - Tooltip          :
      · Fond #0D3B7A, texte blanc
      · Border radius 10px
      · Ombre douce
      · Valeur en Poppins 15px Bold

BAR CHART :
  - Border radius barres : 8px (haut arrondi uniquement)
  - Gap entre barres     : 4px
  - Hover barre          : brightness(0.85)
  - Barre active         : border top 3px solid #FFD000

DONUT / PIE CHART :
  - Épaisseur anneau   : 40px
  - Espacement slices  : 2px
  - Centre             : valeur totale Poppins 24px Bold + label 12px
  - Légende            : à droite, points ronds 10px + label Inter 13px

AREA CHART :
  - Dégradé vertical du haut (couleur pleine) vers le bas (transparent)
  - Opacity dégradé : 0.2 → 0
```

---

## 9. Badges & Tags

```
BADGE STATUT :
  Soumise     : fond #EFF6FF, texte #1A6FD4, border 1px #BFDBFE
  En cours    : fond #FFFBEB, texte #D97706, border 1px #FDE68A
  Acceptée    : fond #F0FDF4, texte #16A34A, border 1px #BBF7D0
  Refusée     : fond #FEF2F2, texte #DC2626, border 1px #FECACA
  En attente  : fond #F5F3FF, texte #7C3AED, border 1px #DDD6FE

  Border radius : 999px
  Padding       : 4px 12px
  Font          : Inter 12px SemiBold

BADGE VÉRIFICATION :
  Fond          : #22C55E
  Icône check   : blanc 10px
  Forme         : cercle 20px
  Position      : absolute bottom-right sur avatar

TAG COMPÉTENCE :
  Fond          : #EFF6FF
  Texte         : #1A6FD4, Inter 12px Medium
  Border radius : 8px
  Padding       : 4px 10px

TAG PLAN PREMIUM :
  Fond          : linear-gradient(135deg, #F5A623, #FFD000)
  Texte         : #0F1923, Inter 12px Bold
  Border radius : 8px
  Ombre         : 0 2px 8px rgba(245,166,35,0.3)
```

---

## 10. Inputs & Formulaires

```
INPUT STANDARD :
  Fond              : #F4F6FA
  Border            : 1.5px solid #E2E8F0
  Border radius     : 12px
  Padding           : 12px 16px
  Font              : Inter 14px #0F1923
  Placeholder       : #8A94A6
  Focus             : border 1.5px solid #1A6FD4, ombre 0 0 0 3px rgba(26,111,212,0.12)
  Error             : border #EF4444, ombre rouge
  Transition        : 0.2s ease

SELECT / DROPDOWN :
  Même style que input
  Icône chevron     : #8A94A6, rotation 180° si ouvert
  Options           : fond blanc, hover #EFF6FF, actif #1A6FD4 texte blanc
  Border radius dropdown : 12px
  Ombre dropdown    : 0 8px 24px rgba(13,59,122,0.12)

SEARCH INPUT :
  Icône loupe à gauche intégrée
  Fond              : #F4F6FA
  Border radius     : 12px
  Clear button      : × à droite si texte saisi

TOGGLE SWITCH :
  Off               : fond #E2E8F0, cercle blanc
  On                : fond #1A6FD4, cercle blanc
  Transition        : 0.25s ease
  Taille            : 44px × 24px

LABEL :
  Inter 13px Medium #0F1923
  Margin bottom 6px
  Requis : astérisque #EF4444

MESSAGE ERREUR :
  Inter 12px #EF4444
  Icône warning 14px à gauche
  Margin top 4px
```

---

## 11. Modals

```
Overlay               : #0F1923 opacity 0.5, backdrop-blur 4px
Animation ouverture   : fadeIn + scaleUp (0.25s ease)
Animation fermeture   : fadeOut + scaleDown (0.2s ease)

MODAL STANDARD :
  Fond              : #FFFFFF
  Border radius     : 24px
  Ombre             : 0 24px 64px rgba(13,59,122,0.2)
  Padding           : 32px
  Max-width         : 560px
  Width             : 90vw

  Header :
    - Titre Poppins 18px Bold #0F1923
    - Sous-titre Inter 13px #8A94A6
    - Icône fermeture × en haut à droite
      · Fond #F4F6FA, border radius 10px
      · Hover fond #EF4444, icône blanc

  Séparateur        : 1px solid #E2E8F0

  Body              :
    - Padding 24px 0
    - Scrollable si contenu long

  Footer            :
    - Alignement droite
    - Bouton Annuler (secondary) + Bouton Confirmer (primary)
    - Gap 12px entre boutons

MODAL CONFIRMATION SUPPRESSION :
  Icône warning     : cercle 64px fond #FEF2F2, icône poubelle #EF4444
  Titre             : Poppins 18px Bold #0F1923
  Texte             : Inter 14px #8A94A6, centré
  Boutons           : Annuler (secondary) + Supprimer (danger)

MODAL SUCCÈS :
  Icône check       : cercle 64px fond #F0FDF4, check #22C55E
  Animation icône   : pop in avec bounce
  Titre             : "Action réussie" Poppins 18px Bold
  Auto-fermeture    : 2.5 secondes avec barre de progression
```

---

## 12. Notifications & Toasts

```
Position              : top-right, margin 20px
Border radius         : 14px
Padding               : 16px 20px
Ombre                 : 0 8px 24px rgba(13,59,122,0.15)
Min-width             : 320px
Animation             : slideInRight + fadeIn

Succès  : border-left 4px #22C55E, icône check vert, fond blanc
Erreur  : border-left 4px #EF4444, icône × rouge, fond blanc
Info    : border-left 4px #1A6FD4, icône info bleu, fond blanc
Warning : border-left 4px #F5A623, icône ! orange, fond blanc

Titre   : Inter 14px SemiBold #0F1923
Message : Inter 13px #8A94A6
Durée   : 4 secondes, barre de progression en bas
Bouton fermer : × gris en haut à droite
```

---

## 13. Icônes

```
Librairie             : Lucide React
Taille standard       : 18px
Taille grande         : 22px
Taille petite         : 14px
Style                 : strokeWidth 1.8px (fin et élégant)

Couleurs selon contexte :
  Navigation sidebar  : #A0AEC0 → blanc si actif
  Actions tableau     : #1A6FD4 voir / #F5A623 modifier / #EF4444 supprimer
  Inputs              : #8A94A6
  KPI cards           : couleur de la série
  Statuts             : couleur sémantique correspondante
```

---

## 14. Spacing & Layout

```
Grid système          : 12 colonnes, gap 24px
Padding page          : 24px (desktop) / 16px (tablet)
Gap entre cards KPI   : 20px
Gap entre sections    : 32px

Border radius global  :
  Petits éléments (tags, badges) : 8px / 999px
  Inputs, boutons                : 12px
  Cards standards                : 20px
  Modals                         : 24px
  Sidebar items                  : 10px

Transitions globales  : 0.2s ease (interactions rapides)
                        0.3s ease (transitions de page)
                        0.25s ease (modals, dropdowns)
```

---

## 15. États & Micro-interactions

```
Hover général         : translateY(-2px) sur les cards
Bouton clic           : scale(0.97)
Sidebar item hover    : glissement doux du fond + border gauche
Ligne tableau hover   : fond bleu très clair instantané
Toggle switch         : glissement fluide 0.25s
Chargement page       : skeleton loader (gris animé pulsant)
Chargement bouton     : spinner circulaire blanc dans le bouton
Graphiques            : animation d'apparition progressive au chargement
KPI cards             : compteur animé de 0 → valeur réelle (1s)
Badge notification    : pop in avec légère bounce
```

---

## 16. Skeleton Loaders

```
Fond de base          : #E2E8F0
Fond animé            : dégradé de #E2E8F0 → #F4F6FA → #E2E8F0
Animation             : shimmer horizontal 1.5s infini
Border radius         : identique au composant remplacé

Skeleton card KPI     : rectangle 100% × 100px
Skeleton tableau      : lignes 100% × 48px, gap 1px
Skeleton graphique    : rectangle 100% × 300px
Skeleton avatar       : cercle 40px + lignes 120px et 80px
```

---

> **Résumé des choix clés :**
> Bleu profond `#0D3B7A` et Or `#F5A623` comme identité forte issue du logo. Border radius généreux (12-24px) pour un rendu moderne et doux. Ombres légères bleutées pour la profondeur sans lourdeur. Typographie Inter + Poppins pour lisibilité et élégance. Micro-interactions sur chaque élément interactif pour une expérience fluide et premium.