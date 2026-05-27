import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const steps = [
  { icon: '📍', text: 'Partagez votre position' },
  { icon: '📝', text: 'Décrivez votre besoin' },
  { icon: '🚗', text: 'Un agent intervient' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuthStore()
  const isLoggedIn = !!tokens?.accessToken && user?.role === 'client'

  return (
    <div className="screen text-white" style={{ background: 'linear-gradient(160deg, #080808 0%, #2A1A00 45%, #C9A84C 100%)' }}>
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 gap-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <h1 className="text-3xl font-bold mb-3">HuissierNow</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Un commissaire de justice disponible près de vous en quelques minutes.
          </p>
        </div>

        <div className="w-full space-y-3">
          {steps.map((step) => (
            <div key={step.text}
              className="flex items-center gap-3 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="text-2xl">{step.icon}</span>
              <span className="font-medium">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button
          className="btn-primary"
          style={{ background: 'white', color: '#A07828', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          onClick={() => navigate(isLoggedIn ? '/request/type' : '/login')}
        >
          Lancer une demande
        </button>
        {!isLoggedIn && (
          <button
            className="btn-secondary"
            style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
            onClick={() => navigate('/register')}
          >
            Créer un compte
          </button>
        )}
        {isLoggedIn && (
          <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 border border-white/15">
            <div>
              <p className="text-white/80 text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/40 text-xs">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-white/70 border border-white/20 rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors"
              >
                📋 Historique
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="text-xs text-white/70 border border-white/20 rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors"
              >
                ⚙️ Profil
              </button>
            </div>
          </div>
        )}
        <button
          className="flex items-center justify-center gap-2 text-white/50 text-sm w-full text-center py-2 hover:text-white/80 transition-colors"
          onClick={() => navigate('/demo')}
        >
          ▶ Voir la démo interactive
        </button>
        <button className="text-white/30 text-xs w-full text-center py-1" onClick={() => navigate('/huissier/login')}>
          Espace professionnel →
        </button>
      </div>
    </div>
  )
}
