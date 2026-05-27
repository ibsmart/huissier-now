import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { formatETA } from '../../utils/eta'
import InterventionMap from '../../components/InterventionMap'
import type { Intervention, InterventionStatus } from '../../types'

const NEXT_STATUS: Partial<Record<InterventionStatus, { status: InterventionStatus; label: string; style: string }>> = {
  pending:  { status: 'accepted', label: 'Accepter la demande', style: 'btn-primary' },
  accepted: { status: 'en_route', label: '🚗 Je suis en route',    style: 'btn-primary' },
  en_route: { status: 'arrived',  label: '📍 Je suis arrivé',     style: 'btn-primary' },
  arrived:  { status: 'done',     label: '✅ Intervention terminée', style: 'btn-danger' },
}

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

export default function MissionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, tokens } = useAuthStore()
  const isAgent = user?.role === 'agent'
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    fetchIntervention()
    if (!isAgent) return

    // Géolocalisation continue pour l'agent
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        updateLocation(latitude, longitude)
      },
      () => {},
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [id])

  async function fetchIntervention() {
    if (!id) return
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      if (res.ok) setIntervention(await res.json())
    } catch {}
  }

  async function updateLocation(lat: number, lng: number) {
    await fetch('/api/huissiers/me/location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
      body: JSON.stringify({ lat, lng }),
    })
  }

  async function handleStatusUpdate() {
    if (!intervention) return
    const next = NEXT_STATUS[intervention.status]
    if (!next) return
    setLoading(true)
    try {
      const res = await fetch(`/api/interventions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ status: next.status, lat: coords?.lat, lng: coords?.lng }),
      })
      if (res.ok) {
        const updated = await res.json()
        setIntervention(updated)
        if (next.status === 'done') navigate('/huissier/dashboard')
      }
    } catch {}
    finally { setLoading(false) }
  }

  async function handleAccept() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/interventions/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
      })
      if (res.ok) setIntervention(await res.json())
      else {
        const data = await res.json()
        alert(data.message ?? 'Erreur')
      }
    } catch {}
    finally { setLoading(false) }
  }

  if (!intervention) return (
    <div className="screen items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  const next = NEXT_STATUS[intervention.status]
  const isPending = intervention.status === 'pending'

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header-gradient text-white px-6 pt-12 pb-5">
        <button onClick={() => navigate(-1)} className="text-white/70 mb-4 flex items-center gap-2 min-h-[44px] text-sm">
          ← Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{TYPE_LABELS[intervention.type]}</h1>
            <p className="text-white/60 text-sm mt-0.5 capitalize">{intervention.status.replace('_', ' ')}</p>
          </div>
          {intervention.etaMinutes && intervention.status === 'en_route' && (
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center border border-white/20">
              <div className="text-xl font-bold">{formatETA(intervention.etaMinutes)}</div>
              <div className="text-xs text-white/70">ETA</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Carte */}
        {intervention.clientLat && intervention.clientLng && (
          <InterventionMap
            clientLat={intervention.clientLat}
            clientLng={intervention.clientLng}
            agentLat={coords?.lat}
            agentLng={coords?.lng}
            className="h-48"
          />
        )}

        {/* Infos client */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Client</div>
          <p className="font-semibold text-gray-900">
            {intervention.client?.firstName} {intervention.client?.lastName}
          </p>
          {intervention.client?.phone && (
            <a href={`tel:${intervention.client.phone}`}
               className="text-primary-600 text-sm mt-1 flex items-center gap-1">
              📞 {intervention.client.phone}
            </a>
          )}
        </div>

        {/* Description */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</div>
          <p className="text-gray-700 text-sm leading-relaxed">{intervention.description}</p>
        </div>

        {/* Adresse */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Adresse</div>
          <p className="text-gray-700 text-sm">📍 {intervention.clientAddress}</p>
          <a
            href={`https://maps.google.com/?q=${intervention.clientLat},${intervention.clientLng}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 text-sm mt-2 inline-flex items-center gap-1 font-medium"
          >
            Ouvrir dans Google Maps →
          </a>
        </div>
      </div>

      {/* Action button */}
      <div className="px-6 pb-10 pt-3">
        {isPending && isAgent && (
          <button className="btn-primary" onClick={handleAccept} disabled={loading}>
            {loading ? 'Acceptation...' : 'Accepter cette mission'}
          </button>
        )}
        {!isPending && next && isAgent && (
          <button className={next.style} onClick={handleStatusUpdate} disabled={loading}>
            {loading ? 'Mise à jour...' : next.label}
          </button>
        )}
        {!isAgent && (
          <div className="card text-center text-gray-500 text-sm">
            👔 Mode lecture — seul l'agent assigné peut modifier le statut
          </div>
        )}
      </div>
    </div>
  )
}
