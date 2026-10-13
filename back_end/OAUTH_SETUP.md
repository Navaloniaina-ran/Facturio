# Configuration OAuth de Facturio

Le front ne recoit jamais les secrets des fournisseurs. Ils sont lus par le
backend depuis les variables listees dans `.env.example`.

## URL de retour en developpement

Creer une application chez chaque fournisseur et autoriser exactement :

- Google : `http://localhost:4200/login/oauth2/code/google`
- Facebook : `http://localhost:4200/login/oauth2/code/facebook`
- X / Twitter : `http://localhost:4200/login/oauth2/code/x`

`npm start` active le proxy Angular qui transmet ces URL au backend sur le port
8080. En production, remplacer `FACTURIO_FRONTEND_URL` et les trois URL de
retour par le domaine HTTPS public de Facturio.

## Variables necessaires

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
X_CLIENT_ID
X_CLIENT_SECRET
```

La version de Graph API est surchargeable avec `FACEBOOK_API_VERSION`. Pour X,
l'application doit activer OAuth 2.0 Authorization Code avec PKCE et autoriser
les scopes `tweet.read`, `users.read` et `users.email`.

Les valeurs `facturio-*-not-configured` presentes dans `application.properties`
permettent au projet de compiler sans secret; une tentative de connexion ne
peut evidemment aboutir tant que les vraies variables ne sont pas definies.
