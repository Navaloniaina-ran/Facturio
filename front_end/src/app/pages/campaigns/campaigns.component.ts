import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DEFAULT_VAT_RATE, addDays, today } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { CampaignStatus, Line } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { LineEditorComponent } from '../../shared/line-editor/line-editor.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService, CampaignView } from './campaign.service';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import {
  FilterSegment,
  FilterSegmentsComponent,
} from '../../shared/filter-segments/filter-segments.component';
import { FilterChip, ResultBarComponent } from '../../shared/result-bar/result-bar.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/action-menu/action-menu.component';

type Tab = 'ALL' | CampaignStatus;

/**
 * Module identitaire du front créateur (P04) : une campagne agrège plusieurs
 * livrables typés et pilote la chaîne Proposition → Contrat → Facture → Paiement.
 */
@Component({
  selector: 'app-campaigns',
  imports: [
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    LineEditorComponent,
    IconButtonComponent,
    PageHeaderComponent,
    SearchFieldComponent,
    FilterSegmentsComponent,
    ResultBarComponent,
    ActionMenuComponent,
  ],
  templateUrl: './campaigns.component.html',
})
export class CampaignsComponent {
  protected readonly icons = ICONS;

  private readonly routes = inject(WorkspaceRoutes);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(CampaignService);

  protected readonly brands = this.store.brands.asReadonly();

  protected readonly tabs: Tab[] = ['ALL', 'DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

  protected readonly tab = signal<Tab>('ALL');
  protected readonly modal = signal<'create' | 'detail' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly currentId = signal<string | null>(null);

  protected draft = {
    brandId: '',
    name: '',
    startDate: today(),
    endDate: addDays(today(), 30),
  };
  protected lines: Line[] = [];

  /** Recalculée à chaque modification pour refléter l'avancement en direct. */
  protected readonly current = computed(() => {
    const id = this.currentId();
    return id ? (this.service.byId(id) ?? null) : null;
  });

  protected readonly search = signal('');

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.service
      .list()
      .filter(
        (c) =>
          (this.tab() === 'ALL' || c.status === this.tab()) &&
          (!term ||
            c.name.toLowerCase().includes(term) ||
            c.brandName.toLowerCase().includes(term)),
      );
  });

  /** Segments de la barre d'outils : l'effectif est annoncé avant le clic. */
  protected readonly filterSegments = computed<FilterSegment[]>(() =>
    this.tabs.map((tab) => ({
      key: tab,
      label: this.tabLabel(tab),
      count:
        tab === 'ALL'
          ? this.service.list().length
          : this.service.list().filter((c) => c.status === tab).length,
    })),
  );

  protected readonly filterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const term = this.search().trim();

    if (term) {
      chips.push({
        label: this.i18n.t('list.searchChip', { term }),
        tone: 'brand',
        clear: () => this.search.set(''),
      });
    }

    if (this.tab() !== 'ALL') {
      chips.push({
        label: this.tabLabel(this.tab()),
        clear: () => this.tab.set('ALL'),
      });
    }

    return chips;
  });

  protected tabLabel(tab: Tab): string {
    return tab === 'ALL' ? this.i18n.t('common.all') : this.i18n.status(tab);
  }

  protected readonly hasFilters = computed(
    () => this.tab() !== 'ALL' || this.search().trim().length > 0,
  );

  protected resetFilters(): void {
    this.tab.set('ALL');
    this.search.set('');
  }

  protected openCreate(): void {
    this.draft = {
      brandId: this.brands()[0]?.id ?? '',
      name: '',
      startDate: today(),
      endDate: addDays(today(), 30),
    };
    this.lines = [this.newLine()];
    this.error.set(null);
    this.modal.set('create');
  }

  protected newLine(): Line {
    return {
      id: this.store.newId('l'),
      description: '',
      deliverableType: 'REEL',
      quantity: 1,
      unitPrice: 0,
      discountType: 'PERCENT',
      discountValue: 0,
      vatRate: DEFAULT_VAT_RATE,
    };
  }

  protected addLine(): void {
    this.lines = [...this.lines, this.newLine()];
  }

  protected removeLine(id: string): void {
    this.lines = this.lines.filter((line) => line.id !== id);
  }

  protected save(): void {
    this.service.create({ ...this.draft, deliverables: this.lines }).subscribe((result) => {
      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }

      this.message.set(this.i18n.t('campaigns.flash.created'));
      this.modal.set(null);
    });
  }

  protected openDetail(campaign: CampaignView): void {
    this.currentId.set(campaign.id);
    this.modal.set('detail');
  }

  protected generateQuote(campaign: CampaignView): void {
    this.service.generateQuote(campaign.id).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('campaigns.flash.quoteGenerated') : this.i18n.error(result),
      );
    });
  }

  protected generateInvoice(campaign: CampaignView): void {
    this.service.generateInvoice(campaign.id).subscribe((result) => {
      if (!result.ok) {
        this.message.set(this.i18n.error(result));
        return;
      }

      this.message.set(
        this.i18n.t('campaigns.flash.invoiceGenerated', { number: result.value?.number ?? '' }),
      );
      this.modal.set(null);
      void this.router.navigate(this.routes.to('factures'));
    });
  }

  protected attachContract(campaign: CampaignView): void {
    this.service.attachContract(campaign.id, `contract-${campaign.id}.pdf`).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('campaigns.flash.contract') : this.i18n.error(result),
      );
    });
  }

  /**
   * Actions secondaires d'une campagne. Le pied de carte ne garde que le
   * geste qui fait avancer la campagne — produire la proposition, puis la
   * facture, puis clore — et l'ouverture du détail.
   */
  protected secondaryActions(campaign: CampaignView): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];

    if (!campaign.contractSigned) {
      items.push({
        icon: 'contract',
        label: this.i18n.t('campaigns.attachContract'),
        run: () => this.attachContract(campaign),
      });
    }

    items.push({
      icon: 'duplicate',
      label: this.i18n.t('common.duplicate'),
      run: () => this.duplicate(campaign),
    });

    return items;
  }

  protected duplicate(campaign: CampaignView): void {
    this.service.duplicate(campaign.id).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('campaigns.flash.duplicated') : this.i18n.error(result),
      );
    });
  }

  protected closeCampaign(campaign: CampaignView): void {
    this.service.close(campaign.id).subscribe((result) => {
      this.message.set(result.ok ? this.i18n.t('campaigns.flash.closed') : this.i18n.error(result));
    });
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }
}
