import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { PmeStore } from '../../core/pme/pme-store.service';

/**
 * Sélecteur d'entreprise active, permanent dans l'en-tête de l'espace PME.
 *
 * Une personne qui n'administre qu'une seule entreprise n'a pas de choix à
 * faire : on affiche alors le nom sans menu, pour ne pas suggérer une bascule
 * qui n'existe pas.
 */
@Component({
  selector: 'app-company-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let company = store.activeCompany();
    @if (company) {
      <div class="relative">
        @if (store.hasMultipleCompanies()) {
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-slate-200 transition hover:bg-slate-50"
            [attr.aria-expanded]="open()"
            aria-haspopup="listbox"
            (click)="open.set(!open())"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-xs font-semibold text-white"
            >
              {{ initials() }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-slate-900">{{
                company.name
              }}</span>
              <span class="block truncate text-[0.7rem] text-slate-500">
                {{ i18n.t('pme.company.siren') }} {{ company.identity.siren }}
              </span>
            </span>
            <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" fill="currentColor" />
            </svg>
          </button>

          @if (open()) {
            <ul
              class="absolute left-0 z-20 mt-1 w-full min-w-[15rem] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
              role="listbox"
              [attr.aria-label]="i18n.t('pme.company.switch')"
            >
              @for (item of store.companies(); track item.id) {
                <li>
                  <button
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                    role="option"
                    [attr.aria-selected]="item.id === company.id"
                    [class.font-semibold]="item.id === company.id"
                    (click)="select(item.id)"
                  >
                    <span class="block truncate text-slate-900">{{ item.name }}</span>
                    <span class="block truncate text-[0.7rem] text-slate-500">
                      {{ item.identity.vatNumber }}
                    </span>
                  </button>
                </li>
              }
            </ul>
          }
        } @else {
          <div class="flex items-center gap-2 px-1 py-2">
            <span
              class="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-xs font-semibold text-white"
            >
              {{ initials() }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-slate-900">{{
                company.name
              }}</span>
              <span class="block truncate text-[0.7rem] text-slate-500">
                {{ i18n.t('pme.company.siren') }} {{ company.identity.siren }}
              </span>
            </span>
          </div>
        }
      </div>
    }
  `,
})
export class CompanySwitchComponent {
  protected readonly store = inject(PmeStore);
  protected readonly i18n = inject(I18nService);

  protected readonly open = signal(false);

  protected readonly initials = computed(() =>
    (this.store.activeCompany()?.name ?? '')
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected select(id: string): void {
    this.store.selectCompany(id);
    this.open.set(false);
  }
}
