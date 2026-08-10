import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, InscriptionCreateur } from '../../core/auth.service';

/**
 * Inscription créateur en deux étapes maximum (règle d'ergonomie 9.3).
 * Les informations non indispensables — identifiant fiscal, coordonnées
 * bancaires, logo — sont demandées plus tard via l'onboarding progressif.
 */
@Component({
  selector: 'app-inscription',
  imports: [FormsModule, RouterLink],
  templateUrl: './inscription.component.html',
})
export class InscriptionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly etape = signal<1 | 2>(1);
  protected readonly erreur = signal<string | null>(null);

  protected readonly plateformesDisponibles = ['Instagram', 'TikTok', 'YouTube', 'X', 'Twitch', 'LinkedIn'];
  protected readonly sousProfils = [
    { valeur: 'INFLUENCEUR' as const, libelle: 'Influenceur' },
    { valeur: 'CREATEUR' as const, libelle: 'Créateur de contenu' },
    { valeur: 'FREELANCE' as const, libelle: 'Freelance' },
  ];
  protected readonly devises = ['EUR', 'USD', 'MGA', 'XOF'];

  protected formulaire: InscriptionCreateur = {
    nom: '',
    pseudo: '',
    email: '',
    motDePasse: '',
    sousProfil: 'CREATEUR',
    plateformes: [],
    thematique: '',
    pays: 'France',
    devise: 'EUR',
    assujettiTva: false,
  };
  protected cgu = false;

  protected etape1Valide(): boolean {
    return (
      this.formulaire.nom.trim().length > 1 &&
      this.formulaire.email.includes('@') &&
      this.formulaire.motDePasse.length >= 6
    );
  }

  protected plateformeChoisie(plateforme: string): boolean {
    return this.formulaire.plateformes.includes(plateforme);
  }

  protected basculerPlateforme(plateforme: string): void {
    this.formulaire.plateformes = this.plateformeChoisie(plateforme)
      ? this.formulaire.plateformes.filter((p) => p !== plateforme)
      : [...this.formulaire.plateformes, plateforme];
  }

  protected suivant(): void {
    if (!this.etape1Valide()) {
      this.erreur.set('Nom, email valide et mot de passe de 6 caractères minimum sont requis.');
      return;
    }
    this.erreur.set(null);
    this.etape.set(2);
  }

  protected retour(): void {
    this.erreur.set(null);
    this.etape.set(1);
  }

  protected valider(): void {
    if (!this.cgu) {
      this.erreur.set('Vous devez accepter les conditions générales d’utilisation.');
      return;
    }

    const resultat = this.auth.inscription(this.formulaire);
    if (!resultat.ok) {
      this.erreur.set(resultat.message ?? 'Inscription impossible.');
      return;
    }

    void this.router.navigate(['/app/tableau-de-bord']);
  }
}
