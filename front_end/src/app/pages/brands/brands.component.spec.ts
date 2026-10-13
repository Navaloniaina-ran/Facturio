import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { BrandService } from './brand.service';
import { BrandsComponent } from './brands.component';

describe('BrandsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [BrandsComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(BrandsComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('lists the brands of the workspace', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Nike');
    expect(text).toContain('Glow Cosmetics');
  });

  it('filters on the typed search', async () => {
    const fixture = await create();
    const field = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;

    field.value = 'glow';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Glow Cosmetics');
    expect(text).not.toContain('Studio Kama');
  });

  it('keeps only late payers when the filter is on', async () => {
    const fixture = await create();
    const expected = TestBed.inject(BrandService)
      .list()
      .filter((b) => b.latePayer).length;

    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Mauvais payeurs'),
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(expected);
  });

  it('opens the creation form', async () => {
    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Nouvelle marque'),
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();
  });

  it('translates the table headers', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const head = fixture.nativeElement.querySelector('thead').textContent as string;
    expect(head).toContain('Outstanding');
    expect(head).not.toContain('Reste dû');
  });
});
