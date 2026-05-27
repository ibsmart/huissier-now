import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleRegister() {
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'client',
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la création du compte')
      setAuth(data.user, data.tokens)
      navigate('/request/type')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  const isValid =
    form.firstName && form.lastName && form.email && form.password && form.confirm

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate('/')} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <div className="text-4xl mb-4">✍️</div>
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="text-gray-500 mt-1">Gratuit, en 30 secondes.</p>
      </div>

      <div className="px-6 flex-1 space-y-4 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Prénom</label>
            <input
              className="input"
              placeholder="Jean"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom</label>
            <input
              className="input"
              placeholder="Dupont"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <input
            type="email"
            className="input"
            placeholder="votre@email.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="tel"
            className="input"
            placeholder="+33 6 00 00 00 00"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
          <input
            type="password"
            className="input"
            placeholder="8 caractères minimum"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmer le mot de passe</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3">
        <button
          className="btn-primary"
          onClick={handleRegister}
          disabled={loading || !isValid}
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
        <p className="text-center text-gray-500 text-sm">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-600 font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
