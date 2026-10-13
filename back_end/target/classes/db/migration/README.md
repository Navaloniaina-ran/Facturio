# Modèle de données Facturio — baseline V3 PostgreSQL

La migration `V3__facturio_postgresql_schema.sql` installe le socle PostgreSQL de
Facturio. La première expérience produit reste celle des créateurs, freelances
et influenceurs. Le propriétaire technique des données est néanmoins toujours
une `organization` afin d'accueillir ensuite les PME sans déplacer les factures
historiques.

## Correspondance avec le front

| Modèle TypeScript | Table SQL | Remarque |
|---|---|---|
| `Creator` + `Settings` | `organization` + `creator_profile` | L'organisation contient la facturation commune; le profil contient handle, niche et plateformes. |
| `Company` | `organization` + `business_profile` | L'identité commune est séparée du SIREN, SIRET, régime TVA, capital et RCS. |
| `Session` | `user_session` + `organization` | La session choisit une organisation active; son `workspace_type` détermine les routes et les vues. |
| Connexion email/mot de passe | `app_user` + `organization_member` | Le mot de passe est stocké uniquement sous forme de hash BCrypt. |
| `Brand` | `customer` + `creator_brand` | Coordonnées communes puis options réservées aux marques. |
| `Customer` | `customer` + `business_customer` | Coordonnées communes puis identité légale et livraison PME. |
| `Supplier` | `business_supplier` | Table exclusivement disponible dans l'espace entreprise. |
| `Campaign` | `project` + `creator_campaign` | Projet commun enrichi avec contrat et livrables créateur. |
| `Campaign.deliverables` | `creator_campaign.deliverables` | Tableau JSONB des livrables créateur. |
| `Collaboration` | `creator_collaboration` | Pipeline exclusivement réservé aux créateurs. |
| `Quote` | `billing_document` | `document_type = QUOTE`. |
| `Invoice` | `billing_document` | `document_type = INVOICE` ou `CREDIT_NOTE`. |
| `Line` | `billing_document_line` | Quantité, prix, remise, TVA et montants calculés. |
| `DocumentTax` | `billing_document_tax` | Accepte un taux négatif pour une retenue. |
| `Payment` | `payment` | Plusieurs encaissements par facture. |
| `ReminderStep` | `reminder_rule` | Configuration du scénario d'une organisation. |
| `Reminder` | `reminder` | Occurrence planifiée avec contenu figé. |
| `EmailLog` | `email_log` | Historique des envois manuels. |
| `Subscription` | `subscription` | Abonnement FREE, PRO ou STUDIO du tenant. |
| `PlatformInvoice` | `platform_invoice` | Facturation SaaS, séparée de la comptabilité du créateur. |
| `Activity` | `activity_event` | Événement et paramètres traduisibles du tableau de bord. |
| `InvoiceTemplate` | `invoice_template` | Nom, état par défaut et version courante. |
| `InvoiceTemplateDocument` | `invoice_template_version.template_json` | Présentation JSON immuable. |

## Principes structurants

### Tables communes

Authentification locale, organisations, clients facturés, projets, modèles, devis,
factures, avoirs, lignes, taxes, paiements, relances, emails, abonnements et
activité sont partagés par les deux espaces.

### Tables créateur uniquement

- `creator_profile`
- `creator_brand`
- `creator_campaign`
- `creator_collaboration`

### Tables entreprise uniquement

- `business_profile`
- `business_customer`
- `business_supplier`

Le backend doit vérifier `organization.workspace_type` avant d'écrire dans une
table spécialisée. Cette règle reste dans le service Java afin de garder la
migration simple, sans trigger ni fonction SQL personnalisée.

- Toutes les tables métier principales portent `organization_id`. Les
  repositories doivent toujours filtrer sur l'organisation active.
- Les montants utilisent `NUMERIC`, jamais un nombre flottant.
- Les coordonnées actuelles de l'émetteur et du client servent à créer
  `issuer_snapshot` et `customer_snapshot`. Ces instantanés ne changent plus
  après l'émission, même si une adresse est ensuite corrigée dans les réglages.
- `source_document_id` conserve la chaîne devis → facture et facture → avoir.
- Une facture référence une version précise de modèle. Modifier le modèle par
  défaut ne change donc pas le rendu d'une ancienne facture.
- Le logo, les contrats et les PDF ne sont pas enregistrés en BLOB. La base ne
  conserve que leur URL ou leur clé de stockage dans les colonnes `*_url`.
- Les informations sectorielles facultatives utilisent JSONB; tout élément
  financier, légal ou fréquemment recherché reste une colonne contrôlée.

## Règles du futur service backend

Une facture finalisée ne doit plus être modifiée. Une correction se fait par un
avoir qui référence la facture originale. Le numéro est attribué dans la même
transaction que la finalisation, après verrouillage (`SELECT ... FOR UPDATE`)
de `document_sequence`. La contrainte unique protège contre un doublon final.

Les totaux du document sont matérialisés pour les recherches et l'audit, mais
le serveur doit les recalculer à partir des lignes et taxes. De même,
`paid_amount` est recalculé à partir des paiements. Aucun de ces champs ne doit
être accepté directement depuis le navigateur.

Les requêtes des repositories devront toujours inclure l'organisation courante,
par exemple `findByIdAndOrganizationId`. La V3 utilise volontairement des clés
étrangères simples; l'isolation en lecture et en écriture doit donc être
appliquée systématiquement par le backend.

## Connexion et choix de l'espace

`app_user` représente le compte de connexion. Un compte n'est pas directement
marqué créateur ou entreprise : `organization_member` lui donne accès à une ou
plusieurs organisations, et chaque `organization` porte son `workspace_type`.
Cette structure correspond au front actuel tout en permettant à un comptable
ou dirigeant de gérer plusieurs sociétés.

Après authentification, le backend choisit l'adhésion `is_default`, crée une
`user_session` et retourne le type de l'organisation active. Les redirections
sont alors déterministes : `CREATOR` rejoint `/createur/tableau-de-bord` et
`BUSINESS` rejoint `/entreprise/tableau-de-bord`. Changer de société remplace
l'organisation active de la session uniquement après vérification de
l'adhésion correspondante.

Les deux comptes présents dans le front restent des données de démonstration.
Ils ne sont pas insérés par Flyway : un mot de passe doit être créé par un seed
de développement avec le même algorithme de hash que le backend, jamais écrit
en clair dans une migration de production.

Une inscription locale crée `app_user`, une organisation `CREATOR`, l'adhésion
propriétaire, l'abonnement d'essai et le `creator_profile` minimal dans une seule
transaction. Le mot de passe est haché avec BCrypt avant toute écriture. Les
mentions légales, les coordonnées bancaires et le logo restent demandés plus
tard dans l'onboarding. La table `external_identity` reste réservée à une
évolution future et n'est utilisée par aucun parcours actif.

> Cette V3 remplace les anciennes V1 et V2 et cible une base neuve. Si V1/V2
> ont déjà été appliquées dans une base à conserver, ne lancez pas cette
> baseline dessus : utilisez une migration différentielle ou recréez seulement
> la base de développement.
