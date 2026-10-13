import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  InvoiceTemplate,
  InvoiceTemplatePayload,
  InvoiceTemplateVersion,
  TemplateLogoUpload,
} from './invoice-template.models';

/** Racine de l'API des modèles, côté backend. */
export const INVOICE_TEMPLATES_URL = '/api/invoice-templates';

/**
 * Client REST des modèles de facture. Une seule couche HTTP dans le projet :
 * le `HttpClient` d'Angular. Aucune règle métier ici, uniquement du transport.
 *
 * Contrat attendu :
 *   GET    /api/invoice-templates
 *   GET    /api/invoice-templates/{id}
 *   POST   /api/invoice-templates
 *   PUT    /api/invoice-templates/{id}
 *   DELETE /api/invoice-templates/{id}
 *   POST   /api/invoice-templates/{id}/duplicate
 *   POST   /api/invoice-templates/{id}/default
 *   GET    /api/invoice-templates/{id}/versions
 *   POST   /api/invoice-templates/{id}/logo        (multipart, champ « file »)
 *   GET    /api/invoices/{invoiceId}/pdf?templateId=…   (application/pdf)
 */
@Injectable({ providedIn: 'root' })
export class InvoiceTemplateApi {
  private readonly http = inject(HttpClient);

  getTemplates(): Observable<InvoiceTemplate[]> {
    return this.http.get<InvoiceTemplate[]>(INVOICE_TEMPLATES_URL);
  }

  getTemplate(id: string): Observable<InvoiceTemplate> {
    return this.http.get<InvoiceTemplate>(`${INVOICE_TEMPLATES_URL}/${id}`);
  }

  createTemplate(data: InvoiceTemplatePayload): Observable<InvoiceTemplate> {
    return this.http.post<InvoiceTemplate>(INVOICE_TEMPLATES_URL, data);
  }

  updateTemplate(id: string, data: InvoiceTemplatePayload): Observable<InvoiceTemplate> {
    return this.http.put<InvoiceTemplate>(`${INVOICE_TEMPLATES_URL}/${id}`, data);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${INVOICE_TEMPLATES_URL}/${id}`);
  }

  duplicateTemplate(id: string): Observable<InvoiceTemplate> {
    return this.http.post<InvoiceTemplate>(`${INVOICE_TEMPLATES_URL}/${id}/duplicate`, {});
  }

  setDefaultTemplate(id: string): Observable<InvoiceTemplate> {
    return this.http.post<InvoiceTemplate>(`${INVOICE_TEMPLATES_URL}/${id}/default`, {});
  }

  getVersions(id: string): Observable<InvoiceTemplateVersion[]> {
    return this.http.get<InvoiceTemplateVersion[]>(`${INVOICE_TEMPLATES_URL}/${id}/versions`);
  }

  /** Le fichier part au backend : jamais de stockage local comme seule source. */
  uploadLogo(id: string, file: File): Observable<TemplateLogoUpload> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<TemplateLogoUpload>(`${INVOICE_TEMPLATES_URL}/${id}/logo`, form);
  }

  /** Le PDF est produit par le backend, à partir du modèle et de la facture. */
  downloadPdf(invoiceId: string, templateId: string): Observable<Blob> {
    return this.http.get(`/api/invoices/${invoiceId}/pdf`, {
      params: { templateId },
      responseType: 'blob',
    });
  }

  /** XML CII EN16931 autonome, genere depuis les donnees figees de la facture. */
  downloadFacturXXml(invoiceId: string): Observable<Blob> {
    return this.http.get(`/api/invoices/${invoiceId}/xml`, { responseType: 'blob' });
  }

  /** PDF/A-3 lisible contenant le meme XML Factur-X en piece jointe. */
  downloadFacturXPdf(invoiceId: string): Observable<Blob> {
    return this.http.get(`/api/invoices/${invoiceId}/factur-x`, { responseType: 'blob' });
  }
}
