# Decoupage du backlog par sprint

Le code reste organise par fonctionnalite (un dossier par microservice, voir
`ARCHITECTURE.md`). Ce document rattache chaque fonctionnalite a un sprint :
il sert au suivi agile sans casser l'organisation des packages. Les sprints
sont une proposition a valider avec le product owner.

| Sprint | Objectif | Packages `fr.facturio.backend` |
| --- | --- | --- |
| 1 - Socle et acces | Configuration, securite, comptes et espaces de travail | `config`, `common`, `auth`, `user`, `workspace` |
| 2 - Espace createur | Profil, marques, campagnes et collaborations | `creator.profile`, `creator.brand`, `creator.campaign`, `creator.collaboration` |
| 3 - Espace entreprise | Clients et fournisseurs | `business.customer`, `business.supplier` |
| 4 - Facturation | Devis, factures, avoirs, PDF et Factur-X, modeles | `shared.billing`, `shared.template` |
| 5 - Encaissements et relances | Paiements, relances automatiques et manuelles | `shared.payment`, `shared.reminder` |
| 6 - Pilotage et abonnement | Tableaux de bord, rapports et abonnement | `shared.report`, `shared.subscription` |

## Regles de decoupage

- Une fonctionnalite n'entre dans un sprint que si ses dependances sont deja
  livrees : `shared.billing` depend de `business.customer` et de `workspace`.
- Une fonctionnalite qui touche plusieurs sprints est decoupee par endpoint, et
  le code reste dans le meme package.
- Le sprint d'une fonctionnalite se met a jour dans ce tableau, pas dans le nom
  des packages.
