/**
 * Contrat des modèles de facture, aligné sur l'API REST
 * `/api/invoice-templates`. Le front ne porte aucune règle financière :
 * il manipule uniquement la configuration d'affichage (templateJson).
 */

export type TemplateBlockType =
  'header' | 'logo' | 'customer' | 'info' | 'items' | 'totals' | 'payment' | 'notes' | 'footer';

export type TemplateAlignment = 'left' | 'center' | 'right';

/** Colonnes configurables du tableau des produits. */
export type ItemsColumnKey =
  'description' | 'quantity' | 'unitPrice' | 'discount' | 'vat' | 'total';

export interface ItemsColumn {
  key: ItemsColumnKey;
  visible: boolean;
  align: TemplateAlignment;
}

/** Réglages d'un bloc. Tous optionnels : chaque type n'en lit qu'une partie. */
export interface InvoiceTemplateBlockSettings {
  title?: string;
  alignment?: TemplateAlignment;
  /** Largeur du logo en pixels. */
  logoWidth?: number;
  showLabels?: boolean;
  showVatBreakdown?: boolean;
  showDeposit?: boolean;
  showOutstanding?: boolean;
  showBankDetails?: boolean;
  columns?: ItemsColumn[];
  text?: string;
}

export interface InvoiceTemplateBlock {
  id: string;
  type: TemplateBlockType;
  visible: boolean;
  settings: InvoiceTemplateBlockSettings;
}

export interface InvoiceTemplateTheme {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  borderColor: string;
  tableHeaderColor: string;
  fontFamily: string;
  /** Taille de base en pixels. */
  fontSize: number;
  fontWeight: number;
}

export interface InvoiceTemplatePage {
  /** Marge extérieure de la feuille, en millimètres. */
  margin: number;
  /** Espacement intérieur des blocs, en pixels. */
  padding: number;
  alignment: TemplateAlignment;
  border: boolean;
  borderRadius: number;
}

export interface InvoiceTemplateSettings {
  theme: InvoiceTemplateTheme;
  page: InvoiceTemplatePage;
}

/** Le JSON réellement stocké et envoyé au backend. */
export interface InvoiceTemplateDocument {
  /** Version du schéma, pour migrer sans casser les modèles existants. */
  schemaVersion: number;
  blocks: InvoiceTemplateBlock[];
  settings: InvoiceTemplateSettings;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  /** Renseigné par le backend. */
  updatedAt: string;
  /** Vrai pour les modèles fournis par la plateforme. */
  isPreset?: boolean;
  templateJson: InvoiceTemplateDocument;
}

export interface InvoiceTemplateVersion {
  id: string;
  templateId: string;
  label: string;
  createdAt: string;
}

/** Charge utile d'écriture : le backend reste maître de l'identité et des dates. */
export interface InvoiceTemplatePayload {
  name: string;
  templateJson: InvoiceTemplateDocument;
}

/** Réponse de l'upload de logo. */
export interface TemplateLogoUpload {
  url: string;
}

export const TEMPLATE_SCHEMA_VERSION = 1;

/** Ordre d'apparition des blocs dans la palette. */
export const TEMPLATE_BLOCK_TYPES: TemplateBlockType[] = [
  'header',
  'logo',
  'customer',
  'info',
  'items',
  'totals',
  'payment',
  'notes',
  'footer',
];

export const ITEMS_COLUMN_KEYS: ItemsColumnKey[] = [
  'description',
  'quantity',
  'unitPrice',
  'discount',
  'vat',
  'total',
];

export const DEFAULT_ITEMS_COLUMNS: ItemsColumn[] = [
  { key: 'description', visible: true, align: 'left' },
  { key: 'quantity', visible: true, align: 'right' },
  { key: 'unitPrice', visible: true, align: 'right' },
  { key: 'discount', visible: true, align: 'right' },
  { key: 'vat', visible: true, align: 'right' },
  { key: 'total', visible: true, align: 'right' },
];
