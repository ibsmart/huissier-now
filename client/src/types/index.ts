export type UserRole = 'client' | 'huissier' | 'agent' | 'admin'

export type InterventionType = 'constat' | 'signification' | 'saisie' | 'autre'

export type InterventionStatus =
  | 'pending'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'done'
  | 'expired'
  | 'cancelled'

export interface User {
  id: string
  role: UserRole
  email: string
  firstName: string
  lastName: string
  phone?: string
  firmId?: string
  firm?: HuissierFirm
  agentProfile?: HuissierAgent
}

export interface HuissierFirm {
  id: string
  name: string
  siret?: string
  address?: string
}

export interface HuissierAgent {
  id: string
  firmId: string
  firm?: HuissierFirm
  user?: { firstName: string; lastName: string }
  isAvailable: boolean
  lat?: number
  lng?: number
  radiusKm: number
  rating?: number
  acceptsExpress?: boolean
  acceptsTomorrow?: boolean
  acceptsScheduled?: boolean
}

export interface Intervention {
  id: string
  clientId: string
  client?: { firstName: string; lastName: string; phone?: string }
  agentId?: string
  agent?: HuissierAgent
  firmId?: string
  firm?: HuissierFirm
  type: InterventionType
  subType?: string
  description: string
  photos?: string[]
  audioBase64?: string
  status: InterventionStatus
  clientLat: number
  clientLng: number
  clientAddress: string
  etaMinutes?: number
  distance_km?: number
  urgency?: string
  scheduledAt?: string
  surcharge?: number
  createdAt: string
  acceptedAt?: string
  doneAt?: string
}

export interface InterventionDraft {
  type?: InterventionType
  subType?: string
  description?: string
  photos?: string[]       // base64 data URLs
  audioBase64?: string    // base64 audio
  lat?: number
  lng?: number
  address?: string
  urgency?: string
  scheduledAt?: string
  surcharge?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
