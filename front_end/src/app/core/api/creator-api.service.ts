import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import {
  Brand,
  Campaign,
  Collaboration,
  Creator,
  Line,
  PlanCode,
  PlatformInvoice,
  Settings,
  Subscription,
} from '../models';
import {
  BrandDto,
  BrandRequestDto,
  CampaignDto,
  CampaignRequestDto,
  CollaborationCampaignRequestDto,
  CollaborationDto,
  CollaborationRequestDto,
  CreatorProfileDto,
  PlatformInvoiceDto,
  SettingsDto,
  SubscriptionDto,
} from './api.dto';
import {
  toBrand,
  toCampaign,
  toCollaboration,
  toCreator,
  toPlatformInvoice,
  toSettings,
  toSubscription,
} from './creator.mappers';

/** Marque sans son identifiant ni son état de relance : ce que l'écran saisit. */
export type BrandPayload = Omit<Brand, 'id' | 'remindersPaused'>;

/** Campagne saisie : le statut et le contrat sont tenus par le backend. */
export type CampaignPayload = Pick<Campaign, 'brandId' | 'name' | 'startDate' | 'endDate'> & {
  deliverables: Line[];
};

/** Collaboration saisie : le lien vers la campagne est posé par le backend. */
export type CollaborationPayload = Omit<Collaboration, 'id' | 'campaignId' | 'contractName'>;

/**
 * Accès HTTP à l'espace créateur. Le client est injecté en optionnel : les
 * tests unitaires et le mode démonstration fonctionnent sans couche réseau,
 * l'appel échoue alors comme un service indisponible.
 */
@Injectable({ providedIn: 'root' })
export class CreatorApiService {
  private readonly http = inject(HttpClient, { optional: true });

  /** Marques ------------------------------------------------------------ */

  brands(): Observable<Brand[]> {
    return this.get<BrandDto[]>('/api/brands').pipe(map((list) => list.map(toBrand)));
  }

  createBrand(payload: BrandPayload): Observable<Brand> {
    return this.post<BrandDto>('/api/brands', this.brandRequest(payload)).pipe(map(toBrand));
  }

  updateBrand(id: string, payload: BrandPayload): Observable<Brand> {
    return this.put<BrandDto>(`/api/brands/${id}`, this.brandRequest(payload)).pipe(map(toBrand));
  }

  toggleBrandReminders(id: string): Observable<Brand> {
    return this.patch<BrandDto>(`/api/brands/${id}/reminders`, {}).pipe(map(toBrand));
  }

  deleteBrand(id: string): Observable<void> {
    return this.delete(`/api/brands/${id}`);
  }

  /** Campagnes ----------------------------------------------------------- */

  campaigns(): Observable<Campaign[]> {
    return this.get<CampaignDto[]>('/api/campaigns').pipe(
      map((list) => list.map((dto) => toCampaign(dto))),
    );
  }

  createCampaign(payload: CampaignPayload): Observable<Campaign> {
    return this.post<CampaignDto>('/api/campaigns', this.campaignRequest(payload)).pipe(
      map((dto) => toCampaign(dto)),
    );
  }

  updateCampaign(id: string, payload: CampaignPayload, previous?: Campaign): Observable<Campaign> {
    return this.put<CampaignDto>(`/api/campaigns/${id}`, this.campaignRequest(payload)).pipe(
      map((dto) => toCampaign(dto, previous)),
    );
  }

  changeCampaignStatus(id: string, status: string, previous?: Campaign): Observable<Campaign> {
    return this.patch<CampaignDto>(`/api/campaigns/${id}/status`, { status }).pipe(
      map((dto) => toCampaign(dto, previous)),
    );
  }

  duplicateCampaign(id: string): Observable<Campaign> {
    return this.post<CampaignDto>(`/api/campaigns/${id}/duplicate`, {}).pipe(
      map((dto) => toCampaign(dto)),
    );
  }

  deleteCampaign(id: string): Observable<void> {
    return this.delete(`/api/campaigns/${id}`);
  }

  /** Collaborations ------------------------------------------------------ */

  collaborations(): Observable<Collaboration[]> {
    return this.get<CollaborationDto[]>('/api/collaborations').pipe(
      map((list) => list.map(toCollaboration)),
    );
  }

  createCollaboration(payload: CollaborationPayload): Observable<Collaboration> {
    return this.post<CollaborationDto>(
      '/api/collaborations',
      this.collaborationRequest(payload),
    ).pipe(map(toCollaboration));
  }

  updateCollaboration(id: string, payload: CollaborationPayload): Observable<Collaboration> {
    return this.put<CollaborationDto>(
      `/api/collaborations/${id}`,
      this.collaborationRequest(payload),
    ).pipe(map(toCollaboration));
  }

