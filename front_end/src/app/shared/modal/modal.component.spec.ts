import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
  });

  it('shows the title and the subtitle', async () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('title', 'Nouvelle facture');
    fixture.componentRef.setInput('subtitle', 'Marque Nike');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nouvelle facture');
    expect(text).toContain('Marque Nike');
  });

  it('emits on backdrop click', async () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('title', 'Test');
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(closed).toBe(true);
  });

  it('keeps the scroll inside the body only', async () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('title', 'Test');
    await fixture.whenStable();

    const body = fixture.nativeElement.querySelector('[role=dialog] > div') as HTMLElement;
    expect(body.className).toContain('overflow-y-auto');
  });
});
