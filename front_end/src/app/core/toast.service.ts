import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

/** Durée d'affichage par défaut, en millisecondes. */
export const TOAST_DURATION = 4000;

/**
 * Notifications éphémères. Le projet n'en avait pas : ce service devient le
 * système unique, réutilisable par les autres écrans au fil du temps.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<Toast[]>([]);
  private sequence = 0;

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(tone: ToastTone, message: string): void {
    this.sequence += 1;
    const toast: Toast = { id: this.sequence, tone, message };
    this.items.update((list) => [...list, toast]);

    // En rendu serveur, aucun minuteur : le toast n'a pas de sens hors navigateur.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(toast.id), TOAST_DURATION);
    }
  }
}
