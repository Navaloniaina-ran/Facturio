import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { httpErrorInterceptor } from '../../core/http-error.interceptor';
import { I18nService } from '../../core/i18n/i18n.service';
import { INVOICE_TEMPLATES_URL } from '../../core/templates/invoice-template.api';
import { InvoiceTemplate } from '../../core/templates/invoice-template.models';
import { createTemplateDocument } from '../../core/templates/invoice-template.presets';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { InvoiceTemplateEditorComponent } from './invoice-template-editor.component';

function template(): InvoiceTemplate {
  return {
    id: 't1',
    name: 'Moderne maison',
    isDefault: true,
    updatedAt: '2026-08-01T10:00:00Z',
    templateJson: createTemplateDocument(),
  };
}

describe('InvoiceTemplateEditorComponent', () => {
  let http: HttpTestingController;
  let store: InvoiceTemplateStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 't1' }) } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(InvoiceTemplateStore);
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create(status: 'ok' | 404 = 'ok') {
    const fixture = TestBed.createComponent(InvoiceTemplateEditorComponent);
    const request = http.expectOne(`${INVOICE_TEMPLATES_URL}/t1`);

    if (status === 404) {
      request.flush({}, { status: 404, statusText: 'Not Found' });
    } else {
      request.flush(template());
    }

    await fixture.whenStable();
    return fixture;
  }

  /**
   * jsdom ne fournit ni DragEvent ni DataTransfer : on émet les évènements par
   * leur nom, ce que les liaisons Angular écoutent de toute façon. Les
   * gestionnaires accèdent à `dataTransfer` de façon facultative.
   */
  function dragBlock(
    fixture: ComponentFixture<InvoiceTemplateEditorComponent>,
    from: number,
    to: number,
  ) {
    const items = fixture.nativeElement.querySelectorAll('aside ul li[draggable=true]');

    items[from].dispatchEvent(new Event('dragstart', { bubbles: true }));
    items[to].dispatchEvent(new Event('dragover', { bubbles: true }));
    items[to].dispatchEvent(new Event('drop', { bubbles: true }));
  }

  it('shows the three panels: blocks, preview, properties', async () => {
    const fixture = await create();

    expect(fixture.nativeElement.querySelector('app-template-blocks-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-invoice-template-preview')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-template-properties-panel')).toBeTruthy();
  });

  it('reorders the blocks by drag and drop', async () => {
    const fixture = await create();
    const before = store.draft()!.templateJson.blocks.map((block) => block.type);

    dragBlock(fixture, 0, 2);
    await fixture.whenStable();

    const after = store.draft()!.templateJson.blocks.map((block) => block.type);
    expect(after[2]).toBe(before[0]);
    expect(store.dirty()).toBe(true);
    // Le glisser-déposer ne parle jamais au réseau.
    http.expectNone(() => true);
  });

  it('reorders the blocks from the keyboard too', async () => {
    const fixture = await create();
    const before = store.draft()!.templateJson.blocks.map((block) => block.type);

    (
      fixture.nativeElement.querySelectorAll('aside [title="Descendre"]')[0] as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(store.draft()!.templateJson.blocks[1].type).toBe(before[0]);
  });

  it('adds a block from the palette', async () => {
    const fixture = await create();
    const before = store.draft()!.templateJson.blocks.length;

    const paletteButton = [...fixture.nativeElement.querySelectorAll('aside button')].find(
      (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === '+ Notes',
    ) as HTMLButtonElement;
    paletteButton.click();
    await fixture.whenStable();

    expect(store.draft()!.templateJson.blocks.length).toBe(before + 1);
  });

  it('hides a block, which disappears from the preview', async () => {
    const fixture = await create();
    const preview = () =>
      (fixture.nativeElement.querySelector('app-invoice-template-preview') as HTMLElement)
        .textContent ?? '';

    expect(preview()).toContain('Produit A');

    const items = store.draft()!.templateJson.blocks.find((block) => block.type === 'items')!;
    store.toggleBlock(items.id);
    await fixture.whenStable();

    expect(preview()).not.toContain('Produit A');
  });

  it('removes a block', async () => {
    const fixture = await create();
    const before = store.draft()!.templateJson.blocks.length;

    (
      fixture.nativeElement.querySelectorAll(
        'aside [title="Retirer le bloc"]',
      )[0] as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(store.draft()!.templateJson.blocks.length).toBe(before - 1);
  });

  it('applies a colour change to the preview at once', async () => {
    const fixture = await create();
    const field = fixture.nativeElement.querySelector(
      'input[name=primaryColor]',
    ) as HTMLInputElement;

    field.value = '#ff0000';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(store.draft()!.templateJson.settings.theme.primaryColor).toBe('#ff0000');
    const sheet = fixture.nativeElement.querySelector('.sheet') as HTMLElement;
    expect(sheet.innerHTML).toContain('rgb(255, 0, 0)');
    http.expectNone(() => true);
  });

  it('applies a font change to the preview', async () => {
    const fixture = await create();
    const select = fixture.nativeElement.querySelector('#fontFamily') as HTMLSelectElement;

    select.value = 'Georgia';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(store.draft()!.templateJson.settings.theme.fontFamily).toBe('Georgia');
    const sheet = fixture.nativeElement.querySelector('.sheet') as HTMLElement;
    expect(sheet.getAttribute('style')).toContain('Georgia');
  });

  it('saves only the JSON configuration', async () => {
    const fixture = await create();
    store.updateTheme({ primaryColor: '#101010' });
    await fixture.whenStable();

    const save = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === 'Enregistrer',
    ) as HTMLButtonElement;
    save.click();

    const request = http.expectOne(`${INVOICE_TEMPLATES_URL}/t1`);
    expect(request.request.method).toBe('PUT');
    request.flush(template());
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Enregistré');
  });

  it('handles a 404 from the API', async () => {
    const fixture = await create(404);

    expect(fixture.nativeElement.textContent).toContain('introuvable');
  });

  it('toggles the mobile drawers', async () => {
    const fixture = await create();

    const blocksButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === 'Blocs',
    ) as HTMLButtonElement;
    blocksButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();
  });
});
