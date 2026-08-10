import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TableauDeBordComponent } from './tableau-de-bord.component';
import { TableauDeBordService } from './tableau-de-bord.service';

describe('TableauDeBordComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauDeBordComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function creer() {
    const fixture = TestBed.createComponent(TableauDeBordComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('affiche les quatre indicateurs obligatoires', async () => {
    const fixture = await creer();
    const cartes = fixture.nativeElement.querySelectorAll('app-carte-kpi');

    expect(cartes.length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain("Chiffre d'affaires");
    expect(fixture.nativeElement.textContent).toContain('En retard');
  });

  it('rend chaque indicateur cliquable vers la liste filtrée', async () => {
    const fixture = await creer();
    const liens = [...fixture.nativeElement.querySelectorAll('app-carte-kpi a')] as HTMLAnchorElement[];
    const cibles = liens.map((lien) => lien.getAttribute('href'));

    expect(cibles).toContain('/app/factures?statut=EN_RETARD');
    expect(cibles).toContain('/app/paiements');
  });

  it('affiche six barres de revenus et les campagnes actives', async () => {
    const fixture = await creer();
    const tdb = TestBed.inject(TableauDeBordService);

    expect(tdb.revenusSixMois().length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Campagnes actives');
    expect(fixture.nativeElement.textContent).toContain('Nike Summer');
  });

  it('propose une relance rapide sur une facture en retard', async () => {
    const fixture = await creer();
    const texte = fixture.nativeElement.textContent as string;

    expect(TestBed.inject(TableauDeBordService).nbEnRetard()).toBeGreaterThan(0);
    expect(texte).toContain('Relancer');
  });
});
