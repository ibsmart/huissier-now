import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { useAuthStore } from '../../store/authStore'
import { apiFetch } from '../../api/client'

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

const SUBTYPE_LABELS: Record<string, string> = {
  etat_lieux:    'État des lieux',
  degats:        'Dégâts / Sinistre',
  nuisances:     'Nuisances',
  travaux:       'Travaux / Dommages',
  numerique:     'Numérique',
  accident:      'Accident',
  livraison:     'Livraison',
  autre_constat: 'Autre constat',
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
          type:          draft.type,
          subType:       draft.subType ?? null,
          description:   draft.description,
          photos:        draft.photos    ?? [],
          audioBase64:   draft.audioBase64 ?? null,
          clientLat:     draft.lat ?? 0,
          clientLng:     draft.lng ?? 0,
          clientAddress: draft.address,
        }),
      })
      reset()
      navigate(`/request/searching?id=${res.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  const hasPhotos = (draft.photos?.length ?? 0) > 0
  const hasAudio  = !!draft.audioBase64

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Récapitulatif</h1>
        <p className="text-gray-500 mt-1">Vérifiez votre demande avant de l'envoyer.</p>
      </div>

      <div className="px-6 flex-1 space-y-4 overflow-y-auto pb-4">
        {/* Type */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</div>
          <div className="font-semibold text-gray-900">{TYPE_LABELS[draft.type ?? ''] ?? '—'}</div>
          {draft.subType && (
            <div className="text-sm text-primary-600 mt-0.5 font-medium">
              └ {SUBTYPE_LABELS[draft.subType] ?? draft.subType}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</div>
          {hasAudio && (
            <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-2">
              🎤 Enregistrement audio joint
            </div>
          )}
          <div className="text-gray-700 text-sm leading-relaxed">
            {draft.description === 'Enregistrement audio joint à la demande.'
              ? <span className="text-gray-400 italic">Aucun texte ajouté</span>
              : draft.description ?? '—'
            }
          </div>
        </div>

        {/* Photos */}
        {hasPhotos && (
          <div className="card">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Photos ({draft.photos!.length})
            </div>
            <div className="grid grid-cols-3 gap-2">
              {draft.photos!.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={src} alt={`photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adresse */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Adresse</div>
          <div className="text-gray-700 text-sm leading-relaxed">
            📍 {draft.address ?? '—'}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4">
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Envoi en cours…' : 'Envoyer ma demande'}
        </button>
      </div>
    </div>
  )
}
