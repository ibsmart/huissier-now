# Déploiement Backend — Hostinger Node.js

> Backend Express + Prisma + PostgreSQL
> URL : `https://antiquewhite-viper-772534.hostingersite.com`

---

## 1. Type d'hébergement

Choisir **Node.js** (pas Shared, pas WordPress).

---

## 2. Configuration du dépôt

| Champ | Valeur |
|-------|--------|
| Repository | `https://github.com/ibsmart/huissier-now.git` |
| Branch | `main` |
| Root directory | *(laisser vide — racine du repo)* |

---

## 3. Commandes de build

| Champ | Valeur |
|-------|--------|
| Build command | `npm run build` |
| Start command | `node server/dist/index.js` |

> **Important** : Le script `build` dans `package.json` racine fait `npm run build -w server`
> qui lance `tsc` dans le dossier `server/`.

---

## 4. Variables d'environnement

À définir dans **Hostinger → Node.js → Environment Variables** :

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=une_chaine_aleatoire_longue_et_secrete
REFRESH_TOKEN_SECRET=une_autre_chaine_aleatoire
CLIENT_URL=https://huissier-now-client.vercel.app
VAPID_PUBLIC_KEY=BAXhkIPdI3n...  (clé publique VAPID)
VAPID_PRIVATE_KEY=...             (clé privée VAPID)
VAPID_EMAIL=admin@huissiernow.fr
```

> **DATABASE_URL** : récupérée dans Hostinger → Databases → PostgreSQL
> Format : `postgresql://u934822366_user:password@localhost:5432/u934822366_db`

---

## 5. Prisma — Migration de la base de données

Prisma génère le client automatiquement grâce au script `postinstall` dans `package.json` racine :

```json
"postinstall": "cd server && npx prisma generate"
```

Pour appliquer les migrations en production, se connecter en SSH :

```bash
ssh u934822366@antiquewhite-viper-772534.hostingersite.com
cd domains/antiquewhite-viper-772534.hostingersite.com/public_html
cd .builds/source/repository/server
npx prisma migrate deploy
```

---

## 6. Vérification du déploiement

Tester l'endpoint de santé :

```
GET https://antiquewhite-viper-772534.hostingersite.com/health
→ { "ok": true, "env": "production" }
```

---

## 7. Problèmes rencontrés et solutions

### ❌ `sh: tsc: command not found`

**Cause** : Hostinger installe uniquement les `dependencies`, pas les `devDependencies`.
`typescript` et `prisma` étaient dans `devDependencies`.

**Solution** : Déplacer `typescript` ET `prisma` dans `dependencies` dans `server/package.json`.

---

### ❌ `Could not find a declaration file for module 'express'` (et autres @types)

**Cause** : Tous les packages `@types/*` étaient dans `devDependencies`.
Sans eux, TypeScript ne comprend pas `Request`, `Response`, etc.
→ `AuthRequest extends Request` devient vide, toutes les propriétés (`body`, `params`, `headers`) disparaissent → des dizaines d'erreurs en cascade.

**Solution** : Déplacer **tous les `@types/*`** dans `dependencies` dans `server/package.json`.

```json
"dependencies": {
  "@prisma/client": "^5.18.0",
  "@types/bcryptjs": "^2.4.6",
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/jsonwebtoken": "^9.0.6",
  "@types/node": "^22.5.0",
  "@types/web-push": "^3.6.4",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "express-rate-limit": "^7.4.0",
  "jsonwebtoken": "^9.0.2",
  "prisma": "^5.18.0",
  "socket.io": "^4.8.3",
  "typescript": "^5.5.3",
  "web-push": "^3.6.7",
  "zod": "^3.23.8"
},
"devDependencies": {
  "tsx": "^4.18.0"
}
```

---

### ❌ `pnpm: command not found` / erreurs pnpm en production

**Cause** : Hostinger n'a pas pnpm installé globalement et la version de corepack était trop ancienne.

**Solution** : Utiliser **npm** (déjà installé). Le `package.json` racine utilise les workspaces npm :
```json
"build": "npm run build -w server"
```

---

### ❌ Le serveur tourne mais retourne la page 404 Hostinger

**Cause** : La commande de démarrage était incorrecte ou le build n'avait pas eu lieu.

**Solution** : Vérifier que :
1. Le build a bien produit `server/dist/index.js`
2. La commande de démarrage est `node server/dist/index.js`
3. `PORT` est défini en variable d'environnement

---

## 8. Redéploiement

À chaque `git push main` → Hostinger redéploie automatiquement si le déploiement auto est activé.
Sinon : Hostinger → Node.js → **Redeploy**.

---

## 9. Structure des fichiers après build

```
server/
  dist/          ← généré par tsc
    index.js
    routes/
    middleware/
    socket.js
    ...
  node_modules/
  prisma/
    schema.prisma
    migrations/
```
