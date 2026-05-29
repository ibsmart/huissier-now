import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import webPush from 'web-push'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { estimateETA } from '../services/eta'
import { getIO } from '../socket'

const router: import('express').Router = Router()
const prisma = new PrismaClient()

const CreateSchema = z.object({
  type: z.enum(['constat', 'signification', 'saisie', 'autre']),
  description: z.string().min(10).max(1000),
  clientLat: z.number(),
  clientLng: z.number(),
  clientAddress: z.string().min(5),
})

// ── Notifier le client via push + socket ────────────────────────────────────
async function notifyClient(clientId: string, interventionId: string, status: string) {
  // Socket temps-réel
  try {
    getIO().to(`intervention:${interventionId}`).emit('intervention:updated', { id: interventionId, status })
  } catch {}

  // Push PWA
  const PUSH_LABELS: Record<string, { title: string; body: string }> = {
    accepted: { title: '✅ Agent trouvé !',       body: 'Un agent a accepté votre demande et arrive bientôt.' },
    en_route: { title: '🚗 Agent en route',        body: "L'agent est en route vers vous." },
    arrived:  { title: '📍 Agent arrivé',          body: "L'agent est sur place." },
    done:     { title: '✔️ Mission terminée',      body: 'Votre intervention est terminée. Merci !' },
    expired:  { title: '⏰ Demande expirée',       body: 'Aucun agent disponible. Réessayez plus tard.' },
  }
  const notif = PUSH_LABELS[status]
  if (!notif) return

  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: clientId } })
    await Promise.all(
      subs.map((sub) =>
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...notif, tag: `intervention-${interventionId}`, url: `/tracking/${interventionId}` }),
        ).catch(() => {})
      )
    )
  } catch {}
}

// ── Créer une demande (client) ───────────────────────────────────────────────
router.post('/', requireAuth, requireRole('client'), async (req: AuthRequest, res) => {
  try {
    const parsed = CreateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Données invalides', details: parsed.error.flatten() })

    const active = await prisma.intervention.findFirst({
      where: { clientId: req.userId!, status: { in: ['pending', 'accepted', 'en_route', 'arrived'] } },
    })
    if (active) return res.status(409).json({ message: 'Vous avez déjà une intervention en cours', id: active.id })

    const intervention = await prisma.intervention.create({
      data: { ...parsed.data, clientId: req.userId! },
    })

    // Expiration automatique après 3 minutes
    setTimeout(async () => {
      const updated = await prisma.intervention.updateMany({
        where: { id: intervention.id, status: 'pending' },
        data:  { status: 'expired' },
      })
      if (updated.count > 0) notifyClient(req.userId!, intervention.id, 'expired')
    }, 3 * 60 * 1000)

    return res.status(201).json(intervention)
  } catch (err: any) {
    console.error('POST /interventions error:', err)
    return res.status(500).json({ message: err.message ?? 'Erreur serveur' })
  }
})

// ── Mes interventions (client) ───────────────────────────────────────────────
router.get('/mine', requireAuth, requireRole('client'), async (req: AuthRequest, res) => {
  const interventions = await prisma.intervention.findMany({
    where: { clientId: req.userId! },
    include: {
      agent: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          firm: { select: { name: true } },
        },
      },
      ratings: { select: { score: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(interventions)
})

// ── Demandes proches (agent) ─────────────────────────────────────────────────
router.get('/nearby', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  const lat = parseFloat(req.query.lat as string)
  const lng = parseFloat(req.query.lng as string)
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ message: 'Coordonnées invalides' })

  const agent = await prisma.huissierAgent.findUnique({ where: { id: req.userId! } })
  if (!agent) return res.status(404).json({ message: 'Profil agent introuvable' })

  const radiusKm = agent.radiusKm ?? 20

  const interventions = await prisma.$queryRaw<any[]>`
    SELECT i.*,
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(i."clientLat")) *
        cos(radians(i."clientLng") - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(i."clientLat"))
      )) AS distance_km
    FROM "Intervention" i
    WHERE i.status = 'pending'
      AND i."agentId" IS NULL
      AND (6371 * acos(
        cos(radians(${lat})) * cos(radians(i."clientLat")) *
        cos(radians(i."clientLng") - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(i."clientLat"))
      )) < ${radiusKm}
    ORDER BY distance_km ASC
    LIMIT 20
  `
  return res.json(interventions)
})

