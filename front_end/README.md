# Facturio — FRONT 1 · Espace Créateur & Influenceur

Front Angular 21 du SaaS de gestion commerciale, facturation et relances,
limité au **portail créateur** (`workspaceType = CREATOR`). Le portail PME et
le back-office administrateur ne sont pas dans ce lot.

Conventions : **fichiers, classes, types et propriétés en anglais**, commentaires
en français, **URL en français** (elles viennent du cahier des charges), et tout
le texte affiché passe par le dictionnaire de traduction **FR / EN**.

## Démarrer

```bash
npm install
npm start          # http://localhost:4200
npm test           # vitest (182 tests)
npm run build      # build production + pré-rendu des tunnels d'accès
```

Aucune API n'est requise : les données vivent dans un magasin en mémoire
(`core/workspace-store.service.ts`) alimenté par un jeu de démonstration.
Sur l'écran de connexion, **« Explorer le jeu de démonstration »** ouvre
directement l'espace.

## Bilingue FR / EN

Le sélecteur `fr | en` est présent sur les tunnels d'accès et en bas de la
navigation. Le choix est mémorisé dans `localStorage` et change tout en direct :
libellés, statuts, types de livrable, méthodes de paiement, messages de relance,
en-têtes d'export CSV, formats de date (`12/08/2026` ↔ `08/12/2026`) et de
montant (`1 500 €` ↔ `€1,500`).

- `core/i18n/translations.ts` — dictionnaire unique, chaque clé portant les deux
  langues sous la forme `['français', 'english']` : impossible d'en oublier une.
- `core/i18n/i18n.service.ts` — `t()`, `status()`, `deliverable()`, `method()`,
  `vocab()` (vocabulaire par `workspaceType`) et `error()` pour les résultats
  d'action.
- Les services ne renvoient jamais de phrase : ils renvoient une **clé** et ses
  paramètres, y compris pour le journal d'activité et les blocages de quota.

## Mise en page

La page ne défile jamais : `h-dvh` + `overflow-hidden` sur la coquille, la
navigation latérale reste figée, et seul le corps du contenu (`<main>`) défile.
Même principe dans les modales — en-tête figé, corps défilant.

## Routes

| Route | Écran |
| --- | --- |
| `/createurs/connexion` | Connexion créateur |
| `/createurs/inscription` | Inscription en deux étapes |
| `/entreprises/connexion` | Portail entreprise → redirection silencieuse vers l'espace créateur |
| `/app/tableau-de-bord` | Indicateurs, revenus, échéances, campagnes, activité |
| `/app/marques` | Portefeuille d'annonceurs, fiche marque, export CSV |
| `/app/campagnes` | Livrables typés et chaîne Proposition → Contrat → Facture → Paiement |
| `/app/propositions` | Devis créateur, acceptation, transformation en facture |
| `/app/factures` | Émission, statuts, paiements, avoirs |
| `/app/paiements` | Versements complets ou partiels, reste dû recalculé |
| `/app/relances` | Scénario J-3 → J+15, file d'attente, historique |
| `/app/rapports` | CA, impayés par ancienneté, top marques, revenus par livrable |

## Organisation du code

```
src/app/
├── core/                     règles métier sans interface
│   ├── models.ts             types du domaine
│   ├── calculations.ts       TVA ventilée, reste dû, retards, numérotation
│   ├── quotas.ts             grille Free / Starter / Pro / Business
│   ├── demo-data.ts          jeu de démonstration
│   ├── workspace-store.service.ts   source de vérité (signaux)
│   ├── auth.service.ts / auth.guard.ts
│   └── i18n/                 translations.ts · i18n.service.ts
├── shared/                   composants et pipes réutilisables
│   ├── status-badge/  kpi-card/  modal/  line-editor/  language-switch/
│   └── amount.pipe.ts · local-date.pipe.ts
├── layout/creator-shell/     navigation figée, en-tête, notifications
└── pages/<module>/           un dossier par module :
    <module>.component.ts | .html | .spec.ts + <entity>.service.ts | .spec.ts
```

Modules : `login`, `signup`, `dashboard`, `brands`, `campaigns`, `quotes`,
`invoices`, `payments`, `reminders`, `reports`.

Chaque service métier lit et écrit dans `WorkspaceStore`, ce qui évite toute
dépendance circulaire entre modules. Les règles financières sont isolées dans
`core/calculations.ts` et couvertes par des tests unitaires.

## Règles du cahier des charges implémentées

- **P01** calculs automatiques et numérotation `FAC-2026-0042`, attribuée à la
  validation et non à la création du brouillon.
- **P02** tableau de bord dès la connexion, chaque indicateur renvoyant vers la
  liste filtrée (`?statut=OVERDUE`).
- **P03** moteur de relances paramétrable (J-3, J0, J+3, J+7, J+15), mode
  automatique ou file d'attente, plafond d'envois, arrêt dès le solde à zéro.
- **P04** campagnes avec livrables typés et génération de facture sans ressaisie.
- **P06** transformation d'une proposition acceptée en facture, traçabilité
  conservée, proposition verrouillée.
- **P07** N paiements par facture, reste dû recalculé, refus au-delà du solde.
- **P08** recalcul des statuts au chargement de l'espace (tâche planifiée
  simulée côté front).
- **P12** tunnels d'accès séparés et vocabulaire métier externalisé.
- **P14** moteur de quotas : blocage explicite avec incitation à la montée en
  gamme, jamais d'erreur technique.

Une facture envoyée n'est jamais modifiable : le bouton **Avoir** ouvre le détail
de la facture et demande confirmation avant de générer l'avoir en négatif.

## Hors périmètre de ce lot

FRONT 0 marketing, FRONT 2 (PME/agences), FRONT 3 (administration), assistant
IA, dépenses, abonnement, paramètres et support, génération PDF réelle, envoi
d'emails et persistance serveur.