  changeCollaborationStage(id: string, stage: string): Observable<Collaboration> {
    return this.patch<CollaborationDto>(`/api/collaborations/${id}/stage`, { stage }).pipe(
      map(toCollaboration),
    );
  }

  deleteCollaboration(id: string): Observable<void> {
    return this.delete(`/api/collaborations/${id}`);
  }

  /** Transforme la collaboration en campagne et renvoie la campagne créée. */
  collaborationToCampaign(
    id: string,
    payload: CollaborationCampaignRequestDto,
  ): Observable<Campaign> {
    return this.post<CampaignDto>(`/api/collaborations/${id}/campaign`, payload).pipe(
      map((dto) => toCampaign(dto)),
    );
  }

  /** Profil et paramètres ------------------------------------------------ */

  creatorProfile(): Observable<Creator> {
    return this.get<CreatorProfileDto>('/api/creator-profile').pipe(map(toCreator));
  }

  settings(fallback: Settings): Observable<Settings> {
    return this.get<SettingsDto>('/api/settings').pipe(map((dto) => toSettings(dto, fallback)));
  }

  saveSettings(settings: Settings): Observable<Settings> {
    return this.put<SettingsDto>('/api/settings', this.settingsRequest(settings)).pipe(
      map((dto) => toSettings(dto, settings)),
    );
  }

  /** Construction des corps de requête ----------------------------------- */

  private brandRequest(payload: BrandPayload): BrandRequestDto {
    return {
      name: payload.name.trim(),
      contact: payload.contact,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      countryCode: payload.countryCode || 'FR',
      paymentTermsDays: payload.paymentTermsDays,
      notes: payload.notes,
    };
  }

  private campaignRequest(payload: CampaignPayload): CampaignRequestDto {
    return {
      brandId: payload.brandId,
      name: payload.name.trim(),
      startDate: payload.startDate,
      endDate: payload.endDate,
      deliverables: payload.deliverables,
    };
  }

  private collaborationRequest(payload: CollaborationPayload): CollaborationRequestDto {
    return {
      brandId: payload.brandId,
      title: payload.title.trim(),
      type: payload.type,
      stage: payload.stage,
      estimatedAmount: payload.estimatedAmount,
      contactDate: payload.contactDate,
      nextStepDate: payload.nextStepDate,
      nextStepNote: payload.nextStepNote,
      notes: payload.notes,
    };
  }

  private settingsRequest(settings: Settings): SettingsDto {
    return { ...settings };
  }

  /**
   * Dépose le logo et renvoie son URL. L'organisation ne stocke qu'un lien :
   * une image en data URI ne tiendrait pas dans la colonne prévue.
   */
  uploadLogo(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.post<{ url: string }>('/api/settings/logo', form).pipe(
      map((response) => response.url),
    );
  }

  /** Abonnement ---------------------------------------------------------- */

  subscription(): Observable<Subscription> {
    return this.get<SubscriptionDto>('/api/subscription').pipe(map(toSubscription));
  }

  platformInvoices(): Observable<PlatformInvoice[]> {
    return this.get<PlatformInvoiceDto[]>('/api/subscription/invoices').pipe(
      map((list) => list.map(toPlatformInvoice)),
    );
  }

  changePlan(plan: PlanCode, cycle: Subscription['cycle']): Observable<Subscription> {
    return this.post<SubscriptionDto>('/api/subscription/change', { plan, cycle }).pipe(
      map(toSubscription),
    );
  }

  cancelSubscription(): Observable<Subscription> {
    return this.post<SubscriptionDto>('/api/subscription/cancel', {}).pipe(map(toSubscription));
  }

  /** Verbes HTTP --------------------------------------------------------- */

  private get<T>(url: string): Observable<T> {
    return this.http ? this.http.get<T>(url) : this.offline<T>();
  }

  private post<T>(url: string, body: unknown): Observable<T> {
    return this.http ? this.http.post<T>(url, body) : this.offline<T>();
  }

  private put<T>(url: string, body: unknown): Observable<T> {
    return this.http ? this.http.put<T>(url, body) : this.offline<T>();
  }

  private patch<T>(url: string, body: unknown): Observable<T> {
    return this.http ? this.http.patch<T>(url, body) : this.offline<T>();
  }

  private delete(url: string): Observable<void> {
    return this.http ? this.http.delete<void>(url) : this.offline<void>();
  }

  /** Sans couche HTTP, l'appel se comporte comme un service injoignable. */
  private offline<T>(): Observable<T> {
    return throwError(() => new HttpErrorResponse({ status: 0, statusText: 'offline' }));
  }
}
