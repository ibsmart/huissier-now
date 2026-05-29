import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useT } from '../../i18n'
import LangToggle from '../../components/LangToggle'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { tokens, user } = useAuthStore()
  const t = useT()

  const [acceptsExpress, setAcceptsExpress]       = useState(true)
  const [acceptsTomorrow, setAcceptsTomorrow]      = useState(true)
  const [acceptsScheduled, setAcceptsScheduled]   = useState(true)
  const [radiusKm, setRadiusKm]                   = useState(20)
  const [loading, setLoading]                     = useState(false)
  const [saved, setSaved]                         = useState(false)
  const [toastTimeout, setToastTimeout]           = useState<ReturnType<typeof setTimeout> | null>(null)

  // Load current settings from backend on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/huissiers/me/availability', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
          body: JSON.stringify({}),
        })
        // We'll just use defaults from the user profile if available
        if (user?.agentProfile) {
          const p = user.agentProfile
          if (p.acceptsExpress   !== undefined) setAcceptsExpress(p.acceptsExpress)
          if (p.acceptsTomorrow  !== undefined) setAcceptsTomorrow(p.acceptsTomorrow)
          if (p.acceptsScheduled !== undefined) setAcceptsScheduled(p.acceptsScheduled)
          if (p.radiusKm         !== undefined) setRadiusKm(p.radiusKm)
        }
      } catch { /* use defaults */ }
    }
    loadSettings()
  }, []) // eslint-disable-line

  async function handleSave() {
    setLoading(true)
    try {
      await fetch('/api/huissiers/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ acceptsExpress, acceptsTomorrow, acceptsScheduled, radiusKm }),
      })
      setSaved(true)
      if (toastTimeout) clearTimeout(toastTimeout)
      const tid = setTimeout(() => setSaved(false), 3000)
      setToastTimeout(tid)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div className="screen bg-[#080808] text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 relative">
        <LangToggle className="absolute top-4 right-4 !bg-[#1a1a1a] !border-gray-700 !text-white" />
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 mb-6 flex items-center gap-2 min-h-[44px]"
        >
          {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-white">⚙️ {t('settings_title')}</h1>
      </div>

      <div className="px-6 flex-1 overflow-y-auto pb-4 space-y-6">

        {/* Mission types */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t('settings_accepts')}
          </p>
          <div className="space-y-3">

            {/* Express */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-semibold text-white">{t('settings_express')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('settings_express_desc')}</p>
                </div>
              </div>
              <Toggle value={acceptsExpress} onChange={setAcceptsExpress} />
            </div>

            {/* Tomorrow */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-white">{t('settings_tomorrow')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('settings_tomorrow_desc')}</p>
                </div>
              </div>
              <Toggle value={acceptsTomorrow} onChange={setAcceptsTomorrow} />
            </div>

            {/* Scheduled */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">🗓️</span>
                <div>
                  <p className="font-semibold text-white">{t('settings_scheduled')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('settings_scheduled_desc')}</p>
                </div>
              </div>
              <Toggle value={acceptsScheduled} onChange={setAcceptsScheduled} />
            </div>
          </div>
        </div>

        {/* Radius slider */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t('settings_radius')}
          </p>
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 text-sm">10 {t('settings_radius_km')}</span>
              <span className="text-[#C9A84C] font-bold text-lg">
                {radiusKm} {t('settings_radius_km')}
              </span>
              <span className="text-gray-300 text-sm">100 {t('settings_radius_km')}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #C9A84C ${((radiusKm - 10) / 90) * 100}%, #374151 ${((radiusKm - 10) / 90) * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-green-600 text-white rounded-full px-6 py-3 text-sm font-semibold shadow-lg z-50 animate-in slide-in-from-bottom-4">
          {t('settings_saved')}
        </div>
      )}

      {/* Save button */}
      <div className="px-6 pb-10 pt-4">
        <button
          className="w-full min-h-[56px] rounded-2xl font-bold text-base text-black transition-all active:scale-95"
          style={{ background: '#C9A84C' }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? t('loading') : t('save')}
        </button>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-14 h-8 rounded-full transition-colors flex items-center shrink-0 ${
        value ? 'bg-[#C9A84C]' : 'bg-gray-600'
      }`}
    >
      <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform mx-1 ${
        value ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )
}
