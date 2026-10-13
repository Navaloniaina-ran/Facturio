import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { PartyDraft } from '../../core/pme/pme-party.form';
import { LegalForm } from '../../core/pme/pme.models';

const LEGAL_FORMS: LegalForm[] = ['EI', 'EURL', 'SARL', 'SAS', 'SASU', 'SA', 'SNC', 'SCI'];

/**
 * Tronc commun de saisie d'un tiers : identité, coordonnées, adresse.
 *
 * Le brouillon est un objet mutable détenu par l'écran parent, muté ici par
 * `ngModel` — même conduite que le formulaire des marques. Le parent lit
 * l'objet au moment de valider ; aucune synchronisation n'est nécessaire
 * puisque la référence ne change pas.
 *
 * Le bloc d'identité légale disparaît pour un particulier : lui demander un
 * SIREN n'aurait pas de sens.
 */
@Component({
  selector: 'app-pme-party-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './pme-party-fields.component.html',
})
export class PmePartyFieldsComponent {
  protected readonly i18n = inject(I18nService);

  readonly draft = input.required<PartyDraft>();

  protected readonly legalForms = LEGAL_FORMS;
}
