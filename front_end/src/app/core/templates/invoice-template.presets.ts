import {
  DEFAULT_ITEMS_COLUMNS,
  InvoiceTemplate,
  InvoiceTemplateBlock,
  InvoiceTemplateBlockSettings,
  InvoiceTemplateDocument,
  InvoiceTemplateSettings,
  TEMPLATE_SCHEMA_VERSION,
  TemplateBlockType,
} from './invoice-template.models';

/**
 * Modèles fournis par la plateforme. Ils sortent de la même fabrique et du
 * même JSON que les modèles utilisateurs : un seul système, quatre réglages.
 */

const DEFAULT_ORDER: TemplateBlockType[] = [
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

/** Réglages par défaut d'un bloc, selon son type. */
export function defaultBlock(type: TemplateBlockType, index = 0): InvoiceTemplateBlock {
  const settings: InvoiceTemplateBlock['settings'] = { alignment: 'left' };

  if (type === 'logo') {
    settings.logoWidth = 140;
    settings.alignment = 'left';
  }
  if (type === 'items') {
    settings.columns = DEFAULT_ITEMS_COLUMNS.map((column) => ({ ...column }));
  }
  if (type === 'totals') {
    settings.showVatBreakdown = true;
    settings.showDeposit = true;
    settings.showOutstanding = true;
    settings.alignment = 'right';
  }
  if (type === 'payment') {
    settings.showBankDetails = true;
  }
  if (type === 'customer' || type === 'info') {
    settings.showLabels = true;
  }
  if (type === 'footer') {
    settings.alignment = 'center';
  }

  return { id: `${type}-${index + 1}`, type, visible: true, settings };
}

function baseSettings(): InvoiceTemplateSettings {
  return {
    theme: {
      primaryColor: '#5b2ff0',
      secondaryColor: '#f3f2ff',
      textColor: '#0f172a',
      borderColor: '#e2e8f0',
      tableHeaderColor: '#f1f5f9',
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 400,
    },
    page: { margin: 14, padding: 16, alignment: 'left', border: true, borderRadius: 12 },
  };
}

/** Document complet, dans l'ordre par défaut. */
export function createTemplateDocument(
  overrides: Partial<InvoiceTemplateSettings> = {},
  order: TemplateBlockType[] = DEFAULT_ORDER,
  blockSettings: Partial<Record<TemplateBlockType, InvoiceTemplateBlockSettings>> = {},
): InvoiceTemplateDocument {
  const settings = baseSettings();

  return {
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    blocks: order.map((type, index) => {
      const block = defaultBlock(type, index);
      return { ...block, settings: { ...block.settings, ...blockSettings[type] } };
    }),
    settings: {
      theme: { ...settings.theme, ...overrides.theme },
      page: { ...settings.page, ...overrides.page },
    },
  };
}

/**
 * Mentions que le Code de commerce impose sur toute facture entre
 * professionnels. Elles sont identiques d'une PME à l'autre : leur place est
 * donc dans le modèle, et non dans les données de la facture.
 */
const PME_LEGAL_NOTICE = [
  "Pénalités de retard : 3 fois le taux d'intérêt légal en vigueur (art. L441-10 du Code de commerce).",
  'Indemnité forfaitaire pour frais de recouvrement : 40 € (art. D441-5).',
  "Pas d'escompte pour paiement anticipé.",
].join(' ');

export interface TemplatePreset {
  key: string;
  name: string;
  document: InvoiceTemplateDocument;
}

/** Les quatre modèles de départ. */
export function templatePresets(): TemplatePreset[] {
  return [
    {
      key: 'minimal',
      name: 'Minimal',
      document: createTemplateDocument({
        theme: {
          primaryColor: '#0f172a',
          secondaryColor: '#f8fafc',
          textColor: '#0f172a',
          borderColor: '#e2e8f0',
          tableHeaderColor: '#ffffff',
          fontFamily: 'Inter',
          fontSize: 12,
          fontWeight: 400,
        },
        page: { margin: 18, padding: 12, alignment: 'left', border: false, borderRadius: 0 },
      }),
    },
    {
      key: 'modern',
      name: 'Moderne',
      document: createTemplateDocument({
        theme: {
          primaryColor: '#5b2ff0',
          secondaryColor: '#f3f2ff',
          textColor: '#0f172a',
          borderColor: '#e8e6ff',
          tableHeaderColor: '#f3f2ff',
          fontFamily: 'Inter',
          fontSize: 13,
          fontWeight: 400,
        },
        page: { margin: 14, padding: 16, alignment: 'left', border: true, borderRadius: 16 },
      }),
    },
    {
      key: 'corporate',
      name: 'Corporate',
      document: createTemplateDocument({
        theme: {
          primaryColor: '#1d4ed8',
          secondaryColor: '#eff6ff',
          textColor: '#111827',
          borderColor: '#cbd5e1',
          tableHeaderColor: '#e2e8f0',
          fontFamily: 'Georgia',
          fontSize: 13,
          fontWeight: 400,
        },
        page: { margin: 16, padding: 18, alignment: 'left', border: true, borderRadius: 4 },
      }),
    },
    {
      key: 'elegant',
      name: 'Élégant',
      document: createTemplateDocument(
        {
          theme: {
            primaryColor: '#0f766e',
            secondaryColor: '#f0fdfa',
            textColor: '#134e4a',
            borderColor: '#ccfbf1',
            tableHeaderColor: '#f0fdfa',
            fontFamily: 'Georgia',
            fontSize: 13,
            fontWeight: 300,
          },
          page: { margin: 20, padding: 20, alignment: 'center', border: false, borderRadius: 20 },
        },
        ['logo', 'header', 'customer', 'info', 'items', 'totals', 'notes', 'payment', 'footer'],
      ),
    },
    {
      key: 'pme',
      name: 'PME',
      document: createTemplateDocument(
        {
          theme: {
            primaryColor: '#334155',
            secondaryColor: '#f8fafc',
            textColor: '#1e293b',
            borderColor: '#cbd5e1',
            tableHeaderColor: '#e2e8f0',
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 400,
          },
          page: { margin: 16, padding: 14, alignment: 'left', border: true, borderRadius: 6 },
        },
        // L'ordre par défaut place déjà les mentions légales entre le RIB et
        // l'identité de l'émetteur, à leur place habituelle sur une facture.
        // Le détail de TVA et les coordonnées bancaires, eux aussi attendus
        // sur une facture B2B, sont déjà actifs par défaut.
        DEFAULT_ORDER,
        { notes: { title: 'Mentions légales', text: PME_LEGAL_NOTICE } },
      ),
    },
  ];
}

/**
 * Jeu de modèles servi lorsque l'API n'est pas joignable : l'écran reste
 * utilisable et l'interface signale explicitement le mode hors ligne.
 */
export function presetTemplates(): InvoiceTemplate[] {
  return templatePresets().map((preset, index) => ({
    id: `preset-${preset.key}`,
    name: preset.name,
    isDefault: index === 1,
    isPreset: true,
    updatedAt: '',
    templateJson: preset.document,
  }));
}
