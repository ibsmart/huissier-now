import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { useAuthStore } from '../../store/authStore'
import { apiFetch } from '../../api/client'

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat',
  signification: 'Signification',
  saisie: 'Saisie',
  autre: 'Autre',
}

export default function ConfirmPage() {
  const navigate = useNavigate()
  const { draft, reset } = useDraftStore()
  const { tokens } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!draft.type || !draft.description || !draft.address) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          type: draft.type,
          description: draft.description,
          clientLat: draft.lat ?? 0,
          clientLng: draft.lng ?? 0,
          clientAddress: draft.address,
        }),
      })
      reset()
      navigate(`/request/searching?id=${res.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Récapitulatif</h1>
        <p className="text-gray-500 mt-1">Vérifiez votre demande avant de l'envoyer.</p>
      </div>

      <div className="px-6 flex-1 space-y-4">
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</div>
          <div className="font-semibold text-gray-900">{TYPE_LABELS[draft.type ?? ''] ?? '—'}</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</div>
          <div className="text-gray-700 text-sm leading-relaxed">{draft.description ?? '—'}</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Adresse</div>
          <div className="text-gray-700 text-sm leading-relaxed">{draft.address ?? '—'}</div>
        </div>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>

      <div className="px-6 pb-10 pt-4">
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
        </button>
      </div>
    </div>
  )
}
