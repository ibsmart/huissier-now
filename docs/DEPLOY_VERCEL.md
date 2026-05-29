# Déploiement Frontend — Vercel

> Frontend React + Vite + TypeScript
> URL : `https://huissier-now-client.vercel.app`

---

## 1. Connexion du dépôt

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importer le repo GitHub : `https://github.com/ibsmart/huissier-now.git`
3. Configurer comme suit :

| Champ | Valeur |
|-------|--------|
| Framework Preset | **Vite** |
| Root Directory | `client` |
| Build Command | `vite build` |
| Output Directory | `dist` |
| Install Command | `pnpm install --no-frozen-lockfile` |

> **Root Directory = `client`** : Vercel ne voit que le dossier `client/`, il lit son propre `package.json` et `vercel.json`.

---

## 2. Variables d'environnement

À définir dans **Vercel → Project → Settings → Environment Variables** :

```
VITE_API_URL=https://antiquewhite-viper-772534.hostingersite.com
VITE_VAPID_PUBLIC_KEY=BAXhkIPdI3n...   (même clé publique que le serveur)
```

> Les variables Vite **doivent** commencer par `VITE_` pour être exposées au navigateur.

---

## 3. Fichier `client/vercel.json`

Ce fichier contrôle les rewrites et les headers de sécurité.

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://antiquewhite-viper-772534.hostingersite.com/api/:path*"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

> **⚠️ Important** : La `destination` du rewrite `/api/:path*` doit pointer vers l'URL exacte du backend Hostinger.
> Changer `YOUR-RAILWAY-URL.railway.app` → `antiquewhite-viper-772534.hostingersite.com` avant de déployer.

---

## 4. Comment fonctionne le rewrite

```
Navigateur → /api/auth/login
     ↓  (Vercel rewrite, invisible pour le navigateur)
Backend  → https://antiquewhite-viper-772534.hostingersite.com/api/auth/login
```

Avantage : Pas de problème CORS car le navigateur croit parler à la même origine.

---

## 5. Vérification du déploiement

1. Ouvrir `https://huissier-now-client.vercel.app`
2. L'app doit s'afficher (écran d'accueil HuissierNow)
3. Tester le login → doit retourner un token JWT
4. Vérifier dans l'onglet Réseau du navigateur que les requêtes `/api/...` reçoivent des réponses du backend

---

## 6. Problèmes rencontrés et solutions

### ❌ `ERR_PNPM_OUTDATED_LOCKFILE` / frozen-lockfile

**Cause** : Vercel utilise par défaut `pnpm install --frozen-lockfile`.
Si le `pnpm-lock.yaml` ne correspond pas exactement au `package.json`, l'installation échoue.

**Solution** : Ajouter dans `client/vercel.json` :
```json
"installCommand": "pnpm install --no-frozen-lockfile"
```

---

### ❌ Vercel déploie un ancien commit / n'est pas à jour

**Cause** : Le `pnpm-lock.yaml` avait été modifié ou supprimé par erreur.

**Solution** :
```bash
# Restaurer le lockfile depuis un commit fonctionnel
git show <HASH_COMMIT_OK>:pnpm-lock.yaml > pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "restore: pnpm-lock.yaml"
git push
```

---

### ❌ Erreur 404 sur toutes les routes (ex: `/login`, `/dashboard`)

**Cause** : Vercel ne sait pas que c'est une SPA — il cherche un fichier `/login` qui n'existe pas.

**Solution** : Le rewrite `"source": "/(.*)", "destination": "/index.html"` dans `vercel.json` renvoie tout vers React Router.

---

### ❌ Erreur 403 après déploiement

**Cause** : Vercel avait détecté le mauvais framework (Vite au lieu de React).

**Solution** : Bien vérifier dans les paramètres Vercel :
- Framework : **Vite**
- Root Directory : **client**
- Output Directory : **dist**

---

### ❌ `/socket.io` ne fonctionne pas en production

**Cause** : Socket.io en production passe directement par le backend Hostinger, pas par Vercel.

**Solution** : Dans `client/src/hooks/useSocket.ts`, le socket se connecte à l'URL backend directement via `VITE_API_URL` :
```typescript
socket = io(import.meta.env.VITE_API_URL ?? '/', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
})
```

---

## 7. Redéploiement

À chaque `git push main` → Vercel redéploie automatiquement.
Ou manuellement : Vercel → Project → **Redeploy**.

---

## 8. Architecture de déploiement complète

```
┌─────────────────────────────────────────────────────────┐
│                    Utilisateur                           │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │       Vercel       │
        │  React + Vite SPA  │
        │  /client/dist/     │
        └─────────┬─────────┘
                  │ /api/* rewrite
        ┌─────────▼─────────────────┐
        │        Hostinger           │
        │  Node.js + Express         │
        │  server/dist/index.js      │
        └─────────┬─────────────────┘
                  │ Prisma ORM
        ┌─────────▼─────────┐
        │    PostgreSQL       │
        │  (Hostinger DB)    │
        └───────────────────┘
```
