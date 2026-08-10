import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';

/**
 * Tunnel de connexion créateur (/createurs/connexion).
 * La même page sert le portail entreprise (/entreprises/connexion) : le compte
 * étant de type CREATOR, l'utilisateur est redirigé en silence vers son espace
 * avec un message discret (comportement 9.2 du cahier des charges).
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, LanguageSwitchComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  protected readonly businessPortal = this.route.snapshot.data['businessPortal'] === true;

  protected email = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);

  /** Chaîne d'avancement mise en avant sur le panneau de gauche. */
  protected readonly chain = ['login.chain1', 'login.chain2', 'login.chain3', 'login.chain4'];

  protected submit(): void {
    const result = this.auth.signIn(this.email, this.password);

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.error.set(null);
    void this.router.navigate(['/app/tableau-de-bord'], {
      state: this.businessPortal ? { spaceNotice: this.i18n.t('login.spaceNotice') } : {},
    });
  }

  /** Accès direct au jeu de données de démonstration. */
  protected enterDemo(): void {
    this.email = 'toky@callandco.fr';
    this.password = 'demonstration';
    this.submit();
  }

  protected googleSignIn(): void {
    this.info.set(this.i18n.t('login.googleSoon'));
  }

  /** Message neutre quel que soit le résultat, pour ne rien révéler. */
  protected forgotPassword(): void {
    this.info.set(this.i18n.t('login.forgotSent'));
  }
}
