# HuissierNow — Context for AI Assistants

## What this project is

Mobile-first web app allowing users to request a bailiff (huissier de justice) intervention from their smartphone. No native app — browser only, responsive, PWA-ready.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (mobile-first, 375px base) |
| Routing | React Router v6 |
| State | Zustand |
| Maps | Leaflet + react-leaflet |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access 15min + refresh 7d) |
| Realtime | Polling every 15s (WebSocket upgrade later) |
| Geocoding | Nominatim (no API key needed) |
| ETA | Haversine formula + average speed by context |

## Monorepo structure

```
/client         React frontend
  /src
    /pages      One file per screen
    /components Reusable UI components
    /store      Zustand stores
    /api        Typed fetch functions
    /hooks      useGeolocation, useIntervention, usePolling...
    /types      Shared TypeScript interfaces
    /utils      haversine.ts, eta.ts, formatters.ts

/server         Express backend
  /src
    /routes     auth, interventions, huissiers
    /controllers
    /middleware auth JWT, role guard
    /services   matching.ts, eta.ts, geo.ts
    /prisma     schema.prisma + migrations
```

## User roles

- **client** — requests an intervention
- **huissier** — receives and handles interventions
- **admin** — reserved for future backoffice

## Intervention status flow

```
pending → accepted → en_route → arrived → done
       └→ expired (after 3 min with no huissier)
       └→ cancelled (by client before acceptance)
```

## Key business rules

1. A client can only have one active intervention at a time.
2. First huissier to accept locks the intervention (SQL transaction).
3. If no huissier accepts within 3 minutes → status = `expired`.
4. ETA is recalculated every time the huissier updates their position.
5. Huissier position is updated every 30s via `watchPosition()` while `en_route`.

## ETA calculation

```
speed = distanceKm < 5 ? 20 km/h : distanceKm < 15 ? 35 km/h : 60 km/h
eta   = (distanceKm / speed) * 60 * (peakHour ? 1.2 : 1.0)
min   = 5 minutes
```

Peak hours: 7h–9h and 17h–19h.

## Geolocation

- Browser: `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
- Fallback if denied: manual address input → Nominatim forward geocoding
- Reverse geocoding: `https://nominatim.openstreetmap.org/reverse?lat=...&lon=...&format=json`

## Haversine SQL (PostgreSQL, no PostGIS)

```sql
(6371 * acos(
  cos(radians(:client_lat)) * cos(radians(h.lat)) *
  cos(radians(h.lng) - radians(:client_lng)) +
  sin(radians(:client_lat)) * sin(radians(h.lat))
)) AS distance_km
```

## Mobile UX constraints

- All CTA buttons: min-height 56px, font-size 16px
- No hover-only states (touch-first)
- All async actions have loading states
- Handle: geoloc denied, no network, matching timeout

## Development order

1. Monorepo setup + Prisma schema + migrations
2. Auth (register/login JWT) for both roles
3. POST /api/interventions + GET /api/interventions/:id
4. GET /api/interventions/nearby (Haversine SQL)
5. POST /api/interventions/:id/accept + PATCH status
6. Client frontend: request flow (screens C1 → C6)
7. Client frontend: realtime tracking (screens C7 → C9)
8. Huissier frontend: dashboard + mission (screens H1 → H5)
9. ETA calculation + huissier position updates
10. Mobile UX polish + error handling

## Out of scope (MVP)

- Native iOS / Android
- Online payment
- Electronic signature
- Legal archiving
- Push notifications (PWA upgrade)
- Admin backoffice
