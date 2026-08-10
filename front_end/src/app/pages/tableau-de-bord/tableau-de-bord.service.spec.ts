import { TestBed } from '@angular/core/testing';
import { TableauDeBordService } from './tableau-de-bord.service';

describe('TableauDeBordService', () => {
  let tdb: TableauDeBordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    tdb = TestBed.inject(TableauDeBordService);
  });

  it('sépare le chiffre d’affaires, l’encaissé et le reste à recevoir', () => {
    expect(tdb.chiffreAffaires()).toBeGreaterThan(0);
    expect(tdb.encaisse()).toBeGreaterThan(0);
    expect(tdb.chiffreAffaires()).toBeGreaterThanOrEqual(tdb.encaisse());
  });

  it('remonte les factures en retard', () => {
    expect(tdb.nbEnRetard()).toBeGreaterThan(0);
    expect(tdb.enRetard()).toBeGreaterThan(0);
  });

  it('limite les échéances au sept prochains jours', () => {
    for (const facture of tdb.prochainesEcheances()) {
      expect(facture.resteDu).toBeGreaterThan(0);
    }
  });

  it('produit six points de revenus normalisés', () => {
    const points = tdb.revenusSixMois();

    expect(points.length).toBe(6);
    for (const point of points) {
      expect(point.part).toBeGreaterThanOrEqual(4);
      expect(point.part).toBeLessThanOrEqual(100);
    }
  });

  it('liste les tâches d’onboarding non terminées', () => {
    expect(tdb.onboardingRestant().length).toBeGreaterThan(0);
  });
});
