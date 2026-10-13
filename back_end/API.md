# API backend Facturio

Le backend utilise Java 21, Spring Boot 4, Spring MVC, Spring Security,
OAuth2 Client, Bean Validation, JdbcClient/JPA, Flyway, PostgreSQL, Java Mail,
PDFBox, Mustang Factur-X et springdoc OpenAPI. Les dependances sont centralisees
dans `pom.xml`.

## Demarrage local

1. Creer la base PostgreSQL `facturio` et un utilisateur `facturio`.
2. Definir au minimum `DATABASE_URL`, `DATABASE_USERNAME` et
   `DATABASE_PASSWORD` (voir `.env.example`).
3. Lancer `mvnw spring-boot:run` dans `back_end`.
4. Lancer `npm start` dans `front_end`; son proxy transmet `/api`, `/oauth2` et
   `/login/oauth2` au port 8080.

Flyway installe la baseline V3 sur une base neuve. Swagger UI est disponible
sur `http://localhost:8080/swagger-ui/index.html` et le contrat OpenAPI sur
`/v3/api-docs`.

## Format des reponses

Toutes les reponses JSON des controllers ont la forme `{ status, message, data }` :

```json
{ "status": 200, "message": "Operation reussie", "data": { "...": "..." } }
```

- `status` : code HTTP de la reponse (200, 201, ...).
- `message` : libelle lisible.
- `data` : charge utile, `null` quand il n'y a rien a renvoyer (suppression).

Les erreurs suivent la meme forme, avec le code metier dans `data.code` :

```json
{ "status": 409, "message": "Cette campagne est rattachee a une collaboration", "data": { "code": "campaign_linked" } }
```

Les telechargements de fichiers (PDF, XML, Factur-X, logo) restent des reponses
binaires et ne sont pas enveloppes.

## Routes livrees

### Authentification

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/session`, `PUT /api/auth/creator-profile`
- `/oauth2/authorization/google`, `/facebook`, `/x`

### Espace createur

- `/api/creator-profile`, `/api/settings`
- `POST /api/settings/logo` : depot du logo, renvoie `{ "url": "/api/files/..." }`
- CRUD `/api/brands`, `/api/campaigns`, `/api/collaborations`
- pipeline, changement de statut et transformation collaboration -> campagne
- `POST /api/collaborations/{id}/campaign` : cree la campagne, la rattache a la
  collaboration et passe celle-ci en realisation

### Facturation

- CRUD `/api/quotes` et actions `send`, `accept`, `refuse`, `invoice`
- CRUD `/api/invoices` et actions `send`, `cancel`, `credit-note`, `pdf`
- `GET /api/invoices/{id}/xml` : XML CII, profil EN16931
- `GET /api/invoices/{id}/factur-x` : PDF/A-3 avec `factur-x.xml` embarque
- CRUD `/api/payments`
- `/api/reminders` et `/api/reminders/rules`
- `POST /api/emails`

### Pilotage

- `/api/dashboard`
- `/api/reports/revenue`, `/aging`, `/summary`
- `/api/subscription` et `/api/subscription/invoices`
- CRUD versionne `/api/invoice-templates`, duplication, choix par defaut et logo

`login` et `signup` renvoient un JWT. Toutes les routes protegees exigent
`Authorization: Bearer <token>`; le backend est stateless et ne cree aucune
session HTTP. Les autorites distinguees sont createur, administrateur/manager
d'entreprise, administrateur d'espace et administrateur du site.

- `/api/workspace/members` permet aux administrateurs d'espace de gerer les
  membres et leurs roles (`ADMIN`, `MANAGER`, `ACCOUNTANT`, `MEMBER`, `VIEWER`).
- `/api/admin/users` est reserve a `SITE_ADMIN` et gere les roles plateforme.

Le premier administrateur du site doit etre promu une fois directement par
l'administrateur PostgreSQL, puis les promotions suivantes passent par l'API :

```sql
UPDATE app_user SET platform_role = 'SITE_ADMIN' WHERE email = 'admin@example.com';
```

Toutes les lectures et ecritures utilisent l'organisation du jeton; un ID
appartenant a une autre organisation est traite comme introuvable. Les totaux,
statuts de paiement et numeros de documents sont calcules dans le backend. Les
mutations exigent l'en-tete `X-Requested-With: XMLHttpRequest`, ajoute par
l'intercepteur Angular.

## Organisation du code

- `auth` : connexion, OAuth et session; `auth/local` separe service et repository.
- `creator` : modules metier par fonctionnalite (`brand`, `campaign`,
  `collaboration`) avec controller, service, repository et DTO.
- `billing` : documents, calculs et repositories PostgreSQL partages.
- `common` : contexte d'organisation, erreurs et activite partagee.

La convention complete et un exemple d'arborescence sont decrits dans
[`ARCHITECTURE.md`](ARCHITECTURE.md).

Le format Java est automatique avec `mvnw spotless:apply`; `mvnw
spotless:check` permet de le verifier sans modifier les fichiers.

## Factur-X

Le module `billing/facturx` genere une transaction CII avec Mustang, au profil
EN16931. Le XML autonome et le PDF/A-3 hybride proviennent du meme objet metier.
Le PDF utilise des polices embarquees, contient les metadonnees Factur-X et la
piece jointe `factur-x.xml`. Une facture doit etre finalisee et posseder les
adresses completes de l'emetteur et du client avant export.

## Limites volontaires de ce lot

Le changement d'offre met a jour l'abonnement interne; le
paiement Stripe/PayPal necessitera les identifiants et webhooks du prestataire
choisi. Les tables entreprise sont pretes dans PostgreSQL, mais les API livrees
ici priorisent le parcours createur comme demande.
