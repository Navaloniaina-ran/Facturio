import { TestBed } from '@angular/core/testing';
import { EspaceStoreService } from '../../core/espace-store.service';
import { MARQUE_VIDE, MarqueService } from './marque.service';

describe('MarqueService', () => {
  let service: MarqueService;
  let store: EspaceStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarqueService);
    store = TestBed.inject(EspaceStoreService);
  });

  it('agrège le facturé, le payé et le reste dû par marque', () => {
    const nike = service.liste().find((m) => m.nom === 'Nike')!;

    expect(nike.nbFactures).toBe(2);
    expect(nike.totalFacture).toBeGreaterThan(0);
    expect(nike.totalFacture).toBe(nike.totalPaye + nike.resteDu);
  });

  it('signale les marques ayant une facture en retard', () => {
    expect(service.nbMauvaisPayeurs()).toBeGreaterThan(0);
    expect(service.liste().find((m) => m.nom === 'Glow Cosmetics')?.mauvaisPayeur).toBe(true);
  });

  it('refuse une marque sans nom', () => {
    expect(service.creer({ ...MARQUE_VIDE }).ok).toBe(false);
  });

  it('refuse un email mal formé', () => {
    expect(service.creer({ ...MARQUE_VIDE, nom: 'Adidas', email: 'contact' }).ok).toBe(false);
  });

  it('ajoute une marque valide', () => {
    const avant = store.marques().length;

    expect(service.creer({ ...MARQUE_VIDE, nom: 'Adidas', email: 'contact@adidas.example' }).ok).toBe(true);
    expect(store.marques().length).toBe(avant + 1);
  });

  it('bloque la création au-delà du quota de l’offre', () => {
    store.createur.update((createur) => ({ ...createur, plan: 'FREE' }));

    const resultat = service.creer({ ...MARQUE_VIDE, nom: 'Adidas' });

    expect(resultat.ok).toBe(false);
    expect(resultat.blocage?.message).toContain('Limite atteinte');
    expect(resultat.blocage?.planSuivant).toBe('STARTER');
  });

  it('protège une marque qui porte des factures', () => {
    const nike = service.liste().find((m) => m.nom === 'Nike')!;

    expect(service.supprimer(nike.id).ok).toBe(false);
  });

  it('exporte le portefeuille en CSV', () => {
    const csv = service.versCsv();

    expect(csv.split('\n')[0]).toContain('Nom');
    expect(csv).toContain('Nike');
  });
});
