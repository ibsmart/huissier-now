import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const TIMEOUT_SECONDS = 180

export default function SearchingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tokens } = useAuthStore()
  const interventionId = params.get('id')
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<'searching' | 'expired' | 'error'>('searching')

  useEffect(() => {
    if (!interventionId) { navigate('/'); return }

    // Polling statut
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/interventions/${interventionId}`, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (['accepted', 'en_route', 'arrived'].includes(data.status)) {
          clearInterval(pollInterval)
          navigate(`/tracking/${interventionId}`)
        }
        if (data.status === 'expired') {
          clearInterval(pollInterval)
          setStatus('expired')
        }
      } catch {}
    }, 5000)

    // Timer countdown
    const countTimer = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= TIMEOUT_SECONDS) {
          clearInterval(pollInterval)
          clearInterval(countTimer)
          setStatus('expired')
        }
        return e + 1
      })
    }, 1000)

    return () => { clearInterval(pollInterval); clearInterval(countTimer) }
  }, [interventionId, tokens, navigate])

  async function handleCancel() {
    if (!interventionId) return
    try {
      await fetch(`/api/interventions/${interventionId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
    } catch {}
    navigate('/')
  }

  async function handleRetry() {
    navigate('/')
  }

  const progress = Math.min((elapsed / TIMEOUT_SECONDS) * 100, 100)
  const remaining = Math.max(0, TIMEOUT_SECONDS - elapsed)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  // ── Expiré ───────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div className="screen items-center justify-center px-6 text-center gap-6">
        <div className="text-6xl">⏰</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun huissier disponible</h2>
          <p className="text-gray-500 leading-relaxed">
            Aucun agent n'a pu accepter votre demande dans les délais.
            Vous pouvez réessayer dans quelques minutes.
          </p>
        </div>
        <button className="btn-primary max-w-xs" onClick={handleRetry}>
          Faire une nouvelle demande
        </button>
      </div>
    )
  }

  // ── Recherche en cours ───────────────────────────────────────────────────
  return (
    <div className="screen bg-gradient-to-b from-primary-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">

        {/* Animation */}
        <div className="relative w-36 h-36">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 animate-ping opacity-30" />
          <div className="absolute inset-3 rounded-full border-4 border-primary-200 animate-ping opacity-20 [animation-delay:0.5s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
              🔍
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recherche en cours</h2>
          <p className="text-gray-500">
            Nous cherchons un agent disponible dans votre secteur...
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-full space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {mins > 0 ? `${mins}m ${secs.toString().padStart(2,'0')}s` : `${secs}s`} restantes
          </p>
        </div>

        {/* Étapes animées */}
        <div className="w-full space-y-2">
          {[
            { done: elapsed >= 0,  label: 'Demande envoyée' },
            { done: elapsed >= 5,  label: 'Recherche d\'agents proches' },
            { done: elapsed >= 15, label: 'Notification aux agents disponibles' },
          ].map((step) => (
            <div key={step.label} className={`flex items-center gap-3 text-sm transition-colors
              ${step.done ? 'text-primary-600' : 'text-gray-300'}`}>
              <span>{step.done ? '✓' : '○'}</span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10">
        <button className="btn-secondary text-gray-500 border-gray-300" onClick={handleCancel}>
          Annuler la demande
        </button>
      </div>
    </div>
  )
}
