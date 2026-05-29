# Document d'Architecture Technique — HuissierNow
**Version** 1.0 · **Date** Mai 2026 · **Statut** MVP en production  
**Confidentiel — Usage interne & due diligence**

---

## Table des matières

1. [Vision produit & positionnement](#1-vision-produit--positionnement)
2. [Architecture actuelle (MVP)](#2-architecture-actuelle-mvp)
3. [Stack technologique](#3-stack-technologique)
4. [Flux de données critiques](#4-flux-de-données-critiques)
5. [Sécurité & conformité](#5-sécurité--conformité)
6. [Métriques de performance actuelles](#6-métriques-de-performance-actuelles)
7. [Architecture cible — Phase Scale](#7-architecture-cible--phase-scale)
8. [Roadmap technique](#8-roadmap-technique)
9. [Gestion des risques techniques](#9-gestion-des-risques-techniques)
10. [Infrastructure & coûts](#10-infrastructure--coûts)

---

## 1. Vision produit & positionnement

### Problème résolu
L'accès à un huissier de justice en France prend en moyenne **3 à 7 jours**. HuissierNow réduit ce délai à **moins de 15 minutes** via une marketplace mobile-first mettant en relation clients et agents assermentés géolocalisés.

### Modèle de revenus (technique)
| Source | Mécanisme technique | Commission |
|--------|--------------------|-----------:|
| Commission par intervention | Webhooks de confirmation + facturation automatisée | 15–20 % |
| Abonnement agent (SaaS) | Feature flags + gestion de plan côté DB | 29–79 €/mois |
| API B2B (assureurs, notaires) | Clés API + rate limiting par plan | à la requête |

### Propriété intellectuelle
- Algorithme de matching géolocalisé (Haversine + scoring ETA)
- Modèle de scoring agent (taux d'acceptation, temps de réponse, note)
- Données agrégées anonymisées sur la demande juridique en temps réel

---

## 2. Architecture actuelle (MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / PWA)                   │
│              React 18 + Vite · TypeScript · Tailwind            │
│                     Vercel CDN (Edge Network)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
                             │ /api/* → reverse proxy Vercel
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                         │
│              Express 4 + TypeScript · Socket.io                 │
│                    Hostinger VPS (Europe)                       │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Auth   │  │Interventions│  │ Huissiers│  │    Users    │  │
│  │  /auth   │  │/interventions│ │/huissiers│  │   /users    │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────┘  │
│                                                                 │
│           Prisma ORM · singleton connection pool                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16                                 │
│              Hostinger Managed DB (même VPS)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Déploiement actuel
| Composant | Hébergeur | Région | SLA |
|-----------|-----------|--------|-----|
| Frontend | Vercel (Edge) | Global CDN | 99,99 % |
| Backend API | Hostinger VPS | EU-West | 99,5 % |
| Base de données | PostgreSQL on VPS | EU-West | 99,5 % |
| Assets statiques | Vercel CDN | Global | 99,99 % |

---

## 3. Stack technologique

### Frontend
| Technologie | Version | Justification |
|------------|---------|---------------|
| React | 18.x | Ecosystem le plus mature, hiring facile |
| TypeScript | 5.x | Sécurité de types end-to-end, refactoring safe |
| Vite | 5.x | Build < 3s, HMR instantané |
| Tailwind CSS | 3.x | Design system cohérent, pas de CSS mort en prod |
| Zustand | 4.x | State management léger (< 1 KB), pas de boilerplate |
| React Router | 6.x | SPA routing, code splitting par route |
| Leaflet | — | Cartes OSM sans coût API (vs Google Maps ~200 $/M req) |

### Backend
| Technologie | Version | Justification |
|------------|---------|---------------|
| Node.js | 22 LTS | Event loop non-bloquant, idéal I/O-bound |
| Express | 4.x | Minimaliste, middleware ecosystem |
| TypeScript | 5.x | Types partagés avec le frontend |
| Prisma ORM | 5.x | Migrations versionées, type-safety DB, multi-DB ready |
| JWT | HS256 | Access 15 min + Refresh 7 jours, stateless |
| Socket.io | 4.x | Temps réel bidirectionnel, fallback polling automatique |
| Zod | 3.x | Validation schémas runtime = contrat API auto-documenté |

### Base de données
| Technologie | Justification |
|------------|---------------|
| PostgreSQL 16 | ACID, JSON natif, géospatial sans extension (Haversine SQL), migrations robustes |

### Choix délibérément évités
| Technologie | Raison du rejet |
|------------|-----------------|
| GraphQL | Complexité inutile au stade MVP, REST suffisant |
| Microservices | Overhead organisationnel, monolithe modulaire préféré jusqu'à 10M ARR |
| MongoDB | Transactions ACID critiques (locking intervention), PostgreSQL supérieur |
| Native iOS/Android | Coût × 3, PWA couvre 95 % des use cases mobile |

---

## 4. Flux de données critiques

### 4.1 Création d'intervention (chemin chaud)

```
Client                    API                      DB
  │                        │                        │
  │  POST /interventions   │                        │
  ├───────────────────────►│                        │
  │  (auth JWT, payload)   │  BEGIN TRANSACTION     │
  │                        ├───────────────────────►│
  │                        │  CHECK active (SELECT) │
  │                        │◄───────────────────────┤
  │                        │  INSERT intervention   │
  │                        ├───────────────────────►│
  │                        │  COMMIT                │
  │                        │◄───────────────────────┤
  │  201 { id }            │                        │
  │◄───────────────────────┤                        │
  │                        │  setTimeout 3min       │
  │                        │  → UPDATE expired      │
```

**Latence cible** : < 200 ms (P95)  
**Idempotence** : contrainte DB `status IN ('pending','accepted','en_route','arrived')` → 1 seule intervention active par client

### 4.2 Matching agent (chemin chaud)

```sql
-- Requête Haversine — exécutée toutes les 30s par agent actif
SELECT id, distance_km FROM "Intervention"
WHERE status = 'pending'
  AND (6371 * acos(cos(radians($lat)) * cos(radians("clientLat")) *
       cos(radians("clientLng") - radians($lng)) +
       sin(radians($lat)) * sin(radians("clientLat")))
      ) < $radiusKm
ORDER BY distance_km ASC LIMIT 20
```

**Index requis** (à ajouter en Phase 2) :
```sql
CREATE INDEX idx_intervention_status_geo ON "Intervention"(status, "clientLat", "clientLng")
WHERE status = 'pending';
```

### 4.3 Refresh token (auto-recovery)

```
apiFetch()                API /auth/refresh
     │                          │
     │  401 (token expiré)      │
     │  ─ refreshPromise ──────►│  POST refreshToken
     │  (singleton, 1 seul      │◄─ 200 { accessToken, refreshToken }
     │   call si N requêtes     │
     │   simultanées)           │
     │  retry request ─────────►│  200 données
```

---

## 5. Sécurité & conformité

### Authentification & autorisation
| Mécanisme | Implémentation |
|----------|----------------|
| JWT Access Token | HS256, TTL 15 min, secret 256 bits |
| JWT Refresh Token | TTL 7 jours, rotation à chaque usage |
| Role-Based Access Control | Middleware `requireRole('client' \| 'agent' \| 'admin')` |
| Rate limiting | Par IP réelle (trust proxy) : 30/15min auth, 15/min POST interventions |
| Validation entrées | Zod schemas sur toutes les routes POST/PATCH |

### Protection des données
| Données | Traitement |
|---------|------------|
| Mots de passe | bcrypt, cost factor 10 |
| Photos intervention | Base64 stocké en DB (migration S3 prévue Phase 2) |
| Audio intervention | Base64 en DB, max 2 min |
| Géolocalisation | Stockée uniquement pendant la mission active |
| Tokens | Jamais loggés |

### Headers de sécurité (Vercel)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### RGPD
- [ ] DPO désigné (à faire)
- [ ] Politique de rétention des données (à définir)
- [x] Données hébergées EU (Hostinger EU-West)
- [ ] Droit à l'effacement (endpoint à implémenter Phase 2)
- [ ] Consentement cookies (à implémenter)

> **⚠️ Point d'attention due diligence** : Les photos et audios sont actuellement stockés en base de données (base64). Acceptable en MVP (< 1 000 dossiers), migration vers stockage objet (S3/Cloudflare R2) impérative avant croissance.

---

## 6. Métriques de performance actuelles

### Capacité estimée stack actuelle (post-optimisations)

| Métrique | Valeur | Base |
|---------|--------|------|
| Requêtes/jour soutenables | ~50 000 | Hostinger VPS 2 vCPU / 4 GB RAM |
| Connexions DB simultanées | 10 (pool unique) | Prisma singleton |
| Latence API P50 | < 80 ms | Mesuré local |
| Latence API P95 | < 300 ms | Estimé |
| Clients Socket.io simultanés | ~500 | Mémoire Node.js |
| Build frontend | < 3 s | Vite |
| LCP (Largest Contentful Paint) | < 2,5 s | PWA mobile |

### Seuil de migration
La stack actuelle atteint ses limites à :
- **200+ utilisateurs actifs simultanément** (Socket.io in-memory)
- **500k req/jour** (CPU Hostinger)
- **5 000+ interventions en base** (sans index géospatial)

---

## 7. Architecture cible — Phase Scale

### 7.1 Cible 100k–1M req/jour (Série A)

```
                    ┌─────────────────────────────┐
                    │      Vercel Edge Network     │
                    │  React PWA · CDN mondial     │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         Railway              │
                    │    Node.js API (×2–4)        │
                    │    Auto-scale horizontal     │
                    └──────┬────────────┬─────────┘
                           │            │
              ┌────────────▼──┐    ┌────▼────────────┐
              │  Neon / Supabase│    │  Redis (Upstash) │
              │  PostgreSQL     │    │  Sessions cache  │
              │  + PgBouncer    │    │  Socket.io pub/sub│
              │  Connection pool│    │  Job queue       │
              └────────────────┘    └─────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │  Cloudflare R2           │
                              │  Photos · Audios · Docs  │
                              └─────────────────────────┘
```

### 7.2 Cible 10M+ req/jour (Série B+)

```
          ┌─────────────────────────────────────────────┐
          │              API Gateway (Kong / AWS)        │
          │         Auth · Rate limit · Routing          │
          └──────┬─────────────────────────────┬────────┘
                 │                             │
     ┌───────────▼──────────┐    ┌─────────────▼──────────┐
     │  Service Matching     │    │   Service Interventions │
     │  (géo + scoring)     │    │   (CRUD + statuts)      │
     └───────────┬──────────┘    └─────────────┬──────────┘
                 │                             │
          ┌──────▼─────────────────────────────▼──────┐
          │              Event Bus (Kafka)              │
          │  intervention.created · agent.accepted …   │
          └──────┬───────────────────────────┬─────────┘
                 │                           │
     ┌───────────▼──────┐        ┌──────────▼──────────┐
     │  Notification svc │        │  Analytics pipeline  │
     │  (Push · SMS · Email)      │  (Clickhouse / BigQuery)
     └──────────────────┘        └─────────────────────┘
```

### Changements structurels par phase

| Phase | Déclencheur | Migrations techniques |
|-------|-------------|----------------------|
| **MVP** (actuel) | 0 → 10k users | Monolithe Express + Hostinger |
| **Croissance** | 10k → 100k users | Railway + Neon + Redis + R2 |
| **Scale** | 100k → 1M users | Multi-région + CDN assets + observabilité |
| **Hyper-scale** | 1M+ users | Microservices + Kafka + data warehouse |

---

## 8. Roadmap technique

### Phase 1 — Solidification MVP (0–3 mois)
- [x] Singleton PrismaClient (connexions DB)
- [x] Auto-refresh JWT (expiry transparent)
- [x] Rate limiting par IP réelle (trust proxy)
- [ ] **Index géospatial PostgreSQL** sur `(status, clientLat, clientLng)`
- [ ] **Migration photos/audios → Cloudflare R2** (débloquer la limite 5 MB DB)
- [ ] **Tests E2E Playwright** (parcours client + agent)
- [ ] **Monitoring Sentry** (erreurs prod visibles)
- [ ] **Endpoint RGPD** suppression données utilisateur

### Phase 2 — Pré-Série A (3–9 mois)
- [ ] **Paiement intégré** (Stripe Connect — marketplace)
- [ ] **Signature électronique** (DocuSign API ou Yousign)
- [ ] **Tableau de bord admin** (stats, litiges, remboursements)
- [ ] **API B2B** (clés API, webhooks pour assureurs/notaires)
- [ ] Migration backend → **Railway** + DB → **Neon**
- [ ] **Socket.io Redis adapter** (scaling horizontal)
- [ ] **Job queue** (Bull) pour expiry et notifications async

### Phase 3 — Post-Série A (9–18 mois)
- [ ] **App native** (React Native — code partagé 70 %)
- [ ] **Multi-région** EU (Paris + Francfort)
- [ ] **Archivage légal certifié** (partenariat horodatage qualifié eIDAS)
- [ ] **ML scoring** agent (prédiction taux d'acceptation)
- [ ] **Internationalisation** (Belgique, Suisse, Luxembourg)

---

## 9. Gestion des risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| Plantage Hostinger en pic | Moyen | Élevé | Migration Railway Phase 2 |
| Fuite de données (photos base64 en DB) | Faible | Critique | Migration R2 Phase 1 |
| Expiry perdu si restart serveur | Élevé | Moyen | Job queue Bull Phase 2 |
| Socket.io ne scale pas horizontalement | Moyen | Élevé | Redis adapter Phase 2 |
| Token compromis | Très faible | Critique | Rotation refresh + blacklist Redis |
| PostgreSQL index manquant sur géo | Élevé (> 10k rows) | Élevé | Index Phase 1 |
| Dépendance Nominatim (geocoding) | Faible | Moyen | Fallback Photon/Pelias |

### Dette technique acceptée (MVP)
| Dette | Décision | Échéance |
|-------|---------|---------|
| `setTimeout` pour expiry 3min | Acceptable, lost on restart | Phase 2 |
| Photos stockées en DB | Limite 5 MB, risque volume | Phase 1 priorité |
| Polling 15s côté client | Acceptable jusqu'à 500 users | Phase 2 (WebSocket full) |
| Pas de tests automatisés | Acceptable MVP, risque refacto | Phase 1 |
| Pas de monitoring prod | Problèmes silencieux | Phase 1 priorité |

---

## 10. Infrastructure & coûts

### Coûts actuels (MVP)

| Service | Fournisseur | Coût/mois | Note |
|---------|-------------|----------:|------|
| Frontend | Vercel Free | 0 € | Jusqu'à 100 GB/mois |
| Backend + DB | Hostinger VPS | ~10–15 € | 2 vCPU / 4 GB RAM |
| Domaine | — | ~1 € | |
| **Total MVP** | | **~15 €/mois** | |

### Coûts Phase Croissance (10k–100k users actifs)

| Service | Fournisseur | Coût/mois | Note |
|---------|-------------|----------:|------|
| Frontend | Vercel Pro | 20 € | Analytics, pas de watermark |
| Backend | Railway Starter | 20–50 € | Auto-scale, métriques |
| Database | Neon Scale | 70 € | Connection pooling, branching |
| Cache / Queue | Upstash Redis | 10–30 € | Pay-per-use |
| Storage | Cloudflare R2 | 5–20 € | Photos/audios agents |
| Email transac. | Resend | 5–20 € | Confirmations, alertes |
| Monitoring | Sentry + Axiom | 20 € | Erreurs + logs |
| **Total** | | **~170–230 €/mois** | |

### Coûts Phase Scale (1M+ req/jour)

| Service | Fournisseur | Coût/mois | Note |
|---------|-------------|----------:|------|
| Frontend | Vercel Enterprise | 400 € | SLA 99,99 % |
| Backend (×4) | Railway / AWS ECS | 400–800 € | Multi-instance |
| Database | Neon Business | 300 € | Read replicas, PITR |
| Redis | Upstash Enterprise | 200 € | Multi-région |
| Storage | Cloudflare R2 | 50–150 € | |
| CDN / DDoS | Cloudflare Pro | 25 € | WAF inclus |
| Monitoring | Datadog / Grafana | 200 € | Full observabilité |
| **Total** | | **~1 600–1 900 €/mois** | Pour ~50k users actifs |

### Ratio coût / revenu (projections)

```
Hypothèse : commission 15% · intervention moyenne 120 €

Seuil de rentabilité infra :
  MVP :        1 intervention/mois suffit (15 € infra / 18 € commission)
  Croissance : ~100 interventions/mois   (230 € infra / 1800 € commissions)
  Scale :      ~900 interventions/mois   (1900 € infra)
```

**Le modèle est structurellement positif dès la première intervention facturée.**

---

## Annexes

### A. Schéma de données simplifié

```
User (id, role, email, firstName, lastName, phone)
  │
  ├─► HuissierAgent (firmId, isAvailable, lat, lng, radiusKm, rating,
  │                  acceptsExpress, acceptsTomorrow, acceptsScheduled)
  │
  └─► Intervention (clientId, agentId, type, subType, status,
                    description, photos[], audioBase64, urgency,
                    scheduledAt, surcharge, clientLat, clientLng,
                    etaMinutes, createdAt, acceptedAt, doneAt)
                    │
                    ├─► InterventionLog (status, agentLat, agentLng, etaMinutes)
                    └─► Rating (score 1-5, comment)
```

### B. Variables d'environnement requises

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=<256 bits min>
JWT_REFRESH_SECRET=<256 bits min>
CLIENT_URL=https://huissiernow.vercel.app
NODE_ENV=production
VAPID_PUBLIC_KEY=<web push>
VAPID_PRIVATE_KEY=<web push>
VAPID_EMAIL=admin@huissiernow.fr

# Frontend (Vite)
VITE_API_URL=https://...hostingersite.com
VITE_VAPID_PUBLIC_KEY=<web push>
```

### C. Commandes de déploiement

```bash
# Backend (Hostinger)
npm install && npm run build
# = tsc + prisma migrate deploy

# Frontend (Vercel)
pnpm install --no-frozen-lockfile && vite build
# Déclenché automatiquement sur push main
```

---

*Document maintenu par l'équipe technique HuissierNow.*  
*Prochaine révision : lors de la clôture du premier tour de financement.*
