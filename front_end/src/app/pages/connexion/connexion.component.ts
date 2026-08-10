import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/**
 * Tunnel de connexion créateur (/createurs/connexion).
 * La même page sert le portail entreprise (/entreprises/connexion) : le compte
 * étant de type CREATOR, l'utilisateur est redirigé en silence vers son espace
 * avec un message discret (comportement 9.2 du cahier des charges).
 */
@Component({
  selector: 'app-connexion',
  imports: [FormsModule, RouterLink],
  templateUrl: './connexion.component.html',
})
export class ConnexionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly portailEntreprise = this.route.snapshot.data['portailEntreprise'] === true;

  protected email = '';
  protected motDePasse = '';
  protected readonly erreur = signal<string | null>(null);
  protected readonly information = signal<string | null>(null);

  /** Chaîne d'avancement mise en avant sur le panneau de gauche. */
  protected readonly chaine = [
    'Proposition envoyée et acceptée en ligne',
    'Contrat et livrables suivis dans la campagne',
    'Facture générée sans ressaisie',
    'Relances automatiques jusqu’à l’encaissement',
  ];

  protected valider(): void {
    const resultat = this.auth.connexion(this.email, this.motDePasse);

    if (!resultat.ok) {
      this.erreur.set(resultat.message ?? 'Connexion impossible.');
      return;
    }

    this.erreur.set(null);
    void this.router.navigate(['/app/tableau-de-bord'], {
      state: this.portailEntreprise ? { messageEspace: 'Votre espace est un espace Créateur' } : {},
    });
  }

  /** Accès direct au jeu de données de démonstration. */
  protected entrerEnDemonstration(): void {
    this.email = 'toky@callandco.fr';
    this.motDePasse = 'demonstration';
    this.valider();
  }

  protected connexionGoogle(): void {
    this.information.set('La connexion Google sera activée avec l’API à la mise en production.');
  }

  /** Message neutre quel que soit le résultat, pour ne rien révéler. */
  protected motDePasseOublie(): void {
    this.information.set(
      'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.',
    );
  }
}
