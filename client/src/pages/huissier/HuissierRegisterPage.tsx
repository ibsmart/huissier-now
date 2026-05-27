import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function HuissierRegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirm: '',
    firmName: '', siret: '', firmAddress: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleRegister() {
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 8) { setError('Mot de passe trop court (8 min)'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register/huissier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'huissier',
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone, password: form.password,
          firmName: form.firmName, siret: form.siret, firmAddress: form.firmAddress,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur')
      setAuth(data.user, data.tokens)
      navigate('/huissier/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setLoading(false) }
  }

  const isValid = form.firstName && form.lastName && form.email && form.password && form.confirm && form.firmName

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate('/huissier/login')} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <div className="text-4xl mb-4">⚖️</div>
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte huissier</h1>
        <p className="text-gray-500 mt-1">Vous serez le patron de votre étude.</p>
      </div>

      <div className="px-6 flex-1 space-y-4 overflow-y-auto pb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vos informations</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Prénom</label>
            <input className="input" placeholder="Jean" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom</label>
            <input className="input" placeholder="Dupont" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <input type="email" className="input" placeholder="jean@etude-dupont.fr" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
            <input type="password" className="input" placeholder="8 min" value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmation</label>
            <input type="password" className="input" placeholder="••••••••" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Votre étude</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nom de l'étude *</label>
              <input className="input" placeholder="Étude Dupont & Associés" value={form.firmName} onChange={(e) => update('firmName', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">SIRET <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input className="input" placeholder="12345678901234" value={form.siret} onChange={(e) => update('siret', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Adresse de l'étude <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input className="input" placeholder="12 rue de la Paix, Paris" value={form.firmAddress} onChange={(e) => update('firmAddress', e.target.value)} />
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3">
        <button className="btn-primary" onClick={handleRegister} disabled={loading || !isValid}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
        <p className="text-center text-gray-500 text-sm">
          Déjà un compte ? <Link to="/huissier/login" className="text-primary-600 font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
