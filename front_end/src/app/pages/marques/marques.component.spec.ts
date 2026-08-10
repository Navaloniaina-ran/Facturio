import { TestBed } from '@angular/core/testing';
import { MarquesComponent } from './marques.component';
import { MarqueService } from './marque.service';

describe('MarquesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarquesComponent] }).compileComponents();
  });

  async function creer() {
    const fixture = TestBed.createComponent(MarquesComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('liste les marques de l’espace', async () => {
    const fixture = await creer();
    const texte = fixture.nativeElement.textContent as string;

    expect(texte).toContain('Nike');
    expect(texte).toContain('Glow Cosmetics');
  });

  it('filtre sur la recherche saisie', async () => {
    const fixture = await creer();
    const champ = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;

    champ.value = 'glow';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const texte = fixture.nativeElement.textContent as string;
    expect(texte).toContain('Glow Cosmetics');
    expect(texte).not.toContain('Studio Kama');
  });

  it('ne garde que les mauvais payeurs quand le filtre est actif', async () => {
    const fixture = await creer();
    const service = TestBed.inject(MarqueService);
    const attendus = service.liste().filter((m) => m.mauvaisPayeur).length;

    const bouton = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Mauvais payeurs'),
    ) as HTMLButtonElement;
    bouton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(attendus);
  });

  it('ouvre le formulaire de création', async () => {
    const fixture = await creer();
    const bouton = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Nouvelle marque'),
    ) as HTMLButtonElement;

    bouton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modale')).toBeTruthy();
  });
});
