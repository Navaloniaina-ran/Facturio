import { ajouterJours, aujourdhui } from './calculs';
import {
  Campagne,
  Createur,
  EtapeRelance,
  Facture,
  Marque,
  Paiement,
  Proposition,
} from './modeles';

/** Jeu de données de démonstration, daté relativement à aujourd'hui. */
const J = (decalage: number) => ajouterJours(aujourdhui(), decalage);

export const CREATEUR_DEMO: Createur = {
  id: 'u1',
  nom: 'Toky Raherimana',
  pseudo: '@toky.creates',
  email: 'toky@callandco.fr',
  sousProfil: 'CREATEUR',
  plateformes: ['Instagram', 'TikTok', 'YouTube'],
  thematique: 'Lifestyle & Tech',
  pays: 'France',
  devise: 'EUR',
  assujettiTva: true,
  logo: null,
  coordonneesBancaires: null,
  plan: 'PRO',
};

export const MARQUES_DEMO: Marque[] = [
  {
    id: 'm1',
    nom: 'Nike',
    contact: 'Léa Moreau',
    email: 'lea.moreau@nike.example',
    telephone: '+33 1 45 67 89 01',
    adresse: '12 rue du Sport, 75011 Paris',
    conditionsPaiementJours: 30,
    tauxTvaDefaut: 20,
    notes: 'Collaboration récurrente chaque été.',
    relancesSuspendues: false,
  },
  {
    id: 'm2',
    nom: 'Glow Cosmetics',
    contact: 'Amine Bekkar',
    email: 'amine@glow.example',
    telephone: '+33 6 12 34 56 78',
    adresse: '4 avenue des Lilas, 69003 Lyon',
    conditionsPaiementJours: 15,
    tauxTvaDefaut: 20,
    notes: 'Paie toujours en retard, prévoir un acompte.',
    relancesSuspendues: false,
  },
  {
    id: 'm3',
    nom: 'Studio Kama',
    contact: 'Ravaka Ranaivo',
    email: 'contact@studiokama.example',
    telephone: '+261 34 12 345 67',
    adresse: 'Lot II B 45, Antananarivo',
    conditionsPaiementJours: 30,
    tauxTvaDefaut: 0,
    notes: '',
    relancesSuspendues: false,
  },
];

export const CAMPAGNES_DEMO: Campagne[] = [
  {
    id: 'c1',
    marqueId: 'm1',
    nom: 'Nike Summer',
    debut: J(-12),
    fin: J(18),
    statut: 'ACTIVE',
    contratNom: 'contrat-nike-summer.pdf',
    propositionAcceptee: true,
    contratSigne: true,
    livrables: [
      { id: 'c1l1', description: 'Vidéo TikTok', typeLivrable: 'VIDEO', quantite: 2, prixUnitaire: 400, remisePourcent: 0, tauxTva: 20 },
      { id: 'c1l2', description: 'Story Instagram', typeLivrable: 'STORY', quantite: 3, prixUnitaire: 100, remisePourcent: 0, tauxTva: 20 },
      { id: 'c1l3', description: 'Publication Instagram', typeLivrable: 'POST', quantite: 1, prixUnitaire: 400, remisePourcent: 0, tauxTva: 20 },
    ],
  },
  {
    id: 'c2',
    marqueId: 'm2',
    nom: 'Glow — routine automne',
    debut: J(-4),
    fin: J(26),
    statut: 'EN_ATTENTE',
    contratNom: null,
    propositionAcceptee: false,
    contratSigne: false,
    livrables: [
      { id: 'c2l1', description: 'Reel démonstration produit', typeLivrable: 'REEL', quantite: 2, prixUnitaire: 350, remisePourcent: 0, tauxTva: 20 },
      { id: 'c2l2', description: 'Contenu UGC réutilisable', typeLivrable: 'UGC', quantite: 4, prixUnitaire: 150, remisePourcent: 0, tauxTva: 20 },
    ],
  },
  {
    id: 'c3',
    marqueId: 'm3',
    nom: 'Lancement Studio Kama',
    debut: J(-70),
    fin: J(-40),
    statut: 'TERMINEE',
    contratNom: 'contrat-kama.pdf',
    propositionAcceptee: true,
    contratSigne: true,
    livrables: [
      { id: 'c3l1', description: 'Vidéo YouTube longue', typeLivrable: 'VIDEO', quantite: 1, prixUnitaire: 1200, remisePourcent: 0, tauxTva: 0 },
    ],
  },
];

