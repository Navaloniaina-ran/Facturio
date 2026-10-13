import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, DEMO_ACCOUNTS } from '../../core/auth.service';
import { WorkspaceType } from '../../core/models';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { WorkspaceRoutes } from '../../core/workspace-routes';

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
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly routes = inject(WorkspaceRoutes);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  protected readonly businessPortal = this.route.snapshot.data['businessPortal'] === true;

  protected email = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  /** Chaîne d'avancement mise en avant sur le panneau de gauche. */
  protected readonly chain = this.businessPortal
    ? [
        'login.businessChain1',
        'login.businessChain2',
        'login.businessChain3',
        'login.businessChain4',
      ]
    : ['login.chain1', 'login.chain2', 'login.chain3', 'login.chain4'];

  protected submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .signIn(this.email, this.password, this.businessPortal ? 'BUSINESS' : 'CREATOR')
      .subscribe((result) => {
        this.loading.set(false);
        if (!result.ok) {
          this.error.set(this.i18n.error(result));
          return;
        }
        void this.router.navigate([this.routes.home()]);
      });
  }

  /** Accès direct au jeu de données de démonstration. */
  protected enterDemo(workspaceType: WorkspaceType): void {
    const account = DEMO_ACCOUNTS.find((item) => item.workspaceType === workspaceType);
    if (!account) {
      return;
    }
    this.email = account.email;
    this.password = account.password;
    this.submit();
  }
}
