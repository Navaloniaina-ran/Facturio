import { Injectable, computed, inject, signal } from '@angular/core';
import { BusinessApiService } from '../api/business-api.service';
import { DEMO_COMPANIES, DEMO_CUSTOMERS, DEMO_SUPPLIERS } from './pme-demo-data';
import { Company, Customer, Supplier } from './pme.models';

const ACTIVE_COMPANY_KEY = 'facturio.pme.company';

/**
 * Magasin de l'espace PME.
 *
 * Une même personne peut administrer plusieurs entreprises. Tout ce que
 * l'interface donne à voir passe donc par un filtre sur l'entreprise active :
 * `customers()` et `suppliers()` ne sont jamais les listes brutes.
 *
 * C'est le point où l'application se casse le plus silencieusement — un écran
 * qui lirait `allCustomers` afficherait le fichier client d'une autre PME sans
 * qu'aucune erreur ne se produise. Les listes complètes restent donc privées.
 */
@Injectable({ providedIn: 'root' })
export class PmeStore {
  private readonly api = inject(BusinessApiService);
  private readonly allCompanies = signal<Company[]>(DEMO_COMPANIES);
  private readonly allCustomers = signal<Customer[]>(DEMO_CUSTOMERS);
  private readonly allSuppliers = signal<Supplier[]>(DEMO_SUPPLIERS);

  private readonly activeId = signal<string>(this.readActiveId());
  private readonly remote = signal(false);

  readonly companies = this.allCompanies.asReadonly();

  /**
   * Entreprise active. Si l'identifiant mémorisé ne correspond plus à une
   * entreprise accessible, on retombe sur la première disponible plutôt que
   * de laisser l'interface sans contexte.
   */
  readonly activeCompany = computed<Company | null>(() => {
    const companies = this.allCompanies();
    return companies.find((item) => item.id === this.activeId()) ?? companies[0] ?? null;
  });

  readonly activeCompanyId = computed(() => this.activeCompany()?.id ?? null);

  /** Vrai lorsque le sélecteur d'entreprise a lieu d'être affiché. */
  readonly hasMultipleCompanies = computed(() => this.allCompanies().length > 1);

  /** Clients de l'entreprise active, et d'elle seule. */
  readonly customers = computed<Customer[]>(() => {
    const id = this.activeCompanyId();
    return id ? this.allCustomers().filter((item) => item.companyId === id) : [];
  });

  /** Fournisseurs de l'entreprise active, et d'elle seule. */
  readonly suppliers = computed<Supplier[]>(() => {
    const id = this.activeCompanyId();
    return id ? this.allSuppliers().filter((item) => item.companyId === id) : [];
  });

  readonly activeCustomers = computed(() => this.customers().filter((item) => item.active));

  selectCompany(id: string): void {
    if (!this.allCompanies().some((item) => item.id === id)) {
      return;
    }

    this.activeId.set(id);
    try {
      localStorage.setItem(ACTIVE_COMPANY_KEY, id);
    } catch {
      // Rendu serveur ou stockage indisponible : le choix reste en mémoire.
    }
  }

  /**
   * Lecture d'une fiche par identifiant, restreinte à l'entreprise active.
   * Renvoie `null` pour une fiche appartenant à une autre PME : l'appelant
   * doit alors afficher un message explicite, jamais un rendu partiel.
   */
  customerById(id: string): Customer | null {
    return this.customers().find((item) => item.id === id) ?? null;
  }

  supplierById(id: string): Supplier | null {
    return this.suppliers().find((item) => item.id === id) ?? null;
  }

  /**
   * L'entreprise propriétaire est imposée par le magasin, jamais par l'appelant.
   *
   * Le brouillon est cloné : les écrans conservent un objet mutable qu'ils
   * modifient au fil de la saisie, et sans copie la fiche enregistrée
   * continuerait de changer sous l'effet du formulaire.
   */
  addCustomer(customer: Omit<Customer, 'id' | 'companyId'>): Customer | null {
    const companyId = this.activeCompanyId();
    if (!companyId) {
      return null;
    }

    if (this.remote()) {
      const pending: Customer = {
        ...structuredClone(customer),
        id: `pending-${crypto.randomUUID()}`,
        companyId,
      };
      this.api.createCustomer(customer, companyId).subscribe({
        next: (created) => this.allCustomers.update((list) => [...list, created]),
        error: () => undefined,
      });
      return pending;
    }

    const created: Customer = {
      ...structuredClone(customer),
      id: `cl-${crypto.randomUUID()}`,
      companyId,
    };
    this.allCustomers.update((list) => [...list, created]);
    return created;
  }

