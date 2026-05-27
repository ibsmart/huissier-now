import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePolling } from '../../hooks/usePolling'
import { useSocket } from '../../hooks/useSocket'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { formatETA } from '../../utils/eta'
import InterventionMap from '../../components/InterventionMap'
import type { Intervention } from '../../types'

const STATUS_CONFIG = {
  accepted: { label: 'Demande acceptée',      icon: '✅', color: 'bg-primary-50  border-primary-100', text: 'text-primary-700' },
  en_route: { label: 'En route vers vous',     icon: '🚗', color: 'bg-primary-50  border-primary-100', text: 'text-primary-700' },
  arrived:  { label: 'L\'huissier est arrivé', icon: '📍', color: 'bg-primary-50  border-primary-100', text: 'text-primary-700' },
  done:     { label: 'Intervention terminée',  icon: '✔️', color: 'bg-green-50    border-green-100',   text: 'text-green-700' },
}

const STEPS = ['accepted', 'en_route', 'arrived', 'done']

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tokens } = useAuthStore()
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [error, setError] = useState(false)

  // Activer les notifications push
  usePushNotifications()

  // Mise à jour temps-réel via socket (statut + localisation agent)
  useSocket<{ id: string; status: string }>(
    id ? `intervention:${id}` : null,
    'intervention:updated',
    (data) => {
      if (data.status === 'done')     { navigate(`/payment/${id}`); return }
      if (data.status === 'expired' || data.status === 'cancelled') { navigate('/'); return }
      setIntervention((prev) => prev ? { ...prev, status: data.status as Intervention['status'] } : prev)
    },
  )

  useSocket<{ lat: number; lng: number }>(
    id ? `intervention:${id}` : null,
    'agent:location',
    (data) => {
      setIntervention((prev) =>
        prev?.agent ? { ...prev, agent: { ...prev.agent, lat: data.lat, lng: data.lng } } : prev
      )
    },
  )

  // Polling de secours toutes les 30s (fallback si socket déconnecté)
  usePolling(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      if (!res.ok) { setError(true); return }
      const data: Intervention = await res.json()
      setIntervention(data)
      if (data.status === 'done') navigate(`/payment/${id}`)
      if (data.status === 'expired' || data.status === 'cancelled') navigate('/')
    } catch { setError(true) }
  }, 30000)

  if (error) return (
    <div className="screen items-center justify-center px-6 text-center gap-4">
      <div className="text-5xl">⚠️</div>
      <p className="text-gray-600">Impossible de charger le suivi. Vérifiez votre connexion.</p>
      <button className="btn-primary max-w-xs" onClick={() => setError(false)}>Réessayer</button>
    </div>
  )

  if (!intervention) return (
    <div className="screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm">Chargement du suivi...</p>
      </div>
    </div>
  )

  const currentStep = STEPS.indexOf(intervention.status)
  const config = STATUS_CONFIG[intervention.status as keyof typeof STATUS_CONFIG]
  const agentLat = intervention.agent?.lat
  const agentLng = intervention.agent?.lng

  return (
    <div className="screen">
      {/* Statut banner */}
      {config && (
        <div className={`px-6 pt-12 pb-5 border-b ${config.color}`}>
          <div className={`text-2xl font-bold ${config.text} flex items-center gap-2`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
          {intervention.etaMinutes != null && intervention.status === 'en_route' && (
            <p className={`text-sm mt-1 ${config.text} opacity-80`}>
              Arrivée estimée dans <strong>{formatETA(intervention.etaMinutes)}</strong>
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Mis à jour automatiquement toutes les 15 s</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Stepper */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                ${i < currentStep ? 'bg-primary-600 text-white' : i === currentStep ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-1 flex-1 transition-colors ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Carte */}
        {intervention.clientLat && intervention.clientLng && (
          <InterventionMap
            clientLat={intervention.clientLat}
            clientLng={intervention.clientLng}
            agentLat={agentLat}
            agentLng={agentLng}
            className="h-52"
          />
        )}

        {/* Carte agent */}
        {intervention.agent && (
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-2xl shrink-0">⚖️</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {intervention.agent.user?.firstName} {intervention.agent.user?.lastName}
              </div>
              {intervention.agent.firm && (
                <div className="text-sm text-gray-500">{intervention.agent.firm.name}</div>
              )}
              {intervention.agent.rating && (
                <div className="text-sm text-yellow-500 mt-0.5">
                  {'★'.repeat(Math.round(intervention.agent.rating))}
                  {'☆'.repeat(5 - Math.round(intervention.agent.rating))}
                  <span className="text-gray-400 text-xs ml-1">({intervention.agent.rating.toFixed(1)})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adresse */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Lieu d'intervention</div>
          <p className="text-gray-700 text-sm">📍 {intervention.clientAddress}</p>
        </div>
      </div>
    </div>
  )
}
