import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { DashboardService } from './dashboard.service';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';

/**
 * Écran affiché dès la connexion (P02) : il répond sans clic supplémentaire à
 * « combien dois-je encore recevoir, et de qui ? ». Chaque indicateur renvoie
 * vers la liste filtrée correspondante.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, AmountPipe, LocalDatePipe, KpiCardComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly icons = ICONS;

  protected readonly routes = inject(WorkspaceRoutes);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly board = inject(DashboardService);

  /**
   * Le tableau de bord est commun aux deux espaces, mais deux de ses volets
   * — campagnes et collaborations — renvoient vers des écrans réservés au
   * créateur. Les proposer à une PME donnerait des liens que la garde de
   * route refuse.
   */
  protected readonly isCreator = computed(() => this.auth.workspaceType() === 'CREATOR');

  protected readonly onboardingHidden = signal(false);
}