// ── Détail d'une intervention ────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const intervention = await prisma.intervention.findUnique({
    where: { id: req.params.id },
    include: {
      agent: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          firm: { select: { name: true } },
        },
      },
      client: { select: { firstName: true, lastName: true, phone: true } },
    },
  })
  if (!intervention) return res.status(404).json({ message: 'Intervention introuvable' })
  return res.json(intervention)
})

// ── Accepter une demande (agent) ─────────────────────────────────────────────
router.post('/:id/accept', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  const agent = await prisma.huissierAgent.findUnique({ where: { id: req.userId! } })
  if (!agent) return res.status(404).json({ message: 'Profil agent introuvable' })

  const updated = await prisma.intervention.updateMany({
    where: { id: req.params.id, status: 'pending', agentId: null },
    data:  { status: 'accepted', agentId: req.userId!, firmId: agent.firmId, acceptedAt: new Date() },
  })
  if (updated.count === 0)
    return res.status(409).json({ message: 'Demande déjà prise ou expirée' })

  const intervention = await prisma.intervention.findUnique({
    where: { id: req.params.id },
    include: { agent: { include: { user: { select: { firstName: true, lastName: true } }, firm: true } } },
  })

  await prisma.interventionLog.create({
    data: { interventionId: req.params.id, status: 'accepted', actorId: req.userId! },
  })

  // Notifier le client
  if (intervention) notifyClient(intervention.clientId, req.params.id, 'accepted')

  return res.json(intervention)
})

// ── Mettre à jour le statut (agent) ─────────────────────────────────────────
router.patch('/:id/status', requireAuth, requireRole('agent'), async (req: AuthRequest, res) => {
  const { status, lat, lng } = req.body
  const allowed = ['en_route', 'arrived', 'done']
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Statut invalide' })

  const current = await prisma.intervention.findUnique({ where: { id: req.params.id } })
  if (!current || current.agentId !== req.userId!)
    return res.status(403).json({ message: 'Non autorisé' })

  let etaMinutes: number | undefined
  if (status === 'en_route' && lat && lng) {
    etaMinutes = estimateETA(Number(lat), Number(lng), current.clientLat, current.clientLng)
  }

  const intervention = await prisma.intervention.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(etaMinutes !== undefined && { etaMinutes }),
      ...(status === 'done' && { doneAt: new Date() }),
    },
  })

  await prisma.interventionLog.create({
    data: {
      interventionId: req.params.id,
      status,
      actorId: req.userId!,
      agentLat: lat ? Number(lat) : undefined,
      agentLng: lng ? Number(lng) : undefined,
      etaMinutes,
    },
  })

  // Notifier le client (socket + push)
  notifyClient(current.clientId, req.params.id, status)

  return res.json(intervention)
})

// ── Annuler (client) ─────────────────────────────────────────────────────────
router.post('/:id/cancel', requireAuth, requireRole('client'), async (req: AuthRequest, res) => {
  const updated = await prisma.intervention.updateMany({
    where: { id: req.params.id, clientId: req.userId!, status: 'pending' },
    data:  { status: 'cancelled' },
  })
  if (updated.count === 0) return res.status(409).json({ message: "Impossible d'annuler" })
  return res.json({ message: 'Annulée' })
})

// ── Évaluation (client) ──────────────────────────────────────────────────────
router.post('/:id/rating', requireAuth, requireRole('client'), async (req: AuthRequest, res) => {
  const { score, comment } = req.body
  if (!score || score < 1 || score > 5) return res.status(400).json({ message: 'Score invalide (1-5)' })

  const rating = await prisma.rating.create({
    data: { interventionId: req.params.id, fromClientId: req.userId!, score: Number(score), comment },
  })
  return res.status(201).json(rating)
})

export default router
