import { Pipe, PipeTransform } from '@angular/core';

/** Formate un montant dans la devise de l'espace de travail. */
@Pipe({ name: 'montant' })
export class MontantPipe implements PipeTransform {
  transform(valeur: number | null | undefined, devise = 'EUR'): string {
    const nombre = valeur ?? 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      maximumFractionDigits: nombre % 1 === 0 ? 0 : 2,
    }).format(nombre);
  }
}
