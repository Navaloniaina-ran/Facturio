import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { PmeStore } from '../../core/pme/pme-store.service';
import { CollaborationService } from '../../pages/collaborations/collaboration.service';
import { InvoiceService } from '../../pages/invoices/invoice.service';
import { ReminderService } from '../../pages/reminders/reminder.service';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { ToastsComponent } from '../../shared/toasts/toasts.component';
import { ICONS, NAV_ICONS } from '../../shared/icons';

export interface NavEntry {
  path: string;
  label: string;
  icon: string;
  badge: number;
}

/**
 * Coquille de l'espace Créateur : navigation figée à gauche, en-tête figé, et
 * défilement réservé au seul corps du contenu.
 * Au chargement, le recalcul quotidien des échéances est appliqué (P08) ;
 * en production, cette tâche est planifiée côté backend.
 */
@Component({
  selector: 'app-creator-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitchComponent, ToastsComponent],
  templateUrl: './creator-shell.component.html',
})
export class CreatorShellComponent {
  protected readonly icons = ICONS;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(WorkspaceStore);
  private readonly pmeStore = inject(PmeStore);
  private readonly invoices = inject(InvoiceService);
  private readonly reminders = inject(ReminderService);
  private readonly collaborations = inject(CollaborationService);
  protected readonly i18n = inject(I18nService);

  protected readonly mobileNavOpen = signal(false);
  /** Menu déroulant porté par le nom de l'utilisateur. */
  protected readonly userMenuOpen = signal(false);
  protected readonly creator = this.store.creator.asReadonly();
  protected readonly isBusiness = computed(() => this.auth.workspaceType() === 'BUSINESS');
  protected readonly displayName = computed(() =>
    this.isBusiness() ? (this.pmeStore.activeCompany()?.name ?? 'Entreprise') : this.creator().name,
  );
  protected readonly displayEmail = computed(() =>
    this.isBusiness() ? (this.pmeStore.activeCompany()?.email ?? '') : this.creator().email,
  );
  protected readonly displayCurrency = computed(() =>
    this.isBusiness() ? 'EUR' : this.creator().currency,
  );
  protected readonly plan = computed(() => this.store.subscription().plan);

  /**
   * La navigation dépend du profil : une PME tient un fichier clients et un
   * fichier fournisseurs, et n'a que faire des campagnes ou des livrables.
   */
  protected readonly navigation = computed<NavEntry[]>(() =>
    this.auth.workspaceType() === 'BUSINESS' ? this.businessNavigation() : this.creatorNavigation(),
  );

  private readonly businessNavigation = computed<NavEntry[]>(() => [
    {
      path: 'tableau-de-bord',
      label: this.i18n.t('nav.dashboard'),
      icon: NAV_ICONS.dashboard,
      badge: 0,
    },
    {
      path: 'clients',
      label: this.i18n.t('pme.customers.title'),
      icon: NAV_ICONS.brands,
      badge: 0,
    },
    {
      path: 'fournisseurs',
      label: this.i18n.t('pme.suppliers.title'),
      icon: NAV_ICONS.collaborations,
      badge: 0,
    },
    { path: 'propositions', label: this.i18n.vocab('quotes'), icon: NAV_ICONS.quotes, badge: 0 },
    {
      path: 'factures',
      label: this.i18n.vocab('invoices'),
      icon: NAV_ICONS.invoices,
      badge: this.invoices.overdue().length,
    },
    { path: 'paiements', label: this.i18n.t('nav.payments'), icon: NAV_ICONS.payments, badge: 0 },
    {
      path: 'relances',
      label: this.i18n.vocab('reminders'),
      icon: NAV_ICONS.reminders,
      badge: this.reminders.queue().length,
    },
    { path: 'rapports', label: this.i18n.t('nav.reports'), icon: NAV_ICONS.reports, badge: 0 },
    { path: 'modeles', label: this.i18n.t('nav.templates'), icon: NAV_ICONS.templates, badge: 0 },
    { path: 'parametres', label: this.i18n.t('nav.settings'), icon: NAV_ICONS.settings, badge: 0 },
  ]);

  private readonly creatorNavigation = computed<NavEntry[]>(() => [
    {
      path: 'tableau-de-bord',
      label: this.i18n.t('nav.dashboard'),
      icon: NAV_ICONS.dashboard,
      badge: 0,
    },
    { path: 'marques', label: this.i18n.vocab('clients'), icon: NAV_ICONS.brands, badge: 0 },
    {
      path: 'collaborations',
      label: this.i18n.t('nav.collaborations'),
      icon: NAV_ICONS.collaborations,
      badge: this.collaborations.nextActions().filter((item) => item.actionDue).length,
    },
    { path: 'campagnes', label: this.i18n.vocab('projects'), icon: NAV_ICONS.campaigns, badge: 0 },
    { path: 'propositions', label: this.i18n.vocab('quotes'), icon: NAV_ICONS.quotes, badge: 0 },
    {
      path: 'factures',
      label: this.i18n.vocab('invoices'),
      icon: NAV_ICONS.invoices,
      badge: this.invoices.overdue().length,
    },
    { path: 'paiements', label: this.i18n.t('nav.payments'), icon: NAV_ICONS.payments, badge: 0 },
    {
      path: 'relances',
      label: this.i18n.vocab('reminders'),
      icon: NAV_ICONS.reminders,
      badge: this.reminders.queue().length,
    },
    { path: 'rapports', label: this.i18n.t('nav.reports'), icon: NAV_ICONS.reports, badge: 0 },
    { path: 'modeles', label: this.i18n.t('nav.templates'), icon: NAV_ICONS.templates, badge: 0 },
    { path: 'parametres', label: this.i18n.t('nav.settings'), icon: NAV_ICONS.settings, badge: 0 },
  ]);

  protected readonly initials = computed(() =>
    this.displayName()
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected readonly period = computed(() => this.i18n.monthYear(new Date()));

  protected readonly notificationCount = computed(
    () => this.invoices.overdue().length + this.reminders.queue().length,
  );

  protected readonly remainingTasks = computed(
    () => this.store.onboarding().filter((task) => !task.done).length,
  );

  protected readonly firstName = computed(() => this.displayName().split(' ')[0]);

  constructor() {
    this.invoices.recomputeStatuses();
  }

  protected toggleNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected signOut(): void {
    this.closeUserMenu();
    const portal = this.isBusiness() ? '/entreprises/connexion' : '/createurs/connexion';
    this.auth.signOut();
    void this.router.navigate([portal]);
  }
}
