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

  it('groups what is only set once', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Identité et coordonnées');
    expect(text).toContain('Documents et numérotation');
    expect(text).toContain('Mentions des documents');
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
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain(service.nextInvoiceNumber());
    expect(text).toContain(service.nextQuoteNumber());
    expect(text).toContain(service.nextCreditNumber());
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

  it('removes the logo once one is set', async () => {
    const store = TestBed.inject(WorkspaceStore);
    store.settings.update((settings) => ({ ...settings, logo: 'data:image/png;base64,AAA' }));

    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes('Retirer le logo'),
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(store.settings().logo).toBeNull();
  });
});
