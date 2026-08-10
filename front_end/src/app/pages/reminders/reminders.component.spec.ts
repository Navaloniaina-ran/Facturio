import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { ReminderService } from './reminder.service';
import { RemindersComponent } from './reminders.component';

describe('RemindersComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [RemindersComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(RemindersComponent);
    await fixture.whenStable();
    return fixture;
  }

  function click(fixture: { nativeElement: HTMLElement }, label: string) {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
  }

  it('shows the five-step scenario', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('J-3 avant échéance');
    expect(text).toContain('Mise en demeure');
    expect(fixture.nativeElement.querySelectorAll('input[type=checkbox]').length).toBe(5);
  });

  it('lists the invoices waiting to be chased', async () => {
    const fixture = await create();

    expect(TestBed.inject(ReminderService).queue().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('File d’attente');
    expect(fixture.nativeElement.textContent).toContain('FAC-2026-0002');
  });

  it('sends a reminder from the queue', async () => {
    const fixture = await create();
    const service = TestBed.inject(ReminderService);

    (fixture.nativeElement.querySelector('[title="Envoyer"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.sentThisMonth()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Relance envoyée');
  });

  it('offers a pre-filled message before sending', async () => {
    const fixture = await create();

    (fixture.nativeElement.querySelector('[title="Modèle"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const area = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(area.value).toContain('Bonjour');
    expect(fixture.nativeElement.textContent).toContain('Message de relance');
  });

  it('switches between manual approval and automation', async () => {
    const fixture = await create();
    const service = TestBed.inject(ReminderService);

    click(fixture, 'Automatique');
    await fixture.whenStable();

    expect(service.mode()).toBe('AUTO');
    expect(fixture.nativeElement.textContent).toContain('Automatisation complète');
  });

  it('switches off a scenario step', async () => {
    const fixture = await create();
    const service = TestBed.inject(ReminderService);
    const boxes = fixture.nativeElement.querySelectorAll('input[type=checkbox]');

    (boxes[0] as HTMLInputElement).click();
    await fixture.whenStable();

    expect(service.steps()[0].active).toBe(false);
  });

  it('translates the step labels and the message', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('D-3 before due date');
    expect(text).toContain('Formal notice');
  });
});
