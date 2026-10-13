import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { Customer, Supplier } from '../pme/pme.models';

interface PartyDto {
  id: string;
  kind: Customer['kind'];
  name: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  legalForm: Customer['identity']['legalForm'];
  shareCapital: number | null;
  activityCode: string | null;
  registryCity: string | null;
  paymentTermsDays: number;
  notes: string | null;
  active: boolean;
  deliveryAddressLine1?: string | null;
  deliveryAddressLine2?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCity?: string | null;
  deliveryCountryCode?: string | null;
  creditLimit?: number | null;
  iban?: string | null;
  defaultOperationNature?: Supplier['defaultNature'];
}

@Injectable({ providedIn: 'root' })
export class BusinessApiService {
  private readonly http = inject(HttpClient, { optional: true });

  customers(companyId: string): Observable<Customer[]> {
    return this.get<PartyDto[]>('/api/business/customers').pipe(
      map((items) => items.map((item) => this.customer(item, companyId))),
    );
  }

  suppliers(companyId: string): Observable<Supplier[]> {
    return this.get<PartyDto[]>('/api/business/suppliers').pipe(
      map((items) => items.map((item) => this.supplier(item, companyId))),
    );
  }

  createCustomer(
    value: Omit<Customer, 'id' | 'companyId'>,
    companyId: string,
  ): Observable<Customer> {
    return this.post<PartyDto>('/api/business/customers', this.customerRequest(value)).pipe(
      map((item) => this.customer(item, companyId)),
    );
  }

  updateCustomer(
    id: string,
    value: Omit<Customer, 'id' | 'companyId'>,
    companyId: string,
  ): Observable<Customer> {
    return this.put<PartyDto>(`/api/business/customers/${id}`, this.customerRequest(value)).pipe(
      map((item) => this.customer(item, companyId)),
    );
  }

  deleteCustomer(id: string): Observable<void> {
    return this.delete(`/api/business/customers/${id}`);
  }

  createSupplier(
    value: Omit<Supplier, 'id' | 'companyId'>,
    companyId: string,
  ): Observable<Supplier> {
    return this.post<PartyDto>('/api/business/suppliers', this.supplierRequest(value)).pipe(
      map((item) => this.supplier(item, companyId)),
    );
  }

  updateSupplier(
    id: string,
    value: Omit<Supplier, 'id' | 'companyId'>,
    companyId: string,
  ): Observable<Supplier> {
    return this.put<PartyDto>(`/api/business/suppliers/${id}`, this.supplierRequest(value)).pipe(
      map((item) => this.supplier(item, companyId)),
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return this.delete(`/api/business/suppliers/${id}`);
  }

  private customer(item: PartyDto, companyId: string): Customer {
    return {
      ...this.party(item, companyId),
      deliveryAddress:
        item.deliveryAddressLine1 || item.deliveryCity
          ? {
              street: [item.deliveryAddressLine1, item.deliveryAddressLine2]
                .filter(Boolean)
                .join('\n'),
              postalCode: item.deliveryPostalCode ?? '',
              city: item.deliveryCity ?? '',
              countryCode: item.deliveryCountryCode ?? item.countryCode ?? 'FR',
            }
          : null,
      creditLimit: Number(item.creditLimit ?? 0),
    };
  }

  private supplier(item: PartyDto, companyId: string): Supplier {
    return {
      ...this.party(item, companyId),
      iban: item.iban ?? '',
      defaultNature: item.defaultOperationNature ?? 'SERVICES',
    };
  }

  private party(item: PartyDto, companyId: string) {
    return {
      id: item.id as string,
      companyId,
      kind: item.kind ?? 'COMPANY',
      name: item.name ?? '',
      contact: item.contact ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      address: {
        street: [item.addressLine1, item.addressLine2].filter(Boolean).join('\n'),
        postalCode: item.postalCode ?? '',
        city: item.city ?? '',
        countryCode: item.countryCode ?? 'FR',
      },
      identity: {
        siren: item.siren ?? '',
        siret: item.siret ?? '',
        vatNumber: item.vatNumber ?? '',
        legalForm: item.legalForm || null,
        rcsCity: item.registryCity ?? '',
        shareCapital: Number(item.shareCapital ?? 0),
        napCode: item.activityCode ?? '',
      },
      paymentTermsDays: Number(item.paymentTermsDays ?? 0),
      notes: item.notes ?? '',
      active: Boolean(item.active),
    };
  }

  private customerRequest(value: Omit<Customer, 'id' | 'companyId'>): object {
    return {
      ...this.partyRequest(value),
      deliveryAddressLine1: value.deliveryAddress?.street ?? '',
      deliveryAddressLine2: '',
      deliveryPostalCode: value.deliveryAddress?.postalCode ?? '',
      deliveryCity: value.deliveryAddress?.city ?? '',
      deliveryCountryCode: value.deliveryAddress?.countryCode ?? '',
      creditLimit: value.creditLimit,
    };
  }

  private supplierRequest(value: Omit<Supplier, 'id' | 'companyId'>): object {
    return {
      ...this.partyRequest(value),
      iban: value.iban,
      defaultOperationNature: value.defaultNature,
    };
  }

  private partyRequest(
    value: Omit<Customer, 'id' | 'companyId'> | Omit<Supplier, 'id' | 'companyId'>,
  ): object {
    return {
      kind: value.kind,
      name: value.name,
      contact: value.contact,
      email: value.email,
      phone: value.phone,
      countryCode: value.address.countryCode,
      addressLine1: value.address.street,
      addressLine2: '',
      postalCode: value.address.postalCode,
      city: value.address.city,
      siren: value.identity.siren,
      siret: value.identity.siret,
      vatNumber: value.identity.vatNumber,
      legalForm: value.identity.legalForm,
      shareCapital: value.identity.shareCapital,
      activityCode: value.identity.napCode,
      registryCity: value.identity.rcsCity,
      paymentTermsDays: value.paymentTermsDays,
      notes: value.notes,
      active: value.active,
    };
  }

  private get<T>(url: string): Observable<T> {
    return this.http ? this.http.get<T>(url) : this.offline<T>();
  }
  private post<T>(url: string, body: object): Observable<T> {
    return this.http ? this.http.post<T>(url, body) : this.offline<T>();
  }
  private put<T>(url: string, body: object): Observable<T> {
    return this.http ? this.http.put<T>(url, body) : this.offline<T>();
  }
  private delete(url: string): Observable<void> {
    return this.http ? this.http.delete<void>(url) : this.offline<void>();
  }
  private offline<T>(): Observable<T> {
    return throwError(() => new Error('offline'));
  }
}