  addSupplier(supplier: Omit<Supplier, 'id' | 'companyId'>): Supplier | null {
    const companyId = this.activeCompanyId();
    if (!companyId) {
      return null;
    }

    if (this.remote()) {
      const pending: Supplier = {
        ...structuredClone(supplier),
        id: `pending-${crypto.randomUUID()}`,
        companyId,
      };
      this.api.createSupplier(supplier, companyId).subscribe({
        next: (created) => this.allSuppliers.update((list) => [...list, created]),
        error: () => undefined,
      });
      return pending;
    }

    const created: Supplier = {
      ...structuredClone(supplier),
      id: `fo-${crypto.randomUUID()}`,
      companyId,
    };
    this.allSuppliers.update((list) => [...list, created]);
    return created;
  }

  /** La mise à jour ne peut pas franchir la frontière de l'entreprise active. */
  updateCustomer(id: string, patch: Partial<Omit<Customer, 'id' | 'companyId'>>): boolean {
    const existing = this.customerById(id);
    if (!existing) {
      return false;
    }

    if (this.remote()) {
      this.api
        .updateCustomer(id, { ...existing, ...structuredClone(patch) }, existing.companyId)
        .subscribe({
          next: (updated) =>
            this.allCustomers.update((list) =>
              list.map((item) => (item.id === id ? updated : item)),
            ),
          error: () => undefined,
        });
      return true;
    }

    const copy = structuredClone(patch);
    this.allCustomers.update((list) =>
      list.map((item) => (item.id === id ? { ...item, ...copy } : item)),
    );
    return true;
  }

  updateSupplier(id: string, patch: Partial<Omit<Supplier, 'id' | 'companyId'>>): boolean {
    const existing = this.supplierById(id);
    if (!existing) {
      return false;
    }

    if (this.remote()) {
      this.api
        .updateSupplier(id, { ...existing, ...structuredClone(patch) }, existing.companyId)
        .subscribe({
          next: (updated) =>
            this.allSuppliers.update((list) =>
              list.map((item) => (item.id === id ? updated : item)),
            ),
          error: () => undefined,
        });
      return true;
    }

    const copy = structuredClone(patch);
    this.allSuppliers.update((list) =>
      list.map((item) => (item.id === id ? { ...item, ...copy } : item)),
    );
    return true;
  }

  removeCustomer(id: string): boolean {
    if (!this.customerById(id)) {
      return false;
    }

    if (this.remote()) {
      this.api.deleteCustomer(id).subscribe({
        next: () => this.allCustomers.update((list) => list.filter((item) => item.id !== id)),
        error: () => undefined,
      });
      return true;
    }

    this.allCustomers.update((list) => list.filter((item) => item.id !== id));
    return true;
  }

  removeSupplier(id: string): boolean {
    if (!this.supplierById(id)) {
      return false;
    }

    if (this.remote()) {
      this.api.deleteSupplier(id).subscribe({
        next: () => this.allSuppliers.update((list) => list.filter((item) => item.id !== id)),
        error: () => undefined,
      });
      return true;
    }

    this.allSuppliers.update((list) => list.filter((item) => item.id !== id));
    return true;
  }

  private readActiveId(): string {
    try {
      return localStorage.getItem(ACTIVE_COMPANY_KEY) ?? DEMO_COMPANIES[0].id;
    } catch {
      return DEMO_COMPANIES[0].id;
    }
  }

  /** Remplace les jeux de dÃ©monstration par les tiers de l'organisation connectÃ©e. */
  useRemote(customers: Customer[], suppliers: Supplier[], businessName?: string): void {
    this.remote.set(true);
    const company = this.activeCompany();
    if (company) {
      this.allCompanies.set([{ ...company, name: businessName || company.name }]);
      this.activeId.set(company.id);
    }
    this.allCustomers.set(customers);
    this.allSuppliers.set(suppliers);
  }

  useDemo(): void {
    this.remote.set(false);
    this.allCompanies.set(DEMO_COMPANIES);
    this.allCustomers.set(DEMO_CUSTOMERS);
    this.allSuppliers.set(DEMO_SUPPLIERS);
  }
}
