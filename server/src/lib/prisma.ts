import { PrismaClient } from '@prisma/client'

// Singleton Prisma : une seule instance = un seul pool de connexions
// (évite d'épuiser les connexions PostgreSQL sur Hostinger)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export default prisma
