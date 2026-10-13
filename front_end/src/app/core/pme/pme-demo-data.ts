import { Company, Customer, Supplier } from './pme.models';

/**
 * Jeu de démonstration de l'espace PME.
 *
 * Deux entreprises y figurent délibérément : l'isolation des données ne se
 * vérifie qu'avec au moins deux tenants. Chaque client et chaque fournisseur
 * porte le `companyId` de son propriétaire, et aucune fiche n'est partagée.
 */

export const DEMO_COMPANIES: Company[] = [
  {
    id: 'c-atelier',
    name: 'Atelier Dupont',
    identity: {
      siren: '812345678',
      siret: '81234567800019',
      vatNumber: 'FR32812345678',
      legalForm: 'SARL',
      rcsCity: 'Lyon',
      shareCapital: 25_000,
      napCode: '4332A',
    },
    address: {
      street: '14 rue des Artisans',
      postalCode: '69003',
      city: 'Lyon',
      countryCode: 'FR',
    },
    email: 'contact@atelier-dupont.example',
    phone: '+33 4 72 00 00 01',
    vatRegime: 'REEL_NORMAL',
    vatOnDebits: false,
    iban: 'FR76 3000 4000 0312 3456 7890 143',
    bic: 'BNPAFRPPXXX',
    invoicePrefix: 'AD',
    defaultPaymentTermsDays: 30,
    logo: null,
  },
  {
    id: 'c-numeris',
    name: 'Numeris Conseil',
    identity: {
      siren: '903456789',
      siret: '90345678900024',
      vatNumber: 'FR51903456789',
      legalForm: 'SAS',
      rcsCity: 'Nantes',
      shareCapital: 10_000,
      napCode: '6202A',
    },
    address: {
      street: '5 quai de la Fosse',
      postalCode: '44000',
      city: 'Nantes',
      countryCode: 'FR',
    },
    email: 'hello@numeris-conseil.example',
    phone: '+33 2 40 00 00 02',
    // Prestataire de services ayant opté pour la TVA sur les débits :
    // la mention correspondante devra figurer sur ses factures.
    vatRegime: 'REEL_NORMAL',
    vatOnDebits: true,
    iban: 'FR76 1027 8060 0100 0201 2345 678',
    bic: 'CMCIFR2AXXX',
    invoicePrefix: 'NC',
    defaultPaymentTermsDays: 45,
    logo: null,
  },
];

/** Identité vide : un particulier n'a ni SIREN ni RCS. */
const NO_IDENTITY = {
  siren: '',
  siret: '',
  vatNumber: '',
  legalForm: null,
  rcsCity: '',
  shareCapital: 0,
  napCode: '',
} as const;

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cl-1',
    companyId: 'c-atelier',
    kind: 'COMPANY',
    name: 'Menuiserie Lavigne',
    contact: 'Claire Lavigne',
    email: 'compta@lavigne.example',
    phone: '+33 4 78 11 22 33',
    address: {
      street: '8 rue du Bois',
      postalCode: '69100',
      city: 'Villeurbanne',
      countryCode: 'FR',
    },
    identity: {
      siren: '452789123',
      siret: '45278912300015',
      vatNumber: 'FR89452789123',
      legalForm: 'SARL',
      rcsCity: 'Lyon',
      shareCapital: 15_000,
      napCode: '1623Z',
    },
    // Chantier livré à une adresse distincte du siège : la facture devra
    // porter l'adresse de livraison.
    deliveryAddress: {
      street: '22 avenue du Chantier',
      postalCode: '69200',
      city: 'Vénissieux',
      countryCode: 'FR',
    },
    paymentTermsDays: 30,
    creditLimit: 20_000,
    notes: '',
    active: true,
  },
  {
    id: 'cl-2',
    companyId: 'c-atelier',
    kind: 'INDIVIDUAL',
    name: 'Paul Mercier',
    contact: 'Paul Mercier',
    email: 'p.mercier@example.com',
    phone: '+33 6 12 34 56 78',
    address: {
      street: '3 impasse des Lilas',
      postalCode: '69007',
      city: 'Lyon',
      countryCode: 'FR',
    },
    identity: { ...NO_IDENTITY },
    deliveryAddress: null,
    paymentTermsDays: 0,
    creditLimit: 0,
    notes: 'Paiement comptant à la livraison.',
    active: true,
  },
  {
    id: 'cl-3',
    companyId: 'c-numeris',
    kind: 'COMPANY',
    name: 'Groupe Belland',
    contact: 'Sofia Belland',
    email: 'facturation@belland.example',
    phone: '+33 2 40 55 66 77',
    address: { street: '1 place Royale', postalCode: '44000', city: 'Nantes', countryCode: 'FR' },
    identity: {
      siren: '387654321',
      siret: '38765432100031',
      vatNumber: 'FR47387654321',
      legalForm: 'SA',
      rcsCity: 'Nantes',
      shareCapital: 250_000,
      napCode: '7022Z',
    },
    deliveryAddress: null,
    paymentTermsDays: 45,
    creditLimit: 60_000,
    notes: '',
    active: true,
  },
];

export const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: 'fo-1',
    companyId: 'c-atelier',
    kind: 'COMPANY',
    name: 'Bois du Rhône',
    contact: 'Service commercial',
    email: 'ventes@bois-rhone.example',
    phone: '+33 4 72 88 99 00',
    address: {
      street: '45 route de Vienne',
      postalCode: '69800',
      city: 'Saint-Priest',
      countryCode: 'FR',
    },
    identity: {
      siren: '512345987',
      siret: '51234598700012',
      vatNumber: 'FR21512345987',
      legalForm: 'SAS',
      rcsCity: 'Lyon',
      shareCapital: 80_000,
      napCode: '4673A',
    },
    iban: 'FR76 1234 5678 9012 3456 7890 189',
    defaultNature: 'GOODS',
    paymentTermsDays: 30,
    notes: '',
    active: true,
  },
  {
    id: 'fo-2',
    companyId: 'c-numeris',
    kind: 'COMPANY',
    name: 'Hébergeur Cloud FR',
    contact: 'Support entreprises',
    email: 'billing@cloud-fr.example',
    phone: '+33 1 70 00 00 00',
    address: { street: '2 rue de la Data', postalCode: '75012', city: 'Paris', countryCode: 'FR' },
    identity: {
      siren: '798765432',
      siret: '79876543200018',
      vatNumber: 'FR63798765432',
      legalForm: 'SAS',
      rcsCity: 'Paris',
      shareCapital: 120_000,
      napCode: '6311Z',
    },
    iban: 'FR76 3005 6009 0000 1234 5678 912',
    defaultNature: 'SERVICES',
    paymentTermsDays: 30,
    notes: 'Prélèvement mensuel.',
    active: true,
  },
];
