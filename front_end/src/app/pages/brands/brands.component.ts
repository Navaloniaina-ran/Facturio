import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService } from '../campaigns/campaign.service';
import { InvoiceService } from '../invoices/invoice.service';
import { BrandDraft, BrandService, BrandView, EMPTY_BRAND } from './brand.service';
import { ICONS } from '../../shared/icons';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ViewSwitchComponent } from '../../shared/view-switch/view-switch.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import {
  FilterSegment,
  FilterSegmentsComponent,
} from '../../shared/filter-segments/filter-segments.component';
import { FilterChip, ResultBarComponent } from '../../shared/result-bar/result-bar.component';

/** Filtre rapide de la barre d'outils. */
export type BrandFilter = 'all' | 'late' | 'clean' | 'paused';
/** Colonne de tri : les en-têtes du tableau et le sélecteur pilotent la même clé. */
export type BrandSort = 'name' | 'invoiced' | 'outstanding' | 'reliability' | 'activity';
export type SortDirection = 'asc' | 'desc';

/** Sens le plus utile à la première ouverture de chaque colonne. */
const NATURAL_DIRECTION: Record<BrandSort, SortDirection> = {
  name: 'asc',
  invoiced: 'desc',
  outstanding: 'desc',
  // Une note basse est ce qui mérite l'attention : les marques à risque d'abord.
  reliability: 'asc',
  activity: 'desc',
};

/**
 * Dégradés d'avatar. La marque garde toujours la même couleur : le repère
 * visuel reste stable d'une session à l'autre.
 */
const AVATARS = [
  'from-brand-400 to-brand-600',
  'from-sky-400 to-sky-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-fuchsia-400 to-fuchsia-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
];

/** Palettes de la jauge de fiabilité, alignées sur les paliers du service. */
const RELIABILITY_TONES = [
  {
    min: 85,
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    stroke: 'stroke-emerald-500',
  },
  {
    min: 65,
    bar: 'bg-sky-500',
    text: 'text-sky-600',
    soft: 'bg-sky-50 text-sky-700 ring-sky-200',
    stroke: 'stroke-sky-500',
  },
  {
    min: 40,
    bar: 'bg-amber-500',
    text: 'text-amber-600',
    soft: 'bg-amber-50 text-amber-700 ring-amber-200',
    stroke: 'stroke-amber-500',
  },
  {
    min: 0,
    bar: 'bg-rose-500',
    text: 'text-rose-600',
    soft: 'bg-rose-50 text-rose-700 ring-rose-200',
    stroke: 'stroke-rose-500',
  },
];

@Component({
  selector: 'app-brands',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    IconButtonComponent,
    PageHeaderComponent,
    ViewSwitchComponent,
    SearchFieldComponent,
    FilterSegmentsComponent,
    ResultBarComponent,
  ],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.css',
  // « / » amène au champ de recherche depuis n'importe où sur la page.
})
export class BrandsComponent {
  protected readonly icons = ICONS;

  private readonly invoices = inject(InvoiceService);
  private readonly campaignService = inject(CampaignService);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(BrandService);

  protected readonly search = signal('');
  protected readonly filter = signal<BrandFilter>('all');
  protected readonly sortKey = signal<BrandSort>('name');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly view = signal<'table' | 'grid'>('table');
  protected readonly modal = signal<'form' | 'sheet' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<BrandView | null>(null);

  protected editedId: string | null = null;
  protected form: BrandDraft = { ...EMPTY_BRAND };

  /** Onglets du filtre rapide, dans l'ordre d'affichage. */
  protected readonly filters: { key: BrandFilter; labelKey: string }[] = [
    { key: 'all', labelKey: 'brands.filter.all' },
    { key: 'late', labelKey: 'brands.badPayers' },
    { key: 'clean', labelKey: 'brands.filter.clean' },
    { key: 'paused', labelKey: 'brands.filter.paused' },
  ];

  protected readonly sorts: { key: BrandSort; labelKey: string }[] = [
    { key: 'name', labelKey: 'brands.sort.name' },
    { key: 'invoiced', labelKey: 'brands.sort.invoiced' },
    { key: 'outstanding', labelKey: 'brands.sort.outstanding' },
    { key: 'reliability', labelKey: 'brands.sort.reliability' },
    { key: 'activity', labelKey: 'brands.sort.activity' },
  ];

