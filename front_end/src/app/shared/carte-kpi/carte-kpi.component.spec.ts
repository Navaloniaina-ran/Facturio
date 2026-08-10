import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarteKpiComponent } from './carte-kpi.component';

describe('CarteKpiComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteKpiComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function creer(filtre: string | null = null) {
    const fixture = TestBed.createComponent(CarteKpiComponent);
    fixture.componentRef.setInput('libelle', 'En retard');
    fixture.componentRef.setInput('valeur', '800 €');
    fixture.componentRef.setInput('lien', '/app/factures');
    fixture.componentRef.setInput('filtre', filtre);
    await fixture.whenStable();
    return fixture;
  }

  it('affiche le libellé et la valeur', async () => {
    const fixture = await creer();
    const texte = fixture.nativeElement.textContent as string;

    expect(texte).toContain('En retard');
    expect(texte).toContain('800 €');
  });

  it('renvoie vers la liste filtrée correspondante', async () => {
    const fixture = await creer('EN_RETARD');
    const lien = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(lien.getAttribute('href')).toBe('/app/factures?statut=EN_RETARD');
  });
});
