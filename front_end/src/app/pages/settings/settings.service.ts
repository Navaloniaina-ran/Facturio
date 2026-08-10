import { Injectable, computed, inject } from '@angular/core';
import { ActionResult, Settings } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';

/** Taille maximale du logo embarqué dans les documents. */
export const MAX_LOGO_BYTES = 1_000_000;

const PREFIX_PATTERN = /^[A-Za-z]{2,6}$/;

/**
 * Paramètres de l'espace : tout ce qui ne se règle qu'une fois — identité,
 * logo, TVA par défaut, numérotation, conditions et mentions légales.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(WorkspaceStore);

  readonly current = this.store.settings.asReadonly();
  readonly nextInvoiceNumber = computed(() => this.store.peekNumber('INVOICE'));
  readonly nextQuoteNumber = computed(() => this.store.peekNumber('QUOTE'));
  readonly nextCreditNumber = computed(() => this.store.peekNumber('CREDIT_NOTE'));

  save(draft: Settings): ActionResult {
    const prefixes = [draft.invoicePrefix, draft.quotePrefix, draft.creditPrefix];
    if (prefixes.some((prefix) => !PREFIX_PATTERN.test(prefix))) {
      return { ok: false, errorKey: 'settings.error.prefix' };
    }

    this.store.settings.set({
      ...draft,
      invoicePrefix: draft.invoicePrefix.toUpperCase(),
      quotePrefix: draft.quotePrefix.toUpperCase(),
      creditPrefix: draft.creditPrefix.toUpperCase(),
    });
    return { ok: true };
  }

  /** Le logo est stocké en data URI : il suit la facture jusqu'au PDF. */
  setLogo(dataUri: string, sizeInBytes: number): ActionResult {
    if (sizeInBytes > MAX_LOGO_BYTES) {
      return { ok: false, errorKey: 'settings.error.logoSize' };
    }

    this.store.settings.update((settings) => ({ ...settings, logo: dataUri }));
    return { ok: true };
  }

  removeLogo(): void {
    this.store.settings.update((settings) => ({ ...settings, logo: null }));
  }
}
