import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SignupData } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { WorkspaceRoutes } from '../../core/workspace-routes';

/**
 * Inscription créateur en deux étapes maximum (règle d'ergonomie 9.3).
 * Les informations non indispensables — identifiant fiscal, coordonnées
 * bancaires, logo — sont demandées plus tard via l'onboarding progressif.
 */
@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink, LanguageSwitchComponent],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  private readonly routes = inject(WorkspaceRoutes);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly step = signal<1 | 2>(1);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly platforms = ['Instagram', 'TikTok', 'YouTube', 'X', 'Twitch', 'LinkedIn'];
  protected readonly profiles = ['INFLUENCER', 'CREATOR', 'FREELANCE'] as const;
  protected readonly currencies = ['EUR', 'USD', 'MGA', 'XOF'];
  protected readonly countries = [
    'France',
    'Madagascar',
    'Belgique',
    'Suisse',
    'Canada',
    'Sénégal',
  ];

  protected form: SignupData = {
    name: '',
    handle: '',
    email: '',
    password: '',
    subProfile: 'CREATOR',
    platforms: [],
    niche: '',
    country: 'France',
    currency: 'EUR',
    vatRegistered: false,
  };
  protected confirmPassword = '';
  protected termsAccepted = false;

  protected step1Valid(): boolean {
    return (
      this.form.name.trim().length > 1 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()) &&
      this.form.password.length >= 8 &&
      this.form.password === this.confirmPassword
    );
  }

  protected platformSelected(platform: string): boolean {
    return this.form.platforms.includes(platform);
  }

  protected togglePlatform(platform: string): void {
    this.form.platforms = this.platformSelected(platform)
      ? this.form.platforms.filter((p) => p !== platform)
      : [...this.form.platforms, platform];
  }

  protected next(): void {
    if (this.form.password !== this.confirmPassword) {
      this.error.set(this.i18n.t('signup.error.passwordMismatch'));
      return;
    }
    if (!this.step1Valid()) {
      this.error.set(this.i18n.t('signup.error.step1'));
      return;
    }
    this.error.set(null);
    this.step.set(2);
  }

  protected back(): void {
    this.error.set(null);
    this.step.set(1);
  }

  protected submit(): void {
    if (!this.termsAccepted) {
      this.error.set(this.i18n.t('signup.error.terms'));
      return;
    }

    const data = {
      ...this.form,
      name: this.form.name.trim(),
      handle: this.normalizedHandle(),
      email: this.form.email.trim().toLowerCase(),
      niche: this.form.niche.trim(),
    };

    this.loading.set(true);
    this.error.set(null);
    this.auth.signUp(data).subscribe((result) => {
      this.loading.set(false);
      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }
      void this.router.navigate([this.routes.home()]);
    });
  }

  private normalizedHandle(): string {
    const handle = this.form.handle.trim();
    return handle && !handle.startsWith('@') ? `@${handle}` : handle;
  }
}
