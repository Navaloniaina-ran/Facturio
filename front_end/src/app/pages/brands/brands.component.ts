import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService } from '../campaigns/campaign.service';
import { InvoiceService } from '../invoices/invoice.service';
import { BrandDraft, BrandService, BrandView, EMPTY_BRAND } from './brand.service';

@Component({
  selector: 'app-brands',
  imports: [
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    IconButtonComponent,
  ],
  templateUrl: './brands.component.html',
})
export class BrandsComponent {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly campaignService = inject(CampaignService);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(BrandService);

  protected readonly search = signal('');
  protected readonly latePayersOnly = signal(false);
  protected readonly modal = signal<'form' | 'sheet' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<BrandView | null>(null);

  protected editedId: string | null = null;
  protected form: BrandDraft = { ...EMPTY_BRAND };

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();

    return this.service
      .list()
      .filter((brand) => !this.latePayersOnly() || brand.latePayer)
      .filter(
        (brand) =>
          !term ||
          brand.name.toLowerCase().includes(term) ||
          brand.contact.toLowerCase().includes(term) ||
          brand.email.toLowerCase().includes(term),
      );
  });

  protected openCreate(): void {
    this.editedId = null;
    this.form = { ...EMPTY_BRAND };
    this.error.set(null);
    this.modal.set('form');
  }

  protected openEdit(brand: BrandView): void {
    this.editedId = brand.id;
    this.form = {
      name: brand.name,
      contact: brand.contact,
      email: brand.email,
      phone: brand.phone,
      address: brand.address,
      paymentTermsDays: brand.paymentTermsDays,
      notes: brand.notes,
    };
    this.error.set(null);
    this.modal.set('form');
  }

  protected openSheet(brand: BrandView): void {
    this.selected.set(brand);
    this.modal.set('sheet');
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }

  protected save(): void {
    const result = this.editedId
      ? this.service.update(this.editedId, this.form)
      : this.service.create(this.form);

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.message.set(
      this.i18n.t(this.editedId ? 'brands.flash.updated' : 'brands.flash.created'),
    );
    this.close();
  }

  protected remove(brand: BrandView): void {
    const result = this.service.remove(brand.id);

    this.message.set(
      result.ok
        ? this.i18n.t('brands.flash.deleted', { name: brand.name })
        : this.i18n.error(result),
    );
  }

  protected togglePause(brand: BrandView): void {
    this.store.brands.update((brands) =>
      brands.map((b) => (b.id === brand.id ? { ...b, remindersPaused: !b.remindersPaused } : b)),
    );
  }

  protected invoicesOf(brandId: string) {
    return this.invoices.byBrand(brandId);
  }

  protected campaignsOf(brandId: string) {
    return this.campaignService.byBrand(brandId);
  }

  protected exportCsv(): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([this.service.toCsv()], { type: 'text/csv;charset=utf-8' }),
    );
    link.download = 'brands.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.message.set(this.i18n.t('brands.flash.exported'));
  }
}
