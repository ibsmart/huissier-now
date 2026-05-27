import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router: import('express').Router = Router()
const prisma = new PrismaClient()

const RegisterClientSchema = z.object({
  role: z.literal('client'),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
})

const RegisterHuissierSchema = z.object({
  role: z.literal('huissier'),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  firmName: z.string().min(2),
  siret: z.string().optional(),
  firmAddress: z.string().optional(),
})

const RegisterAgentSchema = z.object({
  role: z.literal('agent'),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  firmId: z.string().uuid(),   // l'agent est ajouté par son patron
  radiusKm: z.number().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

// ── Inscription client ──────────────────────────────────────────────────────
router.post('/register/client', async (req, res) => {
  const parsed = RegisterClientSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })

  const { email, password, firstName, lastName, phone } = parsed.data
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: 'Email déjà utilisé' })

  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), firstName, lastName, phone, role: 'client' },
    select: { id: true, role: true, email: true, firstName: true, lastName: true, phone: true },
  })
  return res.status(201).json({ user, tokens: generateTokens(user.id, user.role) })
})

// ── Inscription huissier (patron) + création de l'étude ────────────────────
router.post('/register/huissier', async (req, res) => {
  const parsed = RegisterHuissierSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })

  const { email, password, firstName, lastName, phone, firmName, siret, firmAddress } = parsed.data
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: 'Email déjà utilisé' })

  const firm = await prisma.huissierFirm.create({
    data: { name: firmName, siret, address: firmAddress },
  })

  const user = await prisma.user.create({
    data: {
      email, passwordHash: await bcrypt.hash(password, 12),
      firstName, lastName, phone, role: 'huissier', firmId: firm.id,
    },
    select: { id: true, role: true, email: true, firstName: true, lastName: true, firmId: true },
  })
  return res.status(201).json({ user, firm, tokens: generateTokens(user.id, user.role) })
})

// ── Inscription agent (par le patron) ──────────────────────────────────────
router.post('/register/agent', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'huissier') return res.status(403).json({ message: 'Réservé au patron' })

  const parsed = RegisterAgentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })

  const { email, password, firstName, lastName, phone, firmId, radiusKm } = parsed.data

  // Vérifier que le patron possède bien cette étude
  const patron = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (patron?.firmId !== firmId) return res.status(403).json({ message: 'Vous ne gérez pas cette étude' })

  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: 'Email déjà utilisé' })

  const user = await prisma.user.create({
    data: {
      email, passwordHash: await bcrypt.hash(password, 12),
      firstName, lastName, phone, role: 'agent',
      agentProfile: { create: { firmId, radiusKm: radiusKm ?? 20 } },
    },
    select: { id: true, role: true, email: true, firstName: true, lastName: true },
  })
  return res.status(201).json({ user, tokens: generateTokens(user.id, user.role) })
})

// ── Login (tous rôles) ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Données invalides' })

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      agentProfile: { include: { firm: true } },
      firm: true,
    },
  })
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' })

  const { passwordHash: _, ...safeUser } = user
  return res.json({ user: safeUser, tokens: generateTokens(user.id, user.role) })
})

// ── Refresh token ───────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ message: 'Token manquant' })
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string; role: string }
    return res.json({ tokens: generateTokens(payload.userId, payload.role) })
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }
})

// ── Compat : ancien /register (client par défaut) ──────────────────────────
router.post('/register', async (req, res) => {
  req.body.role = 'client'
  const parsed = RegisterClientSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Données invalides' })

  const { email, password, firstName, lastName, phone } = parsed.data
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: 'Email déjà utilisé' })

  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), firstName, lastName, phone, role: 'client' },
    select: { id: true, role: true, email: true, firstName: true, lastName: true, phone: true },
  })
  return res.status(201).json({ user, tokens: generateTokens(user.id, user.role) })
})

export default router
