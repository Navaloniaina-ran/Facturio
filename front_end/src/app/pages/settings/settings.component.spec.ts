import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { SettingsComponent } from './settings.component';
import { SettingsService } from './settings.service';

describe('SettingsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [SettingsComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(SettingsComponent);
    await fixture.whenStable();
    return fixture;
  }

  function fill(fixture: { nativeElement: HTMLElement }, selector: string, value: string) {
    const field = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function submit(fixture: { nativeElement: HTMLElement }) {
    fixture.nativeElement.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  /** L'aperçu du résultat, rendu à côté du formulaire. */
  function preview(fixture: { nativeElement: HTMLElement }) {
    return fixture.nativeElement.querySelector('app-invoice-preview') as HTMLElement;
  }

  /**
   * Choix d'un fichier comme le fait l'utilisateur. La lecture passe par
   * FileReader : on laisse la tâche se terminer avant de rendre à nouveau.
   */
  async function chooseFile(
    fixture: { nativeElement: HTMLElement; whenStable: () => Promise<unknown> },
    file: File,
  ) {
    const input = fixture.nativeElement.querySelector('#logo') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));

    // La lecture de FileReader ne tient pas dans une seule tâche.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
    }
  }

  it('groups what is only set once, and says what each group changes', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Identité et coordonnées');
    expect(text).toContain('Documents et numérotation');
    expect(text).toContain('Mentions des documents');
    expect(text).toContain('Bloc émetteur');
    expect(text).toContain('Séries de numérotation');
  });

  it('never asks for a VAT rate and says where it moved', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('TVA par défaut');
    expect(text).toContain('La TVA ne se paramètre plus ici');
  });

  it('announces the next number of each series', async () => {
    const fixture = await create();
    const service = TestBed.inject(SettingsService);
    const settings = TestBed.inject(WorkspaceStore).settings();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain(service.nextNumberFor(settings.invoicePrefix));
    expect(text).toContain(service.nextNumberFor(settings.quotePrefix));
    expect(text).toContain(service.nextNumberFor(settings.creditPrefix));
  });

  it('shows a sample invoice beside the form', async () => {
    const fixture = await create();

    expect(preview(fixture).textContent).toContain('Marque Exemple');
    expect(preview(fixture).textContent).toContain('Reel Instagram');
    // Aperçu illustratif : ni barre d'impression, ni zone imprimable.
    expect(preview(fixture).textContent).not.toContain('Imprimer');
    expect(preview(fixture).querySelector('.printable')).toBeNull();
  });

  it('mirrors an identity change in the preview before saving', async () => {
    const fixture = await create();

    fill(fixture, '#businessName', 'Studio Kama');
    await fixture.whenStable();

    expect(preview(fixture).textContent).toContain('Studio Kama');
    expect(fixture.nativeElement.textContent).toContain('Modifications non enregistrées');
    // Rien n'est appliqué avant enregistrement.
    expect(TestBed.inject(WorkspaceStore).settings().businessName).not.toBe('Studio Kama');
  });

  it('renumbers the sample invoice when the prefix changes', async () => {
    const fixture = await create();

    fill(fixture, '#invoicePrefix', 'STU');
    await fixture.whenStable();

    expect(preview(fixture).textContent).toContain('STU-');
  });

  it('discards the draft on request', async () => {
    const fixture = await create();

    fill(fixture, '#businessName', 'Autre nom');
    await fixture.whenStable();

    const revert = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes('Annuler les modifications'),
    ) as HTMLButtonElement;
    revert.click();
    await fixture.whenStable();

    expect(preview(fixture).textContent).not.toContain('Autre nom');
    expect(fixture.nativeElement.textContent).not.toContain('Modifications non enregistrées');
  });

  it('saves the prefixes in upper case', async () => {
    const fixture = await create();

    fill(fixture, '#invoicePrefix', 'inv');
    submit(fixture);
    await fixture.whenStable();

    expect(TestBed.inject(WorkspaceStore).settings().invoicePrefix).toBe('INV');
    expect(fixture.nativeElement.textContent).toContain('Paramètres enregistrés');
  });

  it('refuses a prefix that is not two to six letters', async () => {
    const fixture = await create();

    fill(fixture, '#invoicePrefix', 'F1');
    submit(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('préfixes doivent contenir');
    expect(TestBed.inject(WorkspaceStore).settings().invoicePrefix).toBe('FAC');
  });

  it('shows the logo in the preview, and applies it once saved', async () => {
    const file = new File(['png'], 'logo.png', { type: 'image/png' });
    const store = TestBed.inject(WorkspaceStore);
    const fixture = await create();

    await chooseFile(fixture, file);

    expect(preview(fixture).querySelector('img')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Enregistrez pour l’appliquer');
    expect(store.settings().logo).toBeNull();

    submit(fixture);
    await fixture.whenStable();

    expect(store.settings().logo).toContain('data:image/png');
  });

  it('refuses a file that is not an accepted image', async () => {
    const fixture = await create();

    await chooseFile(fixture, new File(['x'], 'contrat.pdf', { type: 'application/pdf' }));

    expect(fixture.nativeElement.textContent).toContain('Formats acceptés');
  });

  it('removes the logo from the draft', async () => {
    const store = TestBed.inject(WorkspaceStore);
    store.settings.update((settings) => ({ ...settings, logo: 'data:image/png;base64,AAA' }));

    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes('Retirer le logo'),
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(preview(fixture).querySelector('img')).toBeNull();

    submit(fixture);
    await fixture.whenStable();

    expect(store.settings().logo).toBeNull();
  });
});
