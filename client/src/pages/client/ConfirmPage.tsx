import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { useAuthStore } from '../../store/authStore'
import { apiFetch } from '../../api/client'
import { useT } from '../../i18n'
import LangToggle from '../../components/LangToggle'

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

const URGENCY_ICONS: Record<string, string> = {
  express:   '⚡',
  tomorrow:  '📅',
  scheduled: '🗓️',
}

export default function ConfirmPage() {
  const navigate = useNavigate()
  const { draft, reset } = useDraftStore()
  const { tokens } = useAuthStore()
  const t = useT()
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
          urgency:       draft.urgency    ?? 'express',
          scheduledAt:   draft.scheduledAt ?? null,
          surcharge:     draft.surcharge  ?? 0,
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
  const urgency   = draft.urgency ?? 'express'
  const surcharge = draft.surcharge ?? 0

  function formatScheduledAt(iso?: string): string {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4 relative">
        <LangToggle className="absolute top-4 right-4" />
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('confirm_title')}</h1>
        <p className="text-gray-500 mt-1">{t('confirm_subtitle')}</p>
      </div>

      <div className="px-6 flex-1 space-y-4 overflow-y-auto pb-4">
        {/* Type */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {t('confirm_type')}
          </div>
          <div className="font-semibold text-gray-900">{TYPE_LABELS[draft.type ?? ''] ?? '—'}</div>
          {draft.subType && (
            <div className="text-sm text-primary-600 mt-0.5 font-medium">
              └ {SUBTYPE_LABELS[draft.subType] ?? draft.subType}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {t('confirm_description')}
          </div>
          {hasAudio && (
            <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-2">
              {t('confirm_audio_joined')}
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
              {t('confirm_photos')} ({draft.photos!.length})
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
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {t('confirm_address')}
          </div>
          <div className="text-gray-700 text-sm leading-relaxed">
            📍 {draft.address ?? '—'}
          </div>
        </div>

        {/* Urgence */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {t('confirm_urgency')}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{URGENCY_ICONS[urgency] ?? '⚡'}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                {urgency === 'express'   && t('urgency_express')}
                {urgency === 'tomorrow'  && t('urgency_tomorrow')}
                {urgency === 'scheduled' && t('urgency_scheduled')}
                {surcharge > 0 ? (
                  <span className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-xs font-bold">
                    +{surcharge}% {t('confirm_surcharge')}
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-bold">
                    {t('confirm_no_surcharge')}
                  </span>
                )}
              </div>
              {draft.scheduledAt && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {t('confirm_scheduled_at')} : {formatScheduledAt(draft.scheduledAt)}
                </div>
              )}
            </div>
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
          {loading ? t('confirm_sending') : t('confirm_send')}
        </button>
      </div>
    </div>
  )
}