  /** Totaux du portefeuille : ils ignorent les filtres, ils décrivent l'ensemble. */
  protected readonly totals = computed(() => {
    const brands = this.service.list();

    return {
      count: brands.length,
      invoiced: brands.reduce((sum, brand) => sum + brand.totalInvoiced, 0),
      outstanding: brands.reduce((sum, brand) => sum + brand.outstanding, 0),
      owing: brands.filter((brand) => brand.outstanding > 0).length,
      late: brands.filter((brand) => brand.latePayer).length,
    };
  });

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const active = this.filter();
    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return this.service
      .list()
      .filter((brand) => this.matches(brand, active))
      .filter(
        (brand) =>
          !term ||
          brand.name.toLowerCase().includes(term) ||
          brand.contact.toLowerCase().includes(term) ||
          brand.email.toLowerCase().includes(term),
      )
      .sort((a, b) => this.compare(a, b, key) * direction);
  });

  /** Segments passés à la barre d'outils, effectif compris. */
  protected readonly filterSegments = computed<FilterSegment[]>(() =>
    this.filters.map((option) => ({
      key: option.key,
      label: this.i18n.t(option.labelKey),
      count: this.counts()[option.key],
    })),
  );

  /** Contraintes actives, chacune retirable sans toucher aux autres. */
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

    if (this.filter() !== 'all') {
      chips.push({
        label: this.i18n.t(this.activeFilterLabelKey()),
        clear: () => this.filter.set('all'),
      });
    }

    return chips;
  });

  protected readonly hasFilters = computed(
    () => this.filter() !== 'all' || this.search().trim().length > 0,
  );

  /** Libellé du segment actif, repris par la puce retirable. */
  protected readonly activeFilterLabelKey = computed(
    () =>
      this.filters.find((option) => option.key === this.filter())?.labelKey ?? 'brands.filter.all',
  );

  /** Effectif de chaque segment : le filtre annonce ce qu'il va montrer. */
  protected readonly counts = computed<Record<BrandFilter, number>>(() => {
    const brands = this.service.list();

    return {
      all: brands.length,
      late: brands.filter((brand) => brand.latePayer).length,
      clean: brands.filter((brand) => !brand.latePayer && !brand.remindersPaused).length,
      paused: brands.filter((brand) => brand.remindersPaused).length,
    };
  });

  /** Totaux du pied de tableau : ils suivent le filtre, pas le portefeuille entier. */
  protected readonly visibleTotals = computed(() => {
    const rows = this.filtered();

    return {
      invoices: rows.reduce((sum, brand) => sum + brand.invoiceCount, 0),
      invoiced: rows.reduce((sum, brand) => sum + brand.totalInvoiced, 0),
      outstanding: rows.reduce((sum, brand) => sum + brand.outstanding, 0),
    };
  });

  /**
   * Découpe un libellé autour du terme recherché pour le surligner. Sans
   * recherche en cours, le texte revient en un seul morceau.
   */
  protected parts(text: string): { text: string; match: boolean }[] {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return [{ text, match: false }];
    }

    const haystack = text.toLowerCase();
    const segments: { text: string; match: boolean }[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const found = haystack.indexOf(term, cursor);
      if (found < 0) {
        segments.push({ text: text.slice(cursor), match: false });
        break;
      }

      if (found > cursor) {
        segments.push({ text: text.slice(cursor, found), match: false });
      }

      segments.push({ text: text.slice(found, found + term.length), match: true });
      cursor = found + term.length;
    }

    return segments;
  }

  private matches(brand: BrandView, filter: BrandFilter): boolean {
    switch (filter) {
      case 'late':
        return brand.latePayer;
      case 'clean':
        return !brand.latePayer && !brand.remindersPaused;
      case 'paused':
        return brand.remindersPaused;
      default:
        return true;
    }
  }

  private compare(a: BrandView, b: BrandView, key: BrandSort): number {
    switch (key) {
      case 'invoiced':
        return a.totalInvoiced - b.totalInvoiced;
      case 'outstanding':
        return a.outstanding - b.outstanding;
      case 'reliability':
        return a.reliability - b.reliability;
      case 'activity':
        return (a.lastActivity ?? '').localeCompare(b.lastActivity ?? '');
      default:
        return a.name.localeCompare(b.name);
    }
  }

  /** Un clic sur la colonne déjà triée inverse le sens, sinon on repart du sens naturel. */
  protected toggleSort(key: BrandSort): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.setSort(key);
  }

  protected setSort(key: BrandSort): void {
    this.sortKey.set(key);
    this.sortDirection.set(NATURAL_DIRECTION[key]);
  }

  protected ariaSort(key: BrandSort): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected resetFilters(): void {
    this.search.set('');
    this.filter.set('all');
  }

  /** Deux initiales au maximum : au-delà, la pastille devient illisible. */
  protected initials(name: string): string {
    const letters = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');

    return letters || '—';
  }

  protected avatar(name: string): string {
    const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return AVATARS[seed % AVATARS.length];
  }

  private tone(score: number) {
    return RELIABILITY_TONES.find((entry) => score >= entry.min) ?? RELIABILITY_TONES[3];
  }

  protected reliabilityBar(score: number): string {
    return this.tone(score).bar;
  }

  protected reliabilityText(score: number): string {
    return this.tone(score).text;
  }

  protected reliabilityChip(score: number): string {
    return this.tone(score).soft;
  }

  protected reliabilityStroke(score: number): string {
    return this.tone(score).stroke;
  }

  protected sheetSubtitle(brand: BrandView): string {
    return [brand.contact, brand.email].filter(Boolean).join(' · ');
  }

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
      countryCode: brand.countryCode,
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
    const edited = this.editedId;
    const request = edited
      ? this.service.update(edited, this.form)
      : this.service.create(this.form);

    request.subscribe((result) => {
      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }

      this.message.set(this.i18n.t(edited ? 'brands.flash.updated' : 'brands.flash.created'));
      this.close();
    });
  }

  protected remove(brand: BrandView): void {
    this.service.remove(brand.id).subscribe((result) => {
      this.message.set(
        result.ok
          ? this.i18n.t('brands.flash.deleted', { name: brand.name })
          : this.i18n.error(result),
      );
    });
  }

  protected togglePause(brand: BrandView): void {
    this.service.togglePause(brand.id).subscribe((result) => {
      if (!result.ok) {
        this.message.set(this.i18n.error(result));
      }
    });
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
