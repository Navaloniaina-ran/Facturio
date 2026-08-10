import { TestBed } from '@angular/core/testing';
import { BadgeStatutComponent } from './badge-statut.component';

describe('BadgeStatutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeStatutComponent] }).compileComponents();
  });

  it('traduit le code du statut', async () => {
    const fixture = TestBed.createComponent(BadgeStatutComponent);
    fixture.componentRef.setInput('statut', 'PARTIELLEMENT_PAYEE');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Partiellement payée');
  });

  it('affiche le complément quand il est fourni', async () => {
    const fixture = TestBed.createComponent(BadgeStatutComponent);
    fixture.componentRef.setInput('statut', 'EN_RETARD');
    fixture.componentRef.setInput('complement', '12 j');
    await fixture.whenStable();

    const texte = fixture.nativeElement.textContent as string;
    expect(texte).toContain('En retard');
    expect(texte).toContain('12 j');
  });

  it('applique le ton rouge à un retard', async () => {
    const fixture = TestBed.createComponent(BadgeStatutComponent);
    fixture.componentRef.setInput('statut', 'EN_RETARD');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('span')?.className).toContain('text-rose-700');
  });
});
