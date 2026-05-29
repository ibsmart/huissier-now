import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { apiFetch } from '../../api/client'
import type { Intervention } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'En attente',  color: 'bg-amber-100 text-amber-700',    icon: '⏳' },
  accepted:  { label: 'Acceptée',    color: 'bg-blue-100 text-blue-700',      icon: '✅' },
  en_route:  { label: 'En route',    color: 'bg-blue-100 text-blue-700',      icon: '🚗' },
  arrived:   { label: 'Arrivé',      color: 'bg-blue-100 text-blue-700',      icon: '📍' },
  done:      { label: 'Terminée',    color: 'bg-green-100 text-green-700',    icon: '✔️' },
  expired:   { label: 'Expirée',     color: 'bg-gray-100 text-gray-500',      icon: '⏰' },
  cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-500',        icon: '✕'  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { tokens } = useAuthStore()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/interventions/mine', {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    })
      .then((data) => setInterventions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id: string) {
    if (!window.confirm('Annuler cette demande en attente ?')) return
    setCancellingId(id)
    try {
      await apiFetch(`/api/interventions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      setInterventions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'cancelled' } : i)),
      )
    } catch (e: any) {
      alert(e.message ?? 'Impossible d\'annuler')
    } finally {
      setCancellingId(null)
    }
  }

  const pending  = interventions.filter((i) => i.status === 'pending')
  const active   = interventions.filter((i) => ['accepted', 'en_route', 'arrived'].includes(i.status))
  const finished = interventions.filter((i) => ['done', 'expired', 'cancelled'].includes(i.status))

  return (
    <div className="screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-400 mb-3 flex items-center gap-1 text-sm min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mes interventions</h1>
        <p className="text-sm text-gray-400">{interventions.length} demande{interventions.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

        {loading && (
          <div className="text-center text-gray-400 py-12 animate-pulse">Chargement...</div>
        )}

        {!loading && interventions.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">📋</div>
            <p className="font-semibold text-gray-600">Aucune intervention pour le moment</p>
            <p className="text-sm text-gray-400">Vos demandes apparaîtront ici.</p>
            <button className="btn-primary max-w-xs" onClick={() => navigate('/')}>
              Lancer une demande
            </button>
          </div>
        )}

        {/* ── Demandes en attente d'un agent ── */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-3 px-1">
              ⏳ En attente d'un agent
            </p>
            <div className="space-y-3">
              {pending.map((item) => (
                <div key={item.id} className="card border border-amber-200 bg-amber-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{TYPE_LABELS[item.type] ?? item.type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                        ⏳ En attente
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">📅 {formatDate(item.createdAt)}</p>
                  <p className="text-sm text-gray-500 truncate mb-3">📍 {item.clientAddress}</p>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold active:opacity-80"
                      onClick={() => navigate(`/request/searching?id=${item.id}`)}
                    >
                      Voir le statut
                    </button>
                    <button
                      className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-semibold active:opacity-80 disabled:opacity-40"
                      disabled={cancellingId === item.id}
                      onClick={() => handleCancel(item.id)}
                    >
                      {cancellingId === item.id ? 'Annulation…' : '✕ Annuler'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mission en cours ── */}
        {active.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3 px-1">
              🚗 Mission en cours
            </p>
            <div className="space-y-3">
              {active.map((item) => (
                <InterventionCard key={item.id} item={item} onClick={() => navigate(`/tracking/${item.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Historique ── */}
        {finished.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Historique
            </p>
            <div className="space-y-3">
              {finished.map((item) => (
                <InterventionCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InterventionCard({ item, onClick }: { item: Intervention; onClick?: () => void }) {
  const s = STATUS_CONFIG[item.status] ?? { label: item.status, color: 'bg-gray-100 text-gray-500', icon: '•' }
  return (
    <button
      className={`card w-full text-left space-y-2 ${onClick ? 'active:bg-gray-50' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{TYPE_LABELS[item.type] ?? item.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
            {s.icon} {s.label}
          </span>
        </div>
        {onClick && <span className="text-gray-300 text-sm">→</span>}
      </div>
      <p className="text-xs text-gray-400">📅 {formatDate(item.createdAt)}</p>
      <p className="text-sm text-gray-500 truncate">📍 {item.clientAddress}</p>
      {item.agent && (
        <p className="text-xs text-gray-400">
          ⚖️ {item.agent.user?.firstName} {item.agent.user?.lastName}
          {item.agent.firm ? ` · ${item.agent.firm.name}` : ''}
        </p>
      )}
      {item.status === 'done' && (item as any).ratings?.length > 0 && (
        <div className="flex items-center gap-1 text-yellow-500 text-xs">
          {'★'.repeat((item as any).ratings[0].score)}{'☆'.repeat(5 - (item as any).ratings[0].score)}
          <span className="text-gray-400">Votre note</span>
        </div>
      )}
    </button>
  )
}
