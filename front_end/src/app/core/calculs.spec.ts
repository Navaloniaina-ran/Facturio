import {
  ajouterJours,
  calculerTotaux,
  delaiMoyenPaiement,
  joursDeRetard,
  montantPaye,
  numeroDocument,
  resteDu,
  statutRecalcule,
  totalLigne,
} from './calculs';
import { Facture, Ligne, Paiement } from './modeles';

function ligne(partiel: Partial<Ligne> = {}): Ligne {
  return {
    id: 'l1',
    description: 'Reel Instagram',
    typeLivrable: 'REEL',
    quantite: 1,
    prixUnitaire: 1000,
    remisePourcent: 0,
    tauxTva: 20,
    ...partiel,
  };
}

function facture(partiel: Partial<Facture> = {}): Facture {
  return {
    id: 'f1',
    numero: 'FAC-2026-0001',
    marqueId: 'm1',
    campagneId: null,
    propositionId: null,
    dateEmission: '2026-08-01',
    dateEcheance: '2026-08-31',
    statut: 'ENVOYEE',
    lignes: [ligne({ prixUnitaire: 3000, tauxTva: 0 })],
    acomptePourcent: 0,
    conditions: '',
    ...partiel,
  };
}

describe('calculs', () => {
  it('applique la remise de ligne sur quantité × prix unitaire', () => {
    expect(totalLigne(ligne({ quantite: 2, prixUnitaire: 500, remisePourcent: 10 }))).toBe(900);
  });

  // Critère de recette A05 du cahier des charges.
  it('calcule 1 000 € HT avec remise de 10 % et TVA 20 % → 900 / 180 / 1 080', () => {
    const totaux = calculerTotaux([ligne({ prixUnitaire: 1000, remisePourcent: 10 })]);

    expect(totaux.totalHt).toBe(900);
    expect(totaux.totalTva).toBe(180);
    expect(totaux.totalTtc).toBe(1080);
  });

  it('ventile la TVA par taux et non par ligne', () => {
    const totaux = calculerTotaux([
      ligne({ id: 'a', prixUnitaire: 100, tauxTva: 20 }),
      ligne({ id: 'b', prixUnitaire: 200, tauxTva: 20 }),
      ligne({ id: 'c', prixUnitaire: 100, tauxTva: 10 }),
    ]);

    expect(totaux.ventilationTva).toEqual([
      { taux: 20, base: 300, montant: 60 },
      { taux: 10, base: 100, montant: 10 },
    ]);
    expect(totaux.totalTtc).toBe(470);
  });

  // Critère de recette A07 du cahier des charges.
  it('calcule le reste dû après deux paiements partiels', () => {
    const f = facture();
    const paiements: Paiement[] = [
      { id: 'p1', factureId: 'f1', montant: 1000, date: '2026-08-05', methode: 'VIREMENT', reference: '', note: '' },
      { id: 'p2', factureId: 'f1', montant: 1000, date: '2026-08-12', methode: 'VIREMENT', reference: '', note: '' },
    ];

    expect(montantPaye('f1', paiements)).toBe(2000);
    expect(resteDu(f, paiements)).toBe(1000);
    expect(statutRecalcule(f, paiements, '2026-08-15')).toBe('PARTIELLEMENT_PAYEE');
  });

  // Critère de recette A08 du cahier des charges.
  it('bascule en retard le lendemain de l’échéance si le solde est non nul', () => {
    const f = facture({ dateEcheance: '2026-08-10' });

    expect(statutRecalcule(f, [], '2026-08-10')).toBe('ENVOYEE');
    expect(statutRecalcule(f, [], '2026-08-14')).toBe('EN_RETARD');
    expect(joursDeRetard(f, [], '2026-08-14')).toBe(4);
  });

  it('passe en payée et sans retard dès que le solde est nul', () => {
    const f = facture({ dateEcheance: '2026-08-01' });
    const paiements: Paiement[] = [
      { id: 'p1', factureId: 'f1', montant: 3000, date: '2026-08-03', methode: 'CARTE', reference: '', note: '' },
    ];

    expect(statutRecalcule(f, paiements, '2026-08-14')).toBe('PAYEE');
    expect(joursDeRetard(f, paiements, '2026-08-14')).toBe(0);
  });

  it('ne recalcule jamais un brouillon ni une facture annulée', () => {
    expect(statutRecalcule(facture({ statut: 'BROUILLON' }), [], '2027-01-01')).toBe('BROUILLON');
    expect(statutRecalcule(facture({ statut: 'ANNULEE' }), [], '2027-01-01')).toBe('ANNULEE');
  });

  it('formate la numérotation des documents', () => {
    expect(numeroDocument('FAC', 2026, 42)).toBe('FAC-2026-0042');
  });

  it('décale une date d’un nombre de jours', () => {
    expect(ajouterJours('2026-08-31', 3)).toBe('2026-09-03');
  });

  it('calcule le délai moyen de paiement sur les factures soldées', () => {
    const f = facture({ dateEmission: '2026-08-01' });
    const paiements: Paiement[] = [
      { id: 'p1', factureId: 'f1', montant: 3000, date: '2026-08-11', methode: 'VIREMENT', reference: '', note: '' },
    ];

    expect(delaiMoyenPaiement([f], paiements)).toBe(10);
  });
});
