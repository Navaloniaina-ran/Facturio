import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { DashboardService } from './dashboard.service';

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
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly board = inject(DashboardService);

  /** Message discret affiché lorsque l'accès s'est fait par le portail entreprise. */
  protected readonly spaceNotice = signal<string | null>(
    (this.router.getCurrentNavigation()?.extras.state?.['spaceNotice'] as string | undefined) ??
      null,
  );

  protected readonly onboardingHidden = signal(false);
}
