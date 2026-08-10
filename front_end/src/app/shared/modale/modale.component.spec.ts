import { TestBed } from '@angular/core/testing';
import { ModaleComponent } from './modale.component';

describe('ModaleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModaleComponent] }).compileComponents();
  });

  it('affiche le titre et le sous-titre', async () => {
    const fixture = TestBed.createComponent(ModaleComponent);
    fixture.componentRef.setInput('titre', 'Nouvelle facture');
    fixture.componentRef.setInput('sousTitre', 'Marque Nike');
    await fixture.whenStable();

    const texte = fixture.nativeElement.textContent as string;
    expect(texte).toContain('Nouvelle facture');
    expect(texte).toContain('Marque Nike');
  });

  it('émet la fermeture au clic sur le voile', async () => {
    const fixture = TestBed.createComponent(ModaleComponent);
    fixture.componentRef.setInput('titre', 'Test');
    let ferme = false;
    fixture.componentInstance.fermer.subscribe(() => (ferme = true));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(ferme).toBe(true);
  });
});
