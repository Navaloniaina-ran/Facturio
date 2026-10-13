import { Component, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { ICONS } from '../icons';

/**
 * Champ de recherche d'une liste.
 *
 * « / » y amène le focus depuis n'importe où dans la page, « Échap » vide la
 * saisie. Le raccourci se coupe pendant qu'une modale est ouverte : sans quoi
 * une frappe dans un formulaire déplacerait le focus derrière la boîte.
 */
@Component({
  selector: 'app-search-field',
  imports: [FormsModule],
  templateUrl: './search-field.component.html',
  host: { '(document:keydown)': 'onShortcut($event)' },
})
export class SearchFieldComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly icons = ICONS;

  readonly value = input('');
  readonly placeholder = input('');
  readonly label = input('');
  /** À passer à `false` tant qu'une modale a la main. */
  readonly shortcut = input(true);

  readonly valueChange = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected onShortcut(event: KeyboardEvent): void {
    if (!this.shortcut()) {
      return;
    }

    const input = this.field()?.nativeElement;
    const target = event.target as HTMLElement | null;
    const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');

    if (event.key === '/' && !editing) {
      event.preventDefault();
      input?.focus();
      return;
    }

    if (event.key === 'Escape' && target === input && this.value()) {
      this.valueChange.emit('');
    }
  }

  protected clear(): void {
    this.valueChange.emit('');
    this.field()?.nativeElement.focus();
  }
}
