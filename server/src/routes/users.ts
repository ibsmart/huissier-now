import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router: import('express').Router = Router()
const prisma = new PrismaClient()

// ── Profil courant ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
  })
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
  return res.json(user)
})

// ── Mise à jour du profil ───────────────────────────────────────────────────
const UpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().min(1).max(50).optional(),
  email:     z.string().email().optional(),
  phone:     z.string().nullable().optional(),
})

router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success)
    return res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })

  if (parsed.data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: req.userId! } },
    })
    if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé' })
  }

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: parsed.data,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
  })
  return res.json(user)
})

// ── Changement de mot de passe ──────────────────────────────────────────────
router.patch('/me/password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Les deux mots de passe sont requis' })
  if (newPassword.length < 8)
    return res.status(400).json({ message: 'Nouveau mot de passe trop court (8 caractères minimum)' })

  const user = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: req.userId! }, data: { passwordHash: hash } })
  return res.json({ message: 'Mot de passe mis à jour' })
})

// ── Enregistrement abonnement push (PWA) ────────────────────────────────────
router.post('/push-subscription', requireAuth, async (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return res.status(400).json({ message: 'Subscription invalide' })

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.userId! },
    create: { userId: req.userId!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })
  return res.status(201).json({ message: 'Abonnement push enregistré' })
})

export default router
