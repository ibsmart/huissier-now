import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { useT } from '../../i18n'
import LangToggle from '../../components/LangToggle'

type UrgencyType = 'express' | 'tomorrow' | 'scheduled'
type Slot = 'morning' | 'afternoon' | 'evening'

const SLOT_TIMES: Record<Slot, { hour: number; minute: number }> = {
  morning:   { hour: 9,  minute: 0 },
  afternoon: { hour: 14, minute: 0 },
  evening:   { hour: 17, minute: 0 },
}

export default function UrgencyPage() {
  const navigate = useNavigate()
  const { setUrgency } = useDraftStore()
  const t = useT()

  const [selected, setSelected] = useState<UrgencyType>('express')
  const [slot, setSlot]         = useState<Slot | null>(null)
  const [date, setDate]         = useState('')
  const [time, setTime]         = useState('')

  // Compute min/max dates for scheduled
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 1)
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 30)
  const minDateStr = minDate.toISOString().split('T')[0]
  const maxDateStr = maxDate.toISOString().split('T')[0]

  // Tomorrow's date string for display
  const tomorrowStr = minDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  function isConfirmEnabled(): boolean {
    if (selected === 'express') return true
    if (selected === 'tomorrow') return slot !== null
    if (selected === 'scheduled') return date !== '' && time !== ''
    return false
  }

  function buildScheduledAt(): string | undefined {
    if (selected === 'express') return undefined
    if (selected === 'tomorrow' && slot) {
      const d = new Date(minDate)
      d.setHours(SLOT_TIMES[slot].hour, SLOT_TIMES[slot].minute, 0, 0)
      return d.toISOString()
    }
    if (selected === 'scheduled' && date && time) {
      return new Date(`${date}T${time}:00`).toISOString()
    }
    return undefined
  }

  function handleConfirm() {
    const urgencyMap: Record<UrgencyType, number> = {
      express:   30,
      tomorrow:   0,
      scheduled: 20,
    }
    const scheduledAt = buildScheduledAt()
    setUrgency(selected, scheduledAt, urgencyMap[selected])
    navigate('/request/confirm')
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 relative">
        <LangToggle className="absolute top-4 right-4" />
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('urgency_title')}</h1>
        <p className="text-gray-500 mt-1">{t('urgency_subtitle')}</p>
      </div>

      <div className="px-6 flex-1 overflow-y-auto pb-4 space-y-3">

        {/* Express card */}
        <button
          onClick={() => setSelected('express')}
          className={`w-full card text-left transition-all ${
            selected === 'express'
              ? 'border-2 border-[#C9A84C] bg-amber-50'
              : 'border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base">{t('urgency_express')}</span>
                <span className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-xs font-bold">
                  {t('urgency_express_badge')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{t('urgency_express_desc')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('urgency_express_detail')}</p>
            </div>
            {selected === 'express' && (
              <span className="text-[#C9A84C] text-xl shrink-0">✓</span>
            )}
          </div>
        </button>

        {/* Demain card */}
        <button
          onClick={() => setSelected('tomorrow')}
          className={`w-full card text-left transition-all ${
            selected === 'tomorrow'
              ? 'border-2 border-[#C9A84C] bg-amber-50'
              : 'border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base">{t('urgency_tomorrow')}</span>
                <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-bold">
                  {t('urgency_tomorrow_badge')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{t('urgency_tomorrow_desc')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{tomorrowStr}</p>
            </div>
            {selected === 'tomorrow' && (
              <span className="text-[#C9A84C] text-xl shrink-0">✓</span>
            )}
          </div>

          {/* Slots — shown when tomorrow is selected */}
          {selected === 'tomorrow' && (
            <div className="mt-4 grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
              {(['morning', 'afternoon', 'evening'] as Slot[]).map((s) => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); setSlot(s) }}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all text-center leading-tight ${
                    slot === s
                      ? 'bg-[#C9A84C] text-white shadow'
                      : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50'
                  }`}
                >
                  {t(s === 'morning' ? 'slot_morning' : s === 'afternoon' ? 'slot_afternoon' : 'slot_evening')}
                </button>
              ))}
            </div>
          )}
        </button>

        {/* Planification card */}
        <button
          onClick={() => setSelected('scheduled')}
          className={`w-full card text-left transition-all ${
            selected === 'scheduled'
              ? 'border-2 border-[#C9A84C] bg-amber-50'
              : 'border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗓️</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base">{t('urgency_scheduled')}</span>
                <span className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-xs font-bold">
                  {t('urgency_scheduled_badge')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{t('urgency_scheduled_desc')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('urgency_scheduled_detail')}</p>
            </div>
            {selected === 'scheduled' && (
              <span className="text-[#C9A84C] text-xl shrink-0">✓</span>
            )}
          </div>

          {/* Date + time inputs */}
          {selected === 'scheduled' && (
            <div className="mt-4 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  {t('urgency_date_label')}
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  {t('urgency_time_label')}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-4">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={!isConfirmEnabled()}
        >
          {t('urgency_confirm')}
        </button>
      </div>
    </div>
  )
}
