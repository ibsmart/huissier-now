import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function HuissierLoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur de connexion')
      if (data.user.role !== 'huissier' && data.user.role !== 'agent')
        throw new Error("Ce compte n'est pas un compte huissier ou agent")
      setAuth(data.user, data.tokens)
      navigate('/huissier/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate('/')} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <div className="text-4xl mb-4">⚖️</div>
        <h1 className="text-2xl font-bold text-gray-900">Espace professionnel</h1>
        <p className="text-gray-500 mt-1">Huissiers et agents — connectez-vous.</p>
      </div>

      <div className="px-6 flex-1 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <input
            type="email"
            className="input"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="text-center text-gray-500 text-sm">
          Nouveau cabinet ?{' '}
          <Link to="/huissier/register" className="text-primary-600 font-semibold">
            Créer un compte huissier
          </Link>
        </p>
      </div>
    </div>
  )
}
