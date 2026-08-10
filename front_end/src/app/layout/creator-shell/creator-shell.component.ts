import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { CollaborationService } from '../../pages/collaborations/collaboration.service';
import { InvoiceService } from '../../pages/invoices/invoice.service';
import { ReminderService } from '../../pages/reminders/reminder.service';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';

export interface NavEntry {
  path: string;
  label: string;
  icon: string;
  badge: number;
}

/** Icônes 24×24 tracées à la main, sans dépendance externe. */
const ICONS = {
  dashboard: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
  brands: 'M12 3l2.6 5.6 6.1.8-4.5 4.3 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z',
  campaigns: 'M4 10v4l10 4V6zm12-2h4v8h-4z',
  quotes: 'M6 2h8l4 4v16H6zm2 8h8v2H8zm0 4h8v2H8z',
  invoices: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zm3 5h8v2H8zm0 4h8v2H8z',
  payments: 'M2 6h20v4H2zm0 6h20v6H2zm2 2h6v2H4z',
  reminders: 'M12 2a6 6 0 0 0-6 6v5l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-3 18h6a3 3 0 0 1-6 0z',
  reports: 'M4 20h4V10H4zm6 0h4V4h-4zm6 0h4v-7h-4z',
  collaborations:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5v1H3v-1zm14 1v-1c0-1.5-.6-2.8-1.6-3.7 2.7.2 4.6 1.7 4.6 3.7v1h-3z',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm9-2-2-.5a7 7 0 0 0-.6-1.5l1.1-1.7-1.4-1.4-1.7 1.1a7 7 0 0 0-1.5-.6L14.5 3h-2l-.5 2a7 7 0 0 0-1.5.6L8.8 4.5 7.4 5.9 8.5 7.6a7 7 0 0 0-.6 1.5L6 9.6v2l1.9.5a7 7 0 0 0 .6 1.5L7.4 15.3l1.4 1.4 1.7-1.1a7 7 0 0 0 1.5.6l.5 2h2l.5-2a7 7 0 0 0 1.5-.6l1.7 1.1 1.4-1.4-1.1-1.7a7 7 0 0 0 .6-1.5l1.9-.5v-2z',
} as const;

/**
 * Coquille de l'espace Créateur : navigation figée à gauche, en-tête figé, et
 * défilement réservé au seul corps du contenu.
 * Au chargement, le recalcul quotidien des échéances est appliqué (P08) ;
 * en production, cette tâche est planifiée côté backend.
 */
@Component({
  selector: 'app-creator-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitchComponent],
  templateUrl: './creator-shell.component.html',
})
export class CreatorShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly reminders = inject(ReminderService);
  private readonly collaborations = inject(CollaborationService);
  protected readonly i18n = inject(I18nService);

  protected readonly mobileNavOpen = signal(false);
  /** Menu déroulant porté par le nom de l'utilisateur. */
  protected readonly userMenuOpen = signal(false);
  protected readonly creator = this.store.creator.asReadonly();

  protected readonly navigation = computed<NavEntry[]>(() => [
    { path: 'tableau-de-bord', label: this.i18n.t('nav.dashboard'), icon: ICONS.dashboard, badge: 0 },
    { path: 'marques', label: this.i18n.vocab('clients'), icon: ICONS.brands, badge: 0 },
    {
      path: 'collaborations',
      label: this.i18n.t('nav.collaborations'),
      icon: ICONS.collaborations,
      badge: this.collaborations.nextActions().filter((item) => item.actionDue).length,
    },
    { path: 'campagnes', label: this.i18n.vocab('projects'), icon: ICONS.campaigns, badge: 0 },
    { path: 'propositions', label: this.i18n.vocab('quotes'), icon: ICONS.quotes, badge: 0 },
    {
      path: 'factures',
      label: this.i18n.vocab('invoices'),
      icon: ICONS.invoices,
      badge: this.invoices.overdue().length,
    },
    { path: 'paiements', label: this.i18n.t('nav.payments'), icon: ICONS.payments, badge: 0 },
    {
      path: 'relances',
      label: this.i18n.vocab('reminders'),
      icon: ICONS.reminders,
      badge: this.reminders.queue().length,
    },
    { path: 'rapports', label: this.i18n.t('nav.reports'), icon: ICONS.reports, badge: 0 },
    { path: 'parametres', label: this.i18n.t('nav.settings'), icon: ICONS.settings, badge: 0 },
  ]);

  protected readonly initials = computed(() =>
    this.creator()
      .name.split(' ')
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

  protected readonly firstName = computed(() => this.creator().name.split(' ')[0]);

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
    this.auth.signOut();
    void this.router.navigate(['/createurs/connexion']);
  }
}
