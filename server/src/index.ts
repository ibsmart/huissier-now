import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import webPush from 'web-push'
import path from 'path'

import authRoutes from './routes/auth'
import interventionRoutes from './routes/interventions'
import huissierRoutes from './routes/huissiers'
import userRoutes from './routes/users'
import { initServer } from './socket'

dotenv.config()

const app = express()
// Faire confiance au proxy Vercel/Nginx pour récupérer la vraie IP client
// dans X-Forwarded-For (sinon tous les utilisateurs partagent l'IP du proxy)
app.set('trust proxy', 1)

const PORT = process.env.PORT ?? 3000
const isProd = process.env.NODE_ENV === 'production'

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(express.json({ limit: '5mb' }))

// ── Web Push VAPID ───────────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@huissiernow.fr'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
  console.log('✅ Web Push VAPID configuré')
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// Auth : 30 tentatives / 15 min par IP réelle
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
}))
// Lecture interventions : 120 req/min (polling, dashboard, tracking…)
app.use('/api/interventions', rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { message: 'Trop de requêtes, réessayez dans une minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'POST', // les écritures ont leur propre limiter ci-dessous
}))
// Création / actions interventions (POST) : 15/min par IP — protège le double-envoi
app.use('/api/interventions', rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { message: 'Trop de soumissions, réessayez dans une minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST',
}))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/interventions', interventionRoutes)
app.use('/api/huissiers', huissierRoutes)
app.use('/api/users', userRoutes)

// ── Health check (Railway / Hostinger) ──────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, env: isProd ? 'production' : 'development' }))

// ── Servir le client React en production ────────────────────────────────────
if (isProd) {
  // __dirname = server/dist → client/dist est 2 niveaux au-dessus
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))

  // SPA fallback : toutes les routes non-API → index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  // ── 404 en dev (les routes client sont gérées par Vite) ──────────────────
  app.use((_req, res) => res.status(404).json({ message: 'Route introuvable' }))
}

// ── Gestion d'erreurs globale ────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message)
  res.status(500).json({ message: isProd ? 'Erreur serveur' : err.message })
})

// ── HTTP server + Socket.io ──────────────────────────────────────────────────
const httpServer = initServer(app, allowedOrigins)
httpServer.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`))
