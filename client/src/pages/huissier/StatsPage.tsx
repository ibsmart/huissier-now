import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Stats {
  total: number
  done: number
  active: number
  cancelled: number
  expired: number
  thisMonth: number
  revenueEstimate: number
  avgRating: number | null
  ratingsCount: number
  byType: { type: string; _count: number }[]
}

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

function StatCard({ icon, label, value, sub, highlight }: {
  icon: string; label: string; value: string | number; sub?: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 space-y-1 ${highlight
      ? 'text-white'
      : 'bg-white border border-gray-100'}`}
      style={highlight ? { background: 'linear-gradient(135deg,#2A1A00,#A07828)' } : {}}>
      <div className="text-2xl">{icon}</div>
      <div className={`text-2xl font-extrabold tabular-nums leading-none ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className={`text-xs font-semibold ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
      {sub && <div className={`text-xs ${highlight ? 'text-white/50' : 'text-gray-400'}`}>{sub}</div>}
    </div>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()
  const { tokens } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/huissiers/firm/stats', {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="screen bg-gray-50">
      {/* Header */}
      <div className="screen-header-gradient text-white px-6 pt-12 pb-6">
        <button onClick={() => navigate(-1)} className="text-white/60 mb-4 flex items-center gap-1 text-sm min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-white/60 text-sm mt-0.5">Vue d'ensemble de votre étude</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {loading && (
          <div className="text-center text-gray-400 py-12 animate-pulse">Chargement...</div>
        )}

        {stats && (
          <>
            {/* Grille principale */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="💰" label="Revenus estimés" value={`${stats.revenueEstimate.toLocaleString('fr-FR')} €`} sub="150 € / mission" highlight />
              <StatCard icon="✅" label="Terminées" value={stats.done} sub={`sur ${stats.total} total`} />
              <StatCard icon="📋" label="Ce mois-ci" value={stats.thisMonth} sub="missions terminées" />
              <StatCard icon="🔄" label="En cours" value={stats.active} />
            </div>

            {/* Note moyenne */}
            {stats.avgRating !== null && (
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Note moyenne</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-extrabold text-gray-900">{stats.avgRating}</span>
                      <span className="text-yellow-400 text-xl">
                        {'★'.repeat(Math.round(stats.avgRating))}{'☆'.repeat(5 - Math.round(stats.avgRating))}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{stats.ratingsCount} évaluation{stats.ratingsCount > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-5xl opacity-20">⭐</div>
                </div>
              </div>
            )}

            {/* Par type */}
            {stats.byType.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                  Répartition par type d'acte
                </p>
                <div className="card space-y-3">
                  {stats.byType.map((t) => {
                    const pct = stats.done > 0 ? Math.round((t._count / stats.done) * 100) : 0
                    return (
                      <div key={t.type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{TYPE_LABELS[t.type] ?? t.type}</span>
                          <span className="text-sm font-bold text-gray-900">{t._count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#C9A84C,#A07828)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Annulées / Expirées */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="❌" label="Annulées" value={stats.cancelled} />
              <StatCard icon="⏰" label="Expirées" value={stats.expired} sub="sans réponse" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
