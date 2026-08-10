import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { Line } from '../../core/models';
import { LineEditorComponent } from './line-editor.component';

function line(id: string, unitPrice: number, discountPercent = 0): Line {
  return {
    id,
    description: 'Reel Instagram',
    deliverableType: 'REEL',
    quantity: 1,
    unitPrice,
    discountType: 'PERCENT',
    discountValue: discountPercent,
    vatRate: 20,
  };
}

describe('LineEditorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [LineEditorComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create(lines: Line[]) {
    const fixture = TestBed.createComponent(LineEditorComponent);
    fixture.componentRef.setInput('lines', lines);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the excl. VAT, VAT and incl. VAT totals', async () => {
    const fixture = await create([line('a', 1000, 10)]);
    const text = (fixture.nativeElement.textContent as string).replace(/\s/gu, ' ');

    expect(text).toContain('900 €');
    expect(text).toContain('180 €');
    expect(text).toContain('1 080 €');
  });

  it('invites a first line when the list is empty', async () => {
    const fixture = await create([]);
    expect(fixture.nativeElement.textContent).toContain('Ajoutez un premier livrable');
  });

  it('emits the line id on removal', async () => {
    const fixture = await create([line('a', 100)]);
    let removed: string | null = null;
    fixture.componentInstance.remove.subscribe((id) => (removed = id));

    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Retirer la ligne"]',
    ) as HTMLButtonElement;
    button.click();

    expect(removed).toBe('a');
  });
});
