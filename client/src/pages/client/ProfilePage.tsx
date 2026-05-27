import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, tokens, setAuth } = useAuthStore()

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    phone:     user?.phone     ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // Mots de passe
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg,    setPwdMsg]    = useState('')
  const [pwdError,  setPwdError]  = useState('')

  useEffect(() => {
    // Rafraîchir depuis l'API
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${tokens?.accessToken}` } })
      .then((r) => r.json())
      .then((data) => {
        setForm({ firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone ?? '' })
      })
      .catch(() => {})
  }, [])

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/users/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body:    JSON.stringify({ ...form, phone: form.phone || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur')
      // Mettre à jour le store local
      if (user && tokens) setAuth({ ...user, ...data }, tokens)
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange() {
    setPwdError('')
    setPwdMsg('')
    if (pwd.next !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return }
    if (pwd.next.length < 8)      { setPwdError('8 caractères minimum'); return }
    setPwdSaving(true)
    try {
      const res = await fetch('/api/users/me/password', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body:    JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erreur')
      setPwdMsg('Mot de passe mis à jour ✓')
      setPwd({ current: '', next: '', confirm: '' })
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-400 mb-3 flex items-center gap-1 text-sm min-h-[44px]">
          ← Retour
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-700 shrink-0"
            style={{ background: 'linear-gradient(135deg,#F0E0B0,#DFC06A)' }}>
            {(user?.firstName?.[0] ?? '?').toUpperCase()}{(user?.lastName?.[0] ?? '').toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
              {user?.role === 'client' ? '👤 Client' : user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Infos personnelles */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Informations personnelles
          </p>
          <div className="card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Prénom</label>
                <input className="input text-sm" value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nom</label>
                <input className="input text-sm" value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
              <input type="email" className="input text-sm" value={form.email}
                onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input type="tel" className="input text-sm" placeholder="+33 6 00 00 00 00"
                value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <p className="text-green-700 text-sm font-medium">✓ Profil mis à jour</p>
              </div>
            )}

            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>

        {/* Changer le mot de passe */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Changer le mot de passe
          </p>
          <div className="card space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Mot de passe actuel</label>
              <input type="password" className="input text-sm" value={pwd.current}
                onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nouveau mot de passe</label>
              <input type="password" className="input text-sm" placeholder="8 caractères minimum"
                value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Confirmer</label>
              <input type="password" className="input text-sm" value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
            </div>

            {pwdError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <p className="text-red-600 text-sm">{pwdError}</p>
              </div>
            )}
            {pwdMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <p className="text-green-700 text-sm font-medium">{pwdMsg}</p>
              </div>
            )}

            <button className="btn-primary" onClick={handlePasswordChange} disabled={pwdSaving}>
              {pwdSaving ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
