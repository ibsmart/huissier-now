import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { getIO } from '../socket'

const router: import('express').Router = Router()
const prisma = new PrismaClient()

// ── Disponibilité de l'agent ────────────────────────────────────────────────
router.patch('/me/availability', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  const { isAvailable, lat, lng, radiusKm } = req.body
  const agent = await prisma.huissierAgent.update({
    where: { id: req.userId! },
    data: {
      isAvailable: Boolean(isAvailable),
      ...(lat       !== undefined && { lat:      Number(lat)      }),
      ...(lng       !== undefined && { lng:      Number(lng)      }),
      ...(radiusKm  !== undefined && { radiusKm: Number(radiusKm) }),
    },
    include: { firm: true },
  })
  return res.json(agent)
})

// ── Paramètres de l'agent (types acceptés + rayon) ──────────────────────────
router.patch('/me/settings', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  try {
    const { acceptsExpress, acceptsTomorrow, acceptsScheduled, radiusKm } = req.body
    const agent = await prisma.huissierAgent.update({
      where: { id: req.userId! },
      data: {
        ...(acceptsExpress   !== undefined && { acceptsExpress:   Boolean(acceptsExpress)   }),
        ...(acceptsTomorrow  !== undefined && { acceptsTomorrow:  Boolean(acceptsTomorrow)  }),
        ...(acceptsScheduled !== undefined && { acceptsScheduled: Boolean(acceptsScheduled) }),
        ...(radiusKm         !== undefined && { radiusKm:         Number(radiusKm)          }),
      },
      include: { firm: true },
    })
    return res.json(agent)
  } catch (err: any) {
    console.error('PATCH /huissiers/me/settings error:', err)
    return res.status(500).json({ message: err.message ?? 'Erreur serveur' })
  }
})

// ── Position de l'agent (toutes les 30s en mission) ─────────────────────────
router.patch('/me/location', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  const { lat, lng } = req.body
  if (lat === undefined || lng === undefined)
    return res.status(400).json({ message: 'lat/lng requis' })

  const agent = await prisma.huissierAgent.update({
    where: { id: req.userId! },
    data:  { lat: Number(lat), lng: Number(lng) },
  })

  // Émettre la position à la room de l'intervention active de cet agent
  try {
    const active = await prisma.intervention.findFirst({
      where: { agentId: req.userId!, status: { in: ['en_route', 'arrived'] } },
      select: { id: true },
    })
    if (active) {
      getIO().to(`intervention:${active.id}`).emit('agent:location', {
        interventionId: active.id,
        lat: Number(lat),
        lng: Number(lng),
      })
    }
  } catch {}

  return res.json(agent)
})

// ── Liste des agents de l'étude (huissier patron) ───────────────────────────
router.get('/firm/agents', requireAuth, requireRole('huissier'), async (req: AuthRequest, res) => {
  const patron = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!patron?.firmId) return res.status(404).json({ message: 'Étude introuvable' })

  const agents = await prisma.huissierAgent.findMany({
    where: { firmId: patron.firmId },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
  })
  return res.json(agents)
})

// ── Toutes les missions de l'étude (huissier patron) ───────────────────────
router.get('/firm/interventions', requireAuth, requireRole('huissier'), async (req: AuthRequest, res) => {
  const patron = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!patron?.firmId) return res.status(404).json({ message: 'Étude introuvable' })

  const interventions = await prisma.intervention.findMany({
    where: { firmId: patron.firmId },
    include: {
      client: { select: { firstName: true, lastName: true, phone: true } },
      agent:  { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(interventions)
})

// ── Statistiques de l'étude (huissier patron) ───────────────────────────────
router.get('/firm/stats', requireAuth, requireRole('huissier'), async (req: AuthRequest, res) => {
  const patron = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!patron?.firmId) return res.status(404).json({ message: 'Étude introuvable' })

  const firmId = patron.firmId

  const [total, done, cancelled, expired, byType, ratings, thisMonth] = await Promise.all([
    prisma.intervention.count({ where: { firmId } }),
    prisma.intervention.count({ where: { firmId, status: 'done' } }),
    prisma.intervention.count({ where: { firmId, status: 'cancelled' } }),
    prisma.intervention.count({ where: { firmId, status: 'expired' } }),
    prisma.intervention.groupBy({
      by: ['type'],
      where: { firmId, status: 'done' },
      _count: true,
    }),
    prisma.rating.findMany({
      where: { intervention: { firmId } },
      select: { score: true },
    }),
    prisma.intervention.count({
      where: {
        firmId,
        status: 'done',
        doneAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ])

  const avgRating = ratings.length > 0
    ? parseFloat((ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1))
    : null

  return res.json({
    total,
    done,
    cancelled,
    expired,
    active:          total - done - cancelled - expired,
    thisMonth,
    revenueEstimate: done * 150,
    avgRating,
    ratingsCount:    ratings.length,
    byType,
  })
})

export default router
