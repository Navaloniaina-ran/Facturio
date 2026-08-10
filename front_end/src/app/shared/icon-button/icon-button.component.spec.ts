import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function create(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(IconButtonComponent);
    fixture.componentRef.setInput('icon', 'edit');
    fixture.componentRef.setInput('label', 'Modifier');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('carries the label as tooltip and accessible name', async () => {
    const fixture = await create();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('title')).toBe('Modifier');
    expect(button.getAttribute('aria-label')).toBe('Modifier');
    expect(button.textContent?.trim()).toBe('');
  });

  it('draws the requested icon', async () => {
    const fixture = await create({ icon: 'delete' });
    const path = fixture.nativeElement.querySelector('svg path') as SVGPathElement;

    expect(path.getAttribute('d')?.startsWith('M9 4h6')).toBe(true);
  });

  it('emits the action on click', async () => {
    const fixture = await create();
    let fired = false;
    fixture.componentInstance.action.subscribe(() => (fired = true));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(fired).toBe(true);
  });

  it('becomes a link when a target is given', async () => {
    const fixture = await create({ link: '/app/relances' });

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(
      (fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href'),
    ).toBe('/app/relances');
  });

  it('applies the tone of the action', async () => {
    const fixture = await create({ tone: 'danger' });

    expect(fixture.nativeElement.querySelector('button').className).toContain('tone-danger');
  });
});
