import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { CollaborationService } from './collaboration.service';
import { CollaborationsComponent } from './collaborations.component';

describe('CollaborationsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CollaborationsComponent],
      providers: [provideRouter([{ path: 'createur/campagnes', children: [] }])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(CollaborationsComponent);
    await fixture.whenStable();
    return fixture;
  }

  function cardOf(fixture: { nativeElement: HTMLElement }, title: string) {
    return [...fixture.nativeElement.querySelectorAll('article')].find((article) =>
      (article as HTMLElement).textContent?.includes(title),
    ) as HTMLElement;
  }

  it('draws one column per pipeline stage', async () => {
    const fixture = await create();
    const columns = fixture.nativeElement.querySelectorAll('.board .column');
    const text = fixture.nativeElement.textContent as string;

    expect(columns.length).toBe(5);
    expect(text).toContain('Prospect');
    expect(text).toContain('Négociation');
    expect(text).toContain('En cours');
  });

  it('shows the pipeline value and the next actions', async () => {
    const fixture = await create();
    const service = TestBed.inject(CollaborationService);
    const text = fixture.nativeElement.textContent as string;

    expect(service.pipelineValue()).toBeGreaterThan(0);
    expect(text).toContain('Valeur du pipeline');
    expect(text).toContain('Prochaines actions');
  });

  it('moves a collaboration to the next stage', async () => {
    const fixture = await create();
    const service = TestBed.inject(CollaborationService);
    const target = service.list().find((item) => item.stage === 'PROSPECT')!;

    const card = cardOf(fixture, target.title);
    (card.querySelector('[title="Étape suivante"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.byId(target.id)?.stage).toBe('NEGOTIATION');
  });

  it('turns a collaboration into a campaign', async () => {
    const fixture = await create();
    const service = TestBed.inject(CollaborationService);
    const target = service.list().find((item) => item.campaignId === null)!;

    // La carte du pipeline ne garde en clair que « Étape suivante » ;
    // la conversion en campagne vit dans son menu de débordement.
    const card = cardOf(fixture, target.title);
    (card.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const entry = [...card.querySelectorAll('.action-menu-item')].find(
      (item) => item.textContent?.trim() === 'Créer la campagne',
    ) as HTMLButtonElement;
    entry.click();
    await fixture.whenStable();

    expect(service.byId(target.id)?.campaignId).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('créée depuis la collaboration');
  });

  it('opens the form and refuses an empty title', async () => {
    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes('Nouvelle collaboration'),
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('app-modal form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('obligatoires');
  });

  it('translates the stages', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Negotiation');
    expect(text).toContain('Pipeline value');
  });
});
