import { Injectable, computed, signal } from '@angular/core';
import { documentNumber, today } from './calculations';
import {
  DEMO_BRANDS,
  DEMO_CAMPAIGNS,
  DEMO_COLLABORATIONS,
  DEMO_CREATOR,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_PLATFORM_INVOICES,
  DEMO_QUOTES,
  DEMO_REMINDER_STEPS,
  DEMO_SETTINGS,
  DEMO_SUBSCRIPTION,
} from './demo-data';
import {
  Activity,
  ActivityType,
  Brand,
  Campaign,
  Collaboration,
  Creator,
  EmailLog,
  Invoice,
  Payment,
  PlatformInvoice,
  Quote,
  Reminder,
  ReminderStep,
  Settings,
  Subscription,
} from './models';

export type ReminderMode = 'AUTO' | 'MANUAL';

/** Séries de numérotation, chacune avec son propre compteur. */
export type NumberSeries = 'INVOICE' | 'CREDIT_NOTE' | 'QUOTE';

/**
 * Source de vérité unique de l'espace de travail courant.
 * Les services métier (brand, invoice, payment…) lisent et écrivent ici :
 * cela évite toute dépendance circulaire entre eux.
 *
 * En production, ces signaux seraient alimentés par l'API NestJS ;
 * ici les données restent en mémoire pour rendre le front démontrable seul.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  readonly creator = signal<Creator>(structuredClone(DEMO_CREATOR));
  readonly settings = signal<Settings>(structuredClone(DEMO_SETTINGS));
  readonly subscription = signal<Subscription>(structuredClone(DEMO_SUBSCRIPTION));
  readonly platformInvoices = signal<PlatformInvoice[]>(structuredClone(DEMO_PLATFORM_INVOICES));
  readonly brands = signal<Brand[]>(structuredClone(DEMO_BRANDS));
  readonly campaigns = signal<Campaign[]>(structuredClone(DEMO_CAMPAIGNS));
  readonly collaborations = signal<Collaboration[]>(structuredClone(DEMO_COLLABORATIONS));
  readonly quotes = signal<Quote[]>(structuredClone(DEMO_QUOTES));
  readonly invoices = signal<Invoice[]>(structuredClone(DEMO_INVOICES));
  readonly payments = signal<Payment[]>(structuredClone(DEMO_PAYMENTS));
  readonly reminderSteps = signal<ReminderStep[]>(structuredClone(DEMO_REMINDER_STEPS));
  readonly reminders = signal<Reminder[]>([]);
  readonly reminderMode = signal<ReminderMode>('MANUAL');
  readonly emails = signal<EmailLog[]>([]);
  readonly activities = signal<Activity[]>([]);

  /**
   * Vrai lorsque les données viennent de l'API : les services métier écrivent
   * alors côté serveur au lieu de se contenter du jeu de démonstration.
   */
  readonly remote = signal(false);

  private readonly counters = new Map<string, number>();
  private sequence = 100;

  /** La devise vient des paramètres : on ne la saisit qu'une fois. */
  readonly currency = computed(() => this.settings().currency);

  /** Tâches d'onboarding progressif restant à cocher (P12). */
  readonly onboarding = computed(() => {
    const settings = this.settings();
    return [
      { key: 'logo', labelKey: 'onboarding.logo', done: settings.logo !== null },
      { key: 'bank', labelKey: 'onboarding.bank', done: settings.bankDetails.trim().length > 0 },
      { key: 'brand', labelKey: 'onboarding.brand', done: this.brands().length > 0 },
      { key: 'invoice', labelKey: 'onboarding.invoice', done: this.invoices().length > 0 },
    ];
  });

  constructor() {
    this.resetCounters();
  }

  /**
   * Retour au jeu de démonstration : à la déconnexion, rien de ce qui vient de
   * l'API ne doit survivre à la session suivante.
   */
  resetDemo(): void {
    this.remote.set(false);
    this.creator.set(structuredClone(DEMO_CREATOR));
    this.settings.set(structuredClone(DEMO_SETTINGS));
    this.subscription.set(structuredClone(DEMO_SUBSCRIPTION));
    this.platformInvoices.set(structuredClone(DEMO_PLATFORM_INVOICES));
    this.brands.set(structuredClone(DEMO_BRANDS));
    this.campaigns.set(structuredClone(DEMO_CAMPAIGNS));
    this.collaborations.set(structuredClone(DEMO_COLLABORATIONS));
    this.quotes.set(structuredClone(DEMO_QUOTES));
    this.invoices.set(structuredClone(DEMO_INVOICES));
    this.payments.set(structuredClone(DEMO_PAYMENTS));
    this.reminderSteps.set(structuredClone(DEMO_REMINDER_STEPS));
    this.reminders.set([]);
    this.emails.set([]);
    this.activities.set([]);
    this.resetCounters();
  }

  /**
   * Vide les modules de facturation. Ils ne sont pas encore servis par l'API :
   * les laisser garnis de démonstration ferait passer des documents fictifs
   * pour des documents réels.
   */
  clearBillingData(): void {
    this.quotes.set([]);
    this.invoices.set([]);
    this.payments.set([]);
    this.reminders.set([]);
    this.emails.set([]);
    this.activities.set([]);
  }

  private resetCounters(): void {
    // Les compteurs reprennent la numérotation déjà consommée par série.
    this.counters.clear();
    this.counters.set(
      DEMO_SETTINGS.invoicePrefix,
      this.highestCounter(DEMO_INVOICES.filter((i) => i.kind === 'INVOICE').map((i) => i.number)),
    );
    this.counters.set(
      DEMO_SETTINGS.quotePrefix,
      this.highestCounter(DEMO_QUOTES.map((q) => q.number)),
    );
  }

  newId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}${this.sequence}`;
  }

  /** Compteur séquentiel sans trou, attribué à la validation du document. */
  nextNumber(series: NumberSeries): string {
    const prefix = this.prefixOf(series);
    const counter = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, counter);
    return documentNumber(prefix, new Date().getFullYear(), counter);
  }

  /** Numéro qui sera attribué au prochain document, sans le consommer. */
  peekNumber(series: NumberSeries): string {
    return this.peekNumberFor(this.prefixOf(series));
  }

  /**
   * Même calcul, pour un préfixe donné : l'écran Paramètres montre ainsi le
   * numéro qu'attribuerait le préfixe en cours de saisie. Chaque préfixe a son
   * propre compteur, une nouvelle série repart donc à 0001.
   */
  peekNumberFor(prefix: string): string {
    return documentNumber(prefix, new Date().getFullYear(), (this.counters.get(prefix) ?? 0) + 1);
  }

  /** Séries distinctes pour les devis, les factures et les avoirs (15.3). */
  private prefixOf(series: NumberSeries): string {
    const settings = this.settings();
    if (series === 'QUOTE') {
      return settings.quotePrefix;
    }
    return series === 'CREDIT_NOTE' ? settings.creditPrefix : settings.invoicePrefix;
  }

  brand(id: string): Brand | undefined {
    return this.brands().find((b) => b.id === id);
  }

  brandName(id: string): string {
    return this.brand(id)?.name ?? '—';
  }

  campaign(id: string | null): Campaign | undefined {
    return id ? this.campaigns().find((c) => c.id === id) : undefined;
  }

  /** Journalise une activité sous forme de clé traduisible. */
  log(type: ActivityType, messageKey: string, params: Record<string, string | number> = {}): void {
    const activity: Activity = { id: this.newId('a'), date: today(), type, messageKey, params };
    this.activities.update((list) => [activity, ...list].slice(0, 20));
  }

  /** Plus grand compteur d'une série, sur l'année en cours uniquement. */
  private highestCounter(numbers: string[]): number {
    const year = String(new Date().getFullYear());

    return numbers.reduce((highest, number) => {
      const [, numberYear, counter] = number.split('-');
      if (numberYear !== year) {
        return highest;
      }
      return Math.max(highest, Number(counter) || 0);
    }, 0);
  }
}
