import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  OPERATION_NATURES,
  SupplierDraft,
  emptySupplierDraft,
  supplierToDraft,
  validateSupplier,
} from '../../core/pme/pme-party.form';
import { PmeStore } from '../../core/pme/pme-store.service';
import { Supplier } from '../../core/pme/pme.models';
import { CompanySwitchComponent } from '../../shared/company-switch/company-switch.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PmePartyFieldsComponent } from '../../shared/pme-party-fields/pme-party-fields.component';

/**
 * Fichier fournisseurs de l'entreprise active.
 *
 * Une PME reçoit des factures autant qu'elle en émet : à compter du
 * 1er septembre 2026, l'obligation de *réception* d'une facture électronique
 * vaut pour toutes les entreprises, quelle que soit leur taille. Le fichier
 * fournisseurs est donc un socle, pas un supplément.
 */
@Component({
  selector: 'app-pme-suppliers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CompanySwitchComponent, ModalComponent, PmePartyFieldsComponent],
  templateUrl: './pme-suppliers.component.html',
})
export class PmeSuppliersComponent {
  protected readonly store = inject(PmeStore);
  protected readonly i18n = inject(I18nService);

  protected readonly search = signal('');
  protected readonly formOpen = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly natures = OPERATION_NATURES;

  protected editedId: string | null = null;
  protected draft: SupplierDraft = emptySupplierDraft();

  protected readonly filtered = computed<Supplier[]>(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.store.suppliers();

    if (!term) {
      return list;
    }

    return list.filter((item) =>
      [item.name, item.contact, item.email, item.address.city, item.identity.siren]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  });

  protected readonly companyName = computed(() => this.store.activeCompany()?.name ?? '');

  protected readonly formTitle = computed(() =>
    this.editedId ? this.i18n.t('pme.form.editSupplier') : this.i18n.t('pme.form.newSupplier'),
  );

  protected terms(days: number): string {
    return days > 0
      ? this.i18n.t('pme.party.termsDays', { days })
      : this.i18n.t('pme.party.termsImmediate');
  }

  protected openCreate(): void {
    this.editedId = null;
    this.draft = emptySupplierDraft(this.store.activeCompany()?.defaultPaymentTermsDays ?? 30);
    this.error.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(supplier: Supplier): void {
    this.editedId = supplier.id;
    this.draft = supplierToDraft(supplier);
    this.error.set(null);
    this.formOpen.set(true);
  }

  protected submit(): void {
    const errorKey = validateSupplier(this.draft);
    if (errorKey) {
      this.error.set(this.i18n.t(errorKey));
      return;
    }

    const saved = this.editedId
      ? this.store.updateSupplier(this.editedId, this.draft)
      : this.store.addSupplier(this.draft) !== null;

    if (!saved) {
      // Le magasin refuse d'écrire hors de l'entreprise active.
      this.error.set(this.i18n.t('pme.suppliers.empty'));
      return;
    }

    this.error.set(null);
    this.formOpen.set(false);
    this.message.set(this.i18n.t('pme.form.savedSupplier'));
  }

  protected remove(supplier: Supplier): void {
    const question = this.i18n.t('pme.form.confirmDelete', { name: supplier.name });
    if (!confirm(question)) {
      return;
    }

    if (this.store.removeSupplier(supplier.id)) {
      this.message.set(this.i18n.t('pme.form.deletedSupplier'));
    }
  }
}
