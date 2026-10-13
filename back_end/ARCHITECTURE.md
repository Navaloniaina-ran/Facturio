# Architecture backend

Le backend est organise par fonctionnalite, puis par responsabilite technique.

```text
fr/facturio/backend/
|-- config/                 Configuration Spring, securite, Jackson, OpenAPI, filtres
|-- common/
|   |-- dto/                ApiResponse : enveloppe { status, message, data }
|   |-- enums/              Enumerations transverses (ex. WorkspaceType)
|   |-- exception/          ApiException et gestionnaire global
|   `-- util/               CurrentWorkspace, ApiResponses
|-- auth/                   Authentification et session
|   |-- controller/ dto/ service/ util/
|-- user/                   Utilisateurs persistants
|-- workspace/              Organisations, membres et reglages
|-- creator/                Fonctionnalites reservees aux createurs
|   |-- brand/              controller/ dto/ entity/ repository/ service/
|   |-- campaign/           controller/ dto/ entity/ repository/ service/ util/
|   |-- collaboration/      controller/ dto/ entity/ repository/ service/
|   |-- profile/            controller/ dto/ entity/ repository/ service/
|-- business/               Fonctionnalites reservees aux entreprises
|   |-- customer/           controller/ dto/ entity/ repository/ service/
|   `-- supplier/           controller/ dto/ entity/ repository/ service/
|-- shared/                 Fonctionnalites accessibles aux deux espaces
|   |-- billing/            controller/ dto/ entity/ repository/ service/ util/
|   |-- payment/            controller/ dto/ entity/ repository/ service/
|   |-- reminder/           controller/ dto/ entity/ repository/ service/
|   |-- report/             controller/ dto/ service/
|   |-- subscription/       controller/ dto/ entity/ repository/ service/
|   `-- template/           controller/ dto/ entity/ repository/ service/
`-- BackendApplication.java
```

Dossiers autorises : `controller`, `dto` (DTO et mappers entite/DTO), `entity`,
`repository`, `service`, `exception`, `util` (helpers sans etat metier, y compris
les composants Spring qui encapsulent une logique reutilisable), `config` et
`enums` (`enum` est un mot reserve Java, le dossier s'appelle donc `enums`).
Chaque fonctionnalite garde ses dossiers dans son propre package : un
microservice `buy` ressemble a `buy/controller`, `buy/dto`, `buy/entity`,
`buy/repository`, `buy/service`. Aucun autre dossier n'est cree.

Regles de couches :

- Seuls les `controller` appellent les `service`. Un service n'appelle jamais un
  autre service : la logique commune passe par un `util` (ex. `CampaignUtil`,
  `DocumentNumberUtil`, `TokenUtil`, `SessionUtil`).
- Chaque reponse de controller est un `ApiResponse` `{ status, message, data }`,
  construit par les fabriques de `common/util/ApiResponses` (`ok`, `created`,
  `deleted`, `error`). Les exports binaires (PDF, XML, Factur-X, fichiers de logo)
  restent des fichiers bruts.

Toute la persistance utilise des entites JPA et des repositories Spring Data.
Aucun repository JDBC ni requete SQL dans un controller n'est conserve.

Hibernate ne cree ni ne modifie le schema (`ddl-auto=none`) : Flyway reste la
source unique du schema PostgreSQL.

Les modules metier ne lisent jamais un identifiant de tenant fourni par le
client HTTP : ils utilisent `CurrentWorkspace`.

Les modules `creator` appellent `creatorOrganizationId()` et les modules
`business` appellent `businessOrganizationId()`. Une session du mauvais type
recoit une reponse HTTP 403 avant tout acces aux donnees. Les modules `shared`
utilisent `organizationId()` et restent disponibles dans les deux espaces.
