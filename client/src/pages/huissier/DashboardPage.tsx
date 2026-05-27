import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSocket } from '../../hooks/useSocket'
import type { Intervention } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, tokens, clearAuth } = useAuthStore()
  const isAgent = user?.role === 'agent'
  const isPatron = user?.role === 'huissier'

  const [available, setAvailable] = useState(false)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  // Socket : rafraîchir quand une intervention change de statut (agent accepte, etc.)
  useSocket<{ id: string; status: string }>(
    isAgent && available ? 'agent:missions' : null,
    'intervention:updated',
    () => { fetchNearby() },
  )

  // Agent : polling des demandes proches quand disponible
  useEffect(() => {
    if (isAgent && available && coords) {
      updateAvailability(true)
      fetchNearby()
      const interval = setInterval(fetchNearby, 10000)
      return () => clearInterval(interval)
    }
    if (isPatron) {
      fetchFirmInterventions()
      const interval = setInterval(fetchFirmInterventions, 15000)
      return () => clearInterval(interval)
    }
  }, [isAgent, available, coords, isPatron])

  async function updateAvailability(isAvailable: boolean) {
    if (!coords) return
    await fetch('/api/huissiers/me/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
      body: JSON.stringify({ isAvailable, lat: coords.lat, lng: coords.lng }),
    })
  }

  async function fetchNearby() {
    if (!coords) return
    try {
      const res = await fetch(`/api/interventions/nearby?lat=${coords.lat}&lng=${coords.lng}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      setInterventions(await res.json())
    } catch {}
  }

  async function fetchFirmInterventions() {
    try {
      const res = await fetch('/api/huissiers/firm/interventions', {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      setInterventions(await res.json())
    } catch {}
  }

  function toggleAvailable() {
    const next = !available
    setAvailable(next)
    if (!next) updateAvailability(false)
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bonjour, {user?.firstName}</h1>
            <p className="text-sm text-gray-500">
              {isPatron ? '👔 Patron — vue étude complète' : '🚗 Agent de terrain'}
            </p>
          </div>
          <button onClick={() => { clearAuth(); navigate('/') }} className="text-sm text-gray-400 underline min-h-[44px]">
            Déconnexion
          </button>
        </div>

        {/* Toggle disponibilité — agents seulement */}
        {isAgent && (
          <div className="card flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">Ma disponibilité</div>
              <div className={`text-sm ${available ? 'text-green-600' : 'text-gray-400'}`}>
                {available ? '🟢 Disponible — je vois les demandes' : '⚫ Hors service'}
              </div>
            </div>
            <button
              onClick={toggleAvailable}
              className={`w-14 h-8 rounded-full transition-colors flex items-center
                ${available ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform mx-1
                ${available ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>
        )}

        {/* Patron : résumé + accès agents */}
        {isPatron && (
          <div className="space-y-2">
            <div className="card bg-primary-50 border-primary-100">
              <p className="text-sm text-primary-700 font-medium">
                📋 {interventions.filter(i => ['pending','accepted','en_route','arrived'].includes(i.status)).length} intervention(s) en cours
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/huissier/agents')}
                className="card flex items-center gap-2 active:bg-gray-50"
              >
                <span className="text-xl">👥</span>
                <span className="font-semibold text-gray-800 text-sm">Mes agents</span>
                <span className="ml-auto text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/huissier/stats')}
                className="card flex items-center gap-2 active:bg-gray-50"
              >
                <span className="text-xl">📊</span>
                <span className="font-semibold text-gray-800 text-sm">Statistiques</span>
                <span className="ml-auto text-gray-400">→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isAgent && !available && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-3">💤</div>
            <p>Activez votre disponibilité pour recevoir des demandes.</p>
          </div>
        )}

        {((isAgent && available) || isPatron) && interventions.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-3 animate-pulse">🔍</div>
            <p>Aucune demande pour le moment.</p>
          </div>
        )}

        {interventions.map((item) => (
          <button
            key={item.id}
            className="card w-full text-left space-y-2 active:bg-gray-50"
            onClick={() => navigate(`/huissier/mission/${item.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{TYPE_LABELS[item.type]}</span>
                <StatusBadge status={item.status} />
              </div>
              <span className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">📍 {item.clientAddress}</p>
              {item.distance_km != null && (
                <p className="text-xs font-medium text-primary-600">{item.distance_km.toFixed(1)} km</p>
              )}
            </div>
            {isPatron && item.agent && (
              <p className="text-xs text-gray-500">
                👤 {item.agent.user?.firstName} {item.agent.user?.lastName}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:   { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    accepted:  { label: 'Acceptée',   color: 'bg-primary-100 text-primary-700' },
    en_route:  { label: 'En route',   color: 'bg-primary-100 text-primary-700' },
    arrived:   { label: 'Arrivé',     color: 'bg-primary-100 text-primary-700' },
    done:      { label: 'Terminée',   color: 'bg-green-100 text-green-700' },
    expired:   { label: 'Expirée',    color: 'bg-gray-100 text-gray-500' },
    cancelled: { label: 'Annulée',    color: 'bg-red-100 text-red-500' },
  }
  const s = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
}
