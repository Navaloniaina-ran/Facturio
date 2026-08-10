import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BadgeStatutComponent } from '../../shared/badge-statut/badge-statut.component';
import { CarteKpiComponent } from '../../shared/carte-kpi/carte-kpi.component';
import { MontantPipe } from '../../shared/montant.pipe';
import { TableauDeBordService } from './tableau-de-bord.service';

/**
 * Écran affiché dès la connexion (P02) : il répond sans clic supplémentaire à
 * « combien dois-je encore recevoir, et de qui ? ». Chaque indicateur renvoie
 * vers la liste filtrée correspondante.
 */
@Component({
  selector: 'app-tableau-de-bord',
  imports: [RouterLink, DatePipe, MontantPipe, CarteKpiComponent, BadgeStatutComponent],
  templateUrl: './tableau-de-bord.component.html',
})
export class TableauDeBordComponent {
  private readonly router = inject(Router);
  protected readonly tdb = inject(TableauDeBordService);

  /** Message discret affiché lorsque l'accès s'est fait par le portail entreprise. */
  protected readonly messageEspace = signal<string | null>(
    (this.router.getCurrentNavigation()?.extras.state?.['messageEspace'] as string | undefined) ?? null,
  );

  protected readonly onboardingMasque = signal(false);
}
