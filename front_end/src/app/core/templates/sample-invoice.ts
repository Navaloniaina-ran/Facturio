/**
 * Facture fictive de l'aperçu.
 *
 * Les montants sont des littéraux d'illustration : aucun calcul financier
 * n'est effectué ici. Sur une facture réelle, les totaux proviennent du
 * backend, qui reste seul responsable des règles de calcul.
 */

export interface SampleInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  vat: string;
  total: string;
}

export interface SampleVatLine {
  label: string;
  amount: string;
}

export interface SampleInvoice {
  number: string;
  issueDate: string;
  dueDate: string;
  company: { name: string; address: string; taxId: string; logoUrl: string | null };
  customer: { name: string; address: string; email: string };
  lines: SampleInvoiceLine[];
  subtotalLabel: string;
  subtotal: string;
  vatLines: SampleVatLine[];
  totalLabel: string;
  total: string;
  deposit: string;
  paid: string;
  outstanding: string;
  paymentTerms: string;
  bankDetails: string;
  notes: string;
  footer: string;
}

export const SAMPLE_INVOICE: SampleInvoice = {
  number: 'INV-2026-001',
  issueDate: '10/08/2026',
  dueDate: '09/09/2026',
  company: {
    name: 'Entreprise Demo',
    address: '18 rue des Créateurs, 75011 Paris',
    taxId: 'FR 42 123 456 789',
    logoUrl: null,
  },
  customer: {
    name: 'Client Demo',
    address: '12 avenue de la Marque, 69003 Lyon',
    email: 'contact@client-demo.example',
  },
  lines: [
    {
      description: 'Produit A',
      quantity: 2,
      unitPrice: '500,00 €',
      discount: '—',
      vat: '20 %',
      total: '1 000,00 €',
    },
    {
      description: 'Produit B',
      quantity: 1,
      unitPrice: '300,00 €',
      discount: '10 %',
      vat: '20 %',
      total: '270,00 €',
    },
  ],
  subtotalLabel: 'Sous-total',
  subtotal: '1 270,00 €',
  vatLines: [{ label: 'TVA 20 %', amount: '254,00 €' }],
  totalLabel: 'Total TTC',
  total: '1 524,00 €',
  deposit: '762,00 €',
  paid: '500,00 €',
  outstanding: '1 024,00 €',
  paymentTerms: 'Paiement par virement sous 30 jours.',
  bankDetails: 'FR76 3000 4000 0312 3456 7890 143',
  notes: 'Merci de rappeler le numéro de facture lors du règlement.',
  footer: 'Entreprise Demo · SIRET 123 456 789 00012 · TVA FR 42 123 456 789',
};
