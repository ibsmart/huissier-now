import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { HuissierAgent } from '../../types'

interface AgentWithUser extends HuissierAgent {
  user: { firstName: string; lastName: string; email: string; phone?: string }
}

export default function ManageAgentsPage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuthStore()
  const [agents, setAgents] = useState<AgentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  async function fetchAgents() {
    setLoading(true)
    try {
      const res = await fetch('/api/huissiers/firm/agents', {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      setAgents(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate('/huissier/dashboard')} className="text-gray-500 mb-4 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes agents</h1>
            <p className="text-sm text-gray-500">{agents.length} assistant{agents.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl min-h-[44px]"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Liste des agents */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading && (
          <div className="text-center text-gray-400 py-12 animate-pulse">Chargement...</div>
        )}

        {!loading && agents.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium text-gray-600 mb-1">Aucun agent pour le moment</p>
            <p className="text-sm">Ajoutez vos clercs pour qu'ils puissent recevoir des missions.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 font-semibold text-sm underline"
            >
              Ajouter le premier agent
            </button>
          </div>
        )}

        {agents.map((agent) => (
          <div key={agent.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl shrink-0">
              🧑‍💼
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">
                {agent.user.firstName} {agent.user.lastName}
              </div>
              <div className="text-sm text-gray-500 truncate">{agent.user.email}</div>
              {agent.user.phone && (
                <div className="text-sm text-gray-400">{agent.user.phone}</div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                agent.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {agent.isAvailable ? '🟢 Dispo' : '⚫ Off'}
              </div>
              <div className="text-xs text-gray-400 mt-1">{agent.radiusKm} km</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal ajout agent */}
      {showForm && (
        <AddAgentModal
          firmId={user?.firmId ?? ''}
          tokens={tokens?.accessToken ?? ''}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchAgents() }}
        />
      )}
    </div>
  )
}

// ── Modal d'ajout d'un agent ─────────────────────────────────────────────────
function AddAgentModal({
  firmId, tokens, onClose, onSuccess
}: {
  firmId: string
  tokens: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', password: '', radiusKm: '20',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Prénom, nom, email et mot de passe sont requis')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens}`,
        },
        body: JSON.stringify({
          role: 'agent',
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          firmId,
          radiusKm: parseInt(form.radiusKm) || 20,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur')
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-10 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Nouvel agent</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <p className="text-sm text-primary-700">
            💡 L'agent recevra ses identifiants pour se connecter sur l'espace professionnel.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Prénom *</label>
            <input className="input" placeholder="Marie" value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom *</label>
            <input className="input" placeholder="Martin" value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
          <input type="email" className="input" placeholder="marie@etude.fr" value={form.email}
            onChange={(e) => update('email', e.target.value)} autoComplete="off" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input type="tel" className="input" placeholder="+33 6 00 00 00 00" value={form.phone}
            onChange={(e) => update('phone', e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Mot de passe provisoire *
          </label>
          <input type="text" className="input font-mono" placeholder="8 caractères minimum"
            value={form.password} onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password" />
          <p className="text-xs text-gray-400 mt-1">L'agent pourra le changer plus tard.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Rayon d'intervention (km)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="5" max="50" step="5"
              className="flex-1 accent-primary-600"
              value={form.radiusKm}
              onChange={(e) => update('radiusKm', e.target.value)}
            />
            <span className="font-bold text-primary-600 w-16 text-right">{form.radiusKm} km</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Création en cours...' : 'Créer le compte agent'}
        </button>
      </div>
    </div>
  )
}
