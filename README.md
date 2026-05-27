# HuissierNow

Application web mobile-first permettant de demander l'intervention d'un huissier de justice depuis un smartphone.

## Concept

L'utilisateur ouvre l'URL depuis son téléphone, décrit sa situation, partage sa position GPS, et un huissier disponible dans sa zone reçoit et accepte la demande. Le client suit l'arrivée de l'huissier en temps réel.

## Stack technique

- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL + Prisma
- **Cartes** : Leaflet (OpenStreetMap, sans clé API)
- **Auth** : JWT

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommandé) ou npm

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd huissier-now

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp server/.env.example server/.env
# Éditer server/.env avec vos valeurs

# Créer la base de données et lancer les migrations
cd server
pnpm prisma migrate dev

# Lancer en développement (frontend + backend en parallèle)
cd ..
pnpm dev
```

### URLs de développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Prisma Studio | http://localhost:5555 |

## Variables d'environnement (server/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/huissier_now"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

## Parcours utilisateur

```
Accueil
  └─> Choisir le type d'intervention
        └─> Décrire la situation
              └─> Confirmer la position GPS
                    └─> Envoi de la demande
                          └─> Attente d'un huissier (max 3 min)
                                └─> Suivi temps réel + ETA
                                      └─> Intervention terminée
```

## Parcours huissier

```
Login
  └─> Activer la disponibilité
        └─> Voir les demandes proches
              └─> Accepter une demande
                    └─> "En route" → "Arrivé" → "Terminé"
```

## Structure du projet

```
/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Écrans de l'application
│       ├── components/
│       ├── store/   # Zustand
│       ├── api/
│       ├── hooks/
│       └── utils/
│
├── server/          # Express backend
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── services/
│       └── prisma/
│
├── CLAUDE.md        # Contexte technique pour les assistants IA
└── README.md        # Ce fichier
```

## API — Endpoints principaux

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| POST | /api/interventions | Créer une demande |
| GET | /api/interventions/:id | Statut + ETA |
| GET | /api/interventions/nearby | Demandes proches (huissier) |
| POST | /api/interventions/:id/accept | Accepter une demande |
| PATCH | /api/interventions/:id/status | Mettre à jour le statut |
| PATCH | /api/huissiers/me/availability | Activer/désactiver la dispo |
| PATCH | /api/huissiers/me/location | Mettre à jour la position |

## Roadmap post-MVP

- [ ] Paiement en ligne (Stripe)
- [ ] Notifications push (PWA)
- [ ] Signature électronique
- [ ] Backoffice admin
- [ ] Application mobile native (React Native)
- [ ] Archivage légal des interventions
