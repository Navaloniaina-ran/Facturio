import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitchComponent } from './language-switch.component';

describe('LanguageSwitchComponent', () => {
  let i18n: I18nService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageSwitchComponent],
    }).compileComponents();
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(LanguageSwitchComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('offers French and English', async () => {
    const fixture = await create();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['fr', 'en']);
  });

  it('marks the active language', async () => {
    const fixture = await create();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('switches the language on click', async () => {
    const fixture = await create();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    buttons[1].click();
    await fixture.whenStable();

    expect(i18n.language()).toBe('en');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('persists the choice for the next session', async () => {
    const fixture = await create();
    ([...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[])[1].click();

    expect(localStorage.getItem('facturio.language')).toBe('en');
  });
});
