import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BillingApiService } from './api/billing-api.service';
import { BusinessApiService } from './api/business-api.service';
import { CreatorApiService } from './api/creator-api.service';
import { WorkspaceType } from './models';
import { PmeStore } from './pme/pme-store.service';
import { WorkspaceStore } from './workspace-store.service';

/**
 * Remplit l'espace de travail depuis l'API après une connexion réelle.
 *
 * Les modules déjà branchés — profil, paramètres, marques, campagnes,
 * collaborations, abonnement — sont chargés depuis le backend. Ceux qui ne le
 * sont pas encore (facturation, paiements, relances) partent vides : mieux vaut
 * un écran vide qu'un jeu de démonstration présenté comme des données réelles.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceSyncService {
  private readonly api = inject(CreatorApiService);
  private readonly billing = inject(BillingApiService);
  private readonly business = inject(BusinessApiService);
  private readonly store = inject(WorkspaceStore);
  private readonly pme = inject(PmeStore);

  /** Charge l'espace ; renvoie faux si une des ressources n'a pu être lue. */
  load(type: WorkspaceType): Observable<boolean> {
    const creator = type === 'CREATOR';
    const companyId = this.pme.activeCompanyId() ?? 'remote-company';

    return forkJoin({
      profile: this.optional(creator ? this.api.creatorProfile() : null),
      settings: this.optional(this.api.settings(this.store.settings())),
      brands: this.optional(creator ? this.api.brands() : null),
      campaigns: this.optional(creator ? this.api.campaigns() : null),
      collaborations: this.optional(creator ? this.api.collaborations() : null),
      subscription: this.optional(this.api.subscription()),
      platformInvoices: this.optional(this.api.platformInvoices()),
      invoices: this.optional(creator ? this.billing.invoices() : null),
      quotes: this.optional(creator ? this.billing.quotes() : null),
      reminderSteps: this.optional(creator ? this.billing.reminderRules() : null),
      customers: this.optional(!creator ? this.business.customers(companyId) : null),
      suppliers: this.optional(!creator ? this.business.suppliers(companyId) : null),
    }).pipe(
      switchMap((loaded) => {
        const invoices = loaded.invoices ?? [];
        const payments = invoices.length
          ? forkJoin(invoices.map((invoice) => this.billing.payments(invoice.id))).pipe(
              map((lists) => lists.flat()),
            )
          : of([]);
        const reminders = invoices.length
          ? forkJoin(invoices.map((invoice) => this.billing.reminders(invoice.id))).pipe(
              map((lists) => lists.flat()),
            )
          : of([]);

        return forkJoin({
          payments: this.optional(creator ? payments : null),
          reminders: this.optional(creator ? reminders : null),
        }).pipe(map((billing) => ({ ...loaded, ...billing })));
      }),
      map((loaded) => {
        this.store.remote.set(true);

        if (loaded.profile) {
          this.store.creator.set(loaded.profile);
        }
        if (loaded.settings) {
          this.store.settings.set(loaded.settings);
        }
        if (loaded.subscription) {
          this.store.subscription.set(loaded.subscription);
        }

        this.store.brands.set(loaded.brands ?? []);
        this.store.campaigns.set(loaded.campaigns ?? []);
        this.store.collaborations.set(loaded.collaborations ?? []);
        this.store.platformInvoices.set(loaded.platformInvoices ?? []);
        const invoices = loaded.invoices ?? [];
        this.store.invoices.set(invoices);
        this.store.quotes.set(
          (loaded.quotes ?? []).map((quote) => ({
            ...quote,
            invoiceId: invoices.find((invoice) => invoice.quoteId === quote.id)?.id ?? null,
          })),
        );
        this.store.payments.set(loaded.payments ?? []);
        this.store.reminders.set(loaded.reminders ?? []);
        if (loaded.reminderSteps) {
          this.store.reminderSteps.set(loaded.reminderSteps);
        }
        if (!creator) {
          this.pme.useRemote(
            loaded.customers ?? [],
            loaded.suppliers ?? [],
            loaded.settings?.businessName,
          );
        }

        return Object.values(loaded).every((value) => value !== null);
      }),
    );
  }

  /** Une ressource illisible ne fait pas échouer le chargement complet. */
  private optional<T>(source: Observable<T> | null): Observable<T | null> {
    return source ? source.pipe(catchError(() => of(null))) : of(null);
  }
}
