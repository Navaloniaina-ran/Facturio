import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { httpErrorInterceptor } from '../../core/http-error.interceptor';
import { I18nService } from '../../core/i18n/i18n.service';
import { INVOICE_TEMPLATES_URL } from '../../core/templates/invoice-template.api';
import { InvoiceTemplate } from '../../core/templates/invoice-template.models';
import { createTemplateDocument } from '../../core/templates/invoice-template.presets';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { InvoiceTemplatesComponent } from './invoice-templates.component';

function template(overrides: Partial<InvoiceTemplate> = {}): InvoiceTemplate {
  return {
    id: 't1',
    name: 'Moderne maison',
    isDefault: true,
    updatedAt: '2026-08-01T10:00:00Z',
    templateJson: createTemplateDocument(),
    ...overrides,
  };
}

describe('InvoiceTemplatesComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        // La création d'un modèle enchaîne sur son éditeur : la route doit exister.
        provideRouter([{ path: 'createur/modeles/:id/edition', children: [] }]),
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('fr');
  });

  /** Le composant charge la liste dès sa construction. */
  async function create(templates: InvoiceTemplate[] | 'error' = [template()]) {
    const fixture = TestBed.createComponent(InvoiceTemplatesComponent);
    const request = http.expectOne(INVOICE_TEMPLATES_URL);

    if (templates === 'error') {
      request.error(new ProgressEvent('error'), { status: 0 });
    } else {
      request.flush(templates);
    }

    await fixture.whenStable();
    return fixture;
  }

  function click(fixture: ComponentFixture<InvoiceTemplatesComponent>, label: string) {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
  }

  it('lists the templates with a preview and the default badge', async () => {
    const fixture = await create([
      template(),
      template({ id: 't2', name: 'Sobre', isDefault: false }),
    ]);
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelectorAll('article.card').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('app-invoice-template-preview').length).toBe(2);
    expect(text).toContain('Moderne maison');
    expect(text).toContain('Par défaut');
  });

  it('renders a realistic sample invoice inside each preview', async () => {
    const fixture = await create();
    const preview = fixture.nativeElement.querySelector(
      'app-invoice-template-preview',
    ) as HTMLElement;

    expect(preview.textContent).toContain('INV-2026-001');
    expect(preview.textContent).toContain('Client Demo');
    expect(preview.textContent).toContain('Produit A');
    expect(preview.textContent).toContain('Total TTC');
  });

  it('shows the empty state when the workspace has no template', async () => {
    const fixture = await create([]);

    expect(fixture.nativeElement.textContent).toContain('Aucun modèle pour l’instant');
  });

  it('warns and serves the provided templates when the API fails', async () => {
    const fixture = await create('error');

    expect(fixture.nativeElement.textContent).toContain('API des modèles injoignable');
    expect(TestBed.inject(InvoiceTemplateStore).templates().length).toBe(5);
  });

  it('creates a template from a provided one', async () => {
    const fixture = await create();

    click(fixture, 'Nouveau modèle');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();

    click(fixture, 'Créer le modèle');
    const request = http.expectOne(INVOICE_TEMPLATES_URL);
    expect(request.request.method).toBe('POST');
    request.flush(template({ id: 't9', name: 'Mon modèle', isDefault: false }));
    await fixture.whenStable();

    expect(TestBed.inject(InvoiceTemplateStore).templates()[0].id).toBe('t9');
  });

  it('duplicates a template', async () => {
    const fixture = await create();

    (fixture.nativeElement.querySelector('[title="Dupliquer"]') as HTMLButtonElement).click();
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t1/duplicate`).flush(template({ id: 't2' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('article.card').length).toBe(2);
  });

  it('sets a template as default', async () => {
    const fixture = await create([template({ isDefault: false })]);

    (
      fixture.nativeElement.querySelector('[title="Définir comme défaut"]') as HTMLButtonElement
    ).click();
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t1/default`).flush(template());
    await fixture.whenStable();

    expect(TestBed.inject(InvoiceTemplateStore).defaultTemplate()?.id).toBe('t1');
  });

  it('asks for confirmation before deleting', async () => {
    const fixture = await create();

    (fixture.nativeElement.querySelector('[title="Supprimer"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('définitivement supprimé');
    // Rien n'est parti sur le réseau avant la confirmation.
    http.expectNone(`${INVOICE_TEMPLATES_URL}/t1`);

    click(fixture, 'Confirmer la suppression');
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t1`).flush(null);
    await fixture.whenStable();

    expect(TestBed.inject(InvoiceTemplateStore).templates().length).toBe(0);
  });

  it('translates the screen', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Invoice templates');
  });
});