export const PROPOSITIONS_DEMO: Proposition[] = [
  {
    id: 'q1',
    numero: 'PRO-2026-0001',
    marqueId: 'm1',
    campagneId: 'c1',
    date: J(-20),
    dateExpiration: J(10),
    statut: 'FACTUREE',
    conditions: 'Paiement à 30 jours. 50 % à la signature.',
    factureId: 'f1',
    lignes: [
      { id: 'q1l1', description: 'Pack Nike Summer', typeLivrable: 'POST', quantite: 1, prixUnitaire: 1500, remisePourcent: 0, tauxTva: 20 },
    ],
  },
  {
    id: 'q2',
    numero: 'PRO-2026-0002',
    marqueId: 'm2',
    campagneId: 'c2',
    date: J(-6),
    dateExpiration: J(24),
    statut: 'ACCEPTEE',
    conditions: 'Paiement à 15 jours.',
    factureId: null,
    lignes: [
      { id: 'q2l1', description: 'Reel démonstration produit', typeLivrable: 'REEL', quantite: 2, prixUnitaire: 350, remisePourcent: 0, tauxTva: 20 },
      { id: 'q2l2', description: 'Contenu UGC réutilisable', typeLivrable: 'UGC', quantite: 4, prixUnitaire: 150, remisePourcent: 10, tauxTva: 20 },
    ],
  },
  {
    id: 'q3',
    numero: 'PRO-2026-0003',
    marqueId: 'm3',
    campagneId: null,
    date: J(-2),
    dateExpiration: J(28),
    statut: 'ENVOYEE',
    conditions: 'Paiement à 30 jours.',
    factureId: null,
    lignes: [
      { id: 'q3l1', description: 'Série de 3 Reels', typeLivrable: 'REEL', quantite: 3, prixUnitaire: 300, remisePourcent: 0, tauxTva: 0 },
    ],
  },
];

export const FACTURES_DEMO: Facture[] = [
  {
    id: 'f1',
    numero: 'FAC-2026-0001',
    marqueId: 'm1',
    campagneId: 'c1',
    propositionId: 'q1',
    dateEmission: J(-18),
    dateEcheance: J(12),
    statut: 'PARTIELLEMENT_PAYEE',
    acomptePourcent: 50,
    conditions: 'Paiement à 30 jours par virement.',
    lignes: [
      { id: 'f1l1', description: 'Pack Nike Summer', typeLivrable: 'POST', quantite: 1, prixUnitaire: 1500, remisePourcent: 0, tauxTva: 20 },
    ],
  },
  {
    id: 'f2',
    numero: 'FAC-2026-0002',
    marqueId: 'm2',
    campagneId: null,
    propositionId: null,
    dateEmission: J(-40),
    dateEcheance: J(-12),
    statut: 'EN_RETARD',
    acomptePourcent: 0,
    conditions: 'Paiement à 15 jours.',
    lignes: [
      { id: 'f2l1', description: 'Reel été — teasing', typeLivrable: 'REEL', quantite: 2, prixUnitaire: 400, remisePourcent: 0, tauxTva: 0 },
    ],
  },
  {
    id: 'f3',
    numero: 'FAC-2026-0003',
    marqueId: 'm3',
    campagneId: 'c3',
    propositionId: null,
    dateEmission: J(-45),
    dateEcheance: J(-15),
    statut: 'PAYEE',
    acomptePourcent: 0,
    conditions: 'Paiement à 30 jours.',
    lignes: [
      { id: 'f3l1', description: 'Vidéo YouTube longue', typeLivrable: 'VIDEO', quantite: 1, prixUnitaire: 1200, remisePourcent: 0, tauxTva: 0 },
    ],
  },
  {
    id: 'f4',
    numero: 'FAC-2026-0004',
    marqueId: 'm1',
    campagneId: null,
    propositionId: null,
    dateEmission: J(-8),
    dateEcheance: J(2),
    statut: 'ENVOYEE',
    acomptePourcent: 0,
    conditions: 'Paiement à 10 jours.',
    lignes: [
      { id: 'f4l1', description: 'Story Instagram — rappel', typeLivrable: 'STORY', quantite: 4, prixUnitaire: 200, remisePourcent: 0, tauxTva: 0 },
    ],
  },
  {
    id: 'f5',
    numero: 'FAC-2026-0005',
    marqueId: 'm2',
    campagneId: null,
    propositionId: null,
    dateEmission: J(-95),
    dateEcheance: J(-65),
    statut: 'PAYEE',
    acomptePourcent: 0,
    conditions: '',
    lignes: [
      { id: 'f5l1', description: 'UGC pack printemps', typeLivrable: 'UGC', quantite: 5, prixUnitaire: 180, remisePourcent: 0, tauxTva: 0 },
    ],
  },
];

export const PAIEMENTS_DEMO: Paiement[] = [
  { id: 'p1', factureId: 'f1', montant: 900, date: J(-15), methode: 'VIREMENT', reference: 'VIR-88213', note: 'Acompte 50 %', },
  { id: 'p2', factureId: 'f3', montant: 1200, date: J(-14), methode: 'MOBILE_MONEY', reference: 'MVOLA-4471', note: '' },
  { id: 'p3', factureId: 'f5', montant: 900, date: J(-60), methode: 'PAYPAL', reference: 'PP-2210', note: '' },
];

/** Scénario de relance par défaut (P03). */
export const ETAPES_RELANCE_DEMO: EtapeRelance[] = [
  { id: 'r1', libelle: 'J-3 avant échéance', decalageJours: -3, canal: 'EMAIL', modele: 'Rappel courtois', active: true },
  { id: 'r2', libelle: 'Jour de l’échéance', decalageJours: 0, canal: 'EMAIL', modele: 'Échéance', active: true },
  { id: 'r3', libelle: 'J+3 après échéance', decalageJours: 3, canal: 'EMAIL', modele: 'Premier retard', active: true },
  { id: 'r4', libelle: 'J+7 après échéance', decalageJours: 7, canal: 'EMAIL', modele: 'Relance ferme', active: true },
  { id: 'r5', libelle: 'J+15 après échéance', decalageJours: 15, canal: 'EMAIL', modele: 'Mise en demeure', active: false },
];
