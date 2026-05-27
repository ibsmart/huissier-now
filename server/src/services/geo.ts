import { PrismaClient } from '@prisma/client'

export async function findNearbyHuissiers(
  prisma: PrismaClient,
  clientLat: number,
  clientLng: number,
  radiusKm: number
) {
  // Haversine directement en SQL PostgreSQL
  const interventions = await prisma.$queryRaw<any[]>`
    SELECT i.*
    FROM interventions i
    WHERE i.status = 'pending'
      AND i."huissierId" IS NULL
    ORDER BY i."createdAt" ASC
    LIMIT 20
  `
  return interventions
}
