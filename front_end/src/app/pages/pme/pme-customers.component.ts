import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  CustomerDraft,
  customerToDraft,
  emptyCustomerDraft,
  validateCustomer,
} from '../../core/pme/pme-party.form';
import { PmeStore } from '../../core/pme/pme-store.service';
import { Customer, deliveryAddressDiffers } from '../../core/pme/pme.models';
import { CompanySwitchComponent } from '../../shared/company-switch/company-switch.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PmePartyFieldsComponent } from '../../shared/pme-party-fields/pme-party-fields.component';

/**
 * Fichier clients de l'entreprise active.
 *
 * La liste vient de `store.customers()`, déjà restreinte à l'entreprise
 * active : ce composant n'a aucun filtrage de tenant à faire, et n'a jamais
 * accès aux fiches des autres PME. L'enregistrement passe par le magasin, qui
 * estampille lui-même la fiche avec l'entreprise courante.
 */
@Component({
  selector: 'app-pme-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CompanySwitchComponent, ModalComponent, PmePartyFieldsComponent],
  templateUrl: './pme-customers.component.html',
})
export class PmeCustomersComponent {
  protected readonly store = inject(PmeStore);
  protected readonly i18n = inject(I18nService);

  protected readonly search = signal('');
  protected readonly formOpen = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Identifiant en cours d'édition ; `null` pour une création. */
  protected editedId: string | null = null;
  protected draft: CustomerDraft = emptyCustomerDraft();
  /** Pilote l'affichage du bloc d'adresse de livraison. */
  protected separateDelivery = false;

  protected readonly filtered = computed<Customer[]>(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.store.customers();

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
    this.editedId ? this.i18n.t('pme.form.editCustomer') : this.i18n.t('pme.form.newCustomer'),
  );

  /** Le délai de règlement légal se compte en jours ; 0 vaut comptant. */
  protected terms(days: number): string {
    return days > 0
      ? this.i18n.t('pme.party.termsDays', { days })
      : this.i18n.t('pme.party.termsImmediate');
  }

  protected hasSeparateDelivery(customer: Customer): boolean {
    return deliveryAddressDiffers(customer);
  }

  protected openCreate(): void {
    this.editedId = null;
    // Le délai par défaut de l'entreprise sert de point de départ.
    this.draft = emptyCustomerDraft(this.store.activeCompany()?.defaultPaymentTermsDays ?? 30);
    this.separateDelivery = false;
    this.error.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(customer: Customer): void {
    this.editedId = customer.id;
    this.draft = customerToDraft(customer);
    this.separateDelivery = this.draft.deliveryAddress !== null;
    this.error.set(null);
    this.formOpen.set(true);
  }

  protected toggleSeparateDelivery(separate: boolean): void {
    this.separateDelivery = separate;
    this.draft.deliveryAddress = separate
      ? (this.draft.deliveryAddress ?? { ...this.draft.address })
      : null;
  }

  protected submit(): void {
    // Une case décochée doit effacer l'adresse, sinon elle repartirait en base.
    if (!this.separateDelivery) {
      this.draft.deliveryAddress = null;
    }

    const errorKey = validateCustomer(this.draft);
    if (errorKey) {
      this.error.set(this.i18n.t(errorKey));
      return;
    }

    const saved = this.editedId
      ? this.store.updateCustomer(this.editedId, this.draft)
      : this.store.addCustomer(this.draft) !== null;

    if (!saved) {
      // Le magasin refuse d'écrire hors de l'entreprise active.
      this.error.set(this.i18n.t('pme.customers.empty'));
      return;
    }

    this.error.set(null);
    this.formOpen.set(false);
    this.message.set(this.i18n.t('pme.form.savedCustomer'));
  }

  protected remove(customer: Customer): void {
    const question = this.i18n.t('pme.form.confirmDelete', { name: customer.name });
    if (!confirm(question)) {
      return;
    }

    if (this.store.removeCustomer(customer.id)) {
      this.message.set(this.i18n.t('pme.form.deletedCustomer'));
    }
  }
}
