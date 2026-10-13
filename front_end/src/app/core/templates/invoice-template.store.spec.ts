import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { httpErrorInterceptor } from '../http-error.interceptor';
import { I18nService } from '../i18n/i18n.service';
import { INVOICE_TEMPLATES_URL } from './invoice-template.api';
import { InvoiceTemplate } from './invoice-template.models';
import { createTemplateDocument } from './invoice-template.presets';
import { InvoiceTemplateStore } from './invoice-template.store';

function template(overrides: Partial<InvoiceTemplate> = {}): InvoiceTemplate {
  return {
    id: 't1',
    name: 'Mon modèle',
    isDefault: false,
    updatedAt: '2026-08-01T10:00:00Z',
    templateJson: createTemplateDocument(),
    ...overrides,
  };
}

describe('InvoiceTemplateStore', () => {
  let store: InvoiceTemplateStore;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(InvoiceTemplateStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('fr');
  });

  afterEach(() => http.verify());

  it('loads the templates from the API', async () => {
    const pending = store.loadAll();
    http
      .expectOne(INVOICE_TEMPLATES_URL)
      .flush([template(), template({ id: 't2', name: 'Autre' })]);
    await pending;

    expect(store.templates().length).toBe(2);
    expect(store.offline()).toBe(false);
  });

  it('falls back to the provided templates when the API is unreachable', async () => {
    const pending = store.loadAll();
    http.expectOne(INVOICE_TEMPLATES_URL).error(new ProgressEvent('error'), { status: 0 });
    await pending;

    expect(store.offline()).toBe(true);
    expect(store.templates().map((item) => item.name)).toContain('Moderne');
  });

  it('reports a 404 on a template that does not exist', async () => {
    const pending = store.loadOne('missing');
    http
      .expectOne(`${INVOICE_TEMPLATES_URL}/missing`)
      .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(await pending).toBeNull();
  });

  it('edits locally without ever calling the network', async () => {
    store.startEditing(template());

    store.updateTheme({ primaryColor: '#ff0000' });
    store.updateTheme({ fontFamily: 'Georgia', fontSize: 16 });
    store.moveBlock(0, 2);
    store.toggleBlock('logo-2');
    store.addBlock('notes');
    store.updatePage({ margin: 20 });

    const draft = store.draft()!;
    expect(draft.templateJson.settings.theme.primaryColor).toBe('#ff0000');
    expect(draft.templateJson.settings.theme.fontFamily).toBe('Georgia');
    expect(draft.templateJson.settings.page.margin).toBe(20);
    expect(store.dirty()).toBe(true);
    // Aucune requête : le réseau n'est sollicité qu'à l'enregistrement.
    http.expectNone(() => true);
  });

  it('reorders the blocks like a drag and drop does', () => {
    store.startEditing(template());
    const before = store.draft()!.templateJson.blocks.map((block) => block.type);

    store.moveBlock(0, 3);

    const after = store.draft()!.templateJson.blocks.map((block) => block.type);
    expect(after[3]).toBe(before[0]);
    expect(after.length).toBe(before.length);
  });

  it('hides and shows a block without removing it', () => {
    store.startEditing(template());
    const id = store.draft()!.templateJson.blocks[1].id;

    store.toggleBlock(id);
    expect(store.draft()!.templateJson.blocks[1].visible).toBe(false);

    store.toggleBlock(id);
    expect(store.draft()!.templateJson.blocks[1].visible).toBe(true);
  });

  it('removes a block and keeps a valid selection', () => {
    store.startEditing(template());
    const id = store.draft()!.templateJson.blocks[0].id;

    store.removeBlock(id);

    expect(store.draft()!.templateJson.blocks.some((block) => block.id === id)).toBe(false);
    expect(store.selectedBlockId()).not.toBe(id);
  });

  it('configures the columns of the items table', () => {
    store.startEditing(template());
    const items = store.draft()!.templateJson.blocks.find((block) => block.type === 'items')!;

    store.toggleColumn(items.id, 'discount');
    store.setColumnAlignment(items.id, 'description', 'center');
    store.moveColumn(items.id, 0, 1);

    const columns = store.draft()!.templateJson.blocks.find((block) => block.id === items.id)!
      .settings.columns!;
    expect(columns.find((column) => column.key === 'discount')?.visible).toBe(false);
    expect(columns.find((column) => column.key === 'description')?.align).toBe('center');
    expect(columns[1].key).toBe('description');
  });

  it('sends only the JSON configuration when saving', async () => {
    store.startEditing(template());
    store.updateTheme({ primaryColor: '#123456' });

    const pending = store.save();
    const request = http.expectOne(`${INVOICE_TEMPLATES_URL}/t1`);

    expect(request.request.method).toBe('PUT');
    expect(Object.keys(request.request.body as object).sort()).toEqual(['name', 'templateJson']);
    expect(
      (request.request.body as { templateJson: { settings: { theme: { primaryColor: string } } } })
        .templateJson.settings.theme.primaryColor,
    ).toBe('#123456');

    request.flush(template({ templateJson: store.draft()!.templateJson }));
    await pending;

    expect(store.dirty()).toBe(false);
    expect(store.savedAt()).not.toBeNull();
  });

  it('keeps the changes in memory when saving fails', async () => {
    store.startEditing(template());
    store.updateTheme({ primaryColor: '#abcdef' });

    const pending = store.save();
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t1`).error(new ProgressEvent('error'), { status: 0 });
    await pending;

    expect(store.offline()).toBe(true);
    expect(store.draft()!.templateJson.settings.theme.primaryColor).toBe('#abcdef');
  });

  it('creates a template from a provided one', async () => {
    const pending = store.create('Nouveau', 'corporate');
    const request = http.expectOne(INVOICE_TEMPLATES_URL);

    expect(request.request.method).toBe('POST');
    request.flush(template({ id: 't9', name: 'Nouveau' }));

    expect((await pending)?.id).toBe('t9');
    expect(store.templates()[0].name).toBe('Nouveau');
  });

  it('duplicates, deletes and sets the default template', async () => {
    const loaded = store.loadAll();
    http.expectOne(INVOICE_TEMPLATES_URL).flush([template(), template({ id: 't2' })]);
    await loaded;

    const duplicating = store.duplicate('t1');
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t1/duplicate`).flush(template({ id: 't3' }));
    await duplicating;
    expect(store.templates().length).toBe(3);

    const setting = store.setDefault('t2');
    http
      .expectOne(`${INVOICE_TEMPLATES_URL}/t2/default`)
      .flush(template({ id: 't2', isDefault: true }));
    await setting;
    expect(store.defaultTemplate()?.id).toBe('t2');

    const deleting = store.remove('t3');
    http.expectOne(`${INVOICE_TEMPLATES_URL}/t3`).flush(null);
    await deleting;
    expect(store.templates().some((item) => item.id === 't3')).toBe(false);
  });

  it('uploads the logo through the backend', async () => {
    store.startEditing(template());
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    const pending = store.uploadLogo(file);
    const request = http.expectOne(`${INVOICE_TEMPLATES_URL}/t1/logo`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    request.flush({ url: 'https://cdn.example/logo.png' });

    expect(await pending).toBe('https://cdn.example/logo.png');
  });
});
