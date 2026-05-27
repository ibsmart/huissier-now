import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function DonePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tokens } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [sent, setSent] = useState(false)

  async function sendRating(score: number) {
    setRating(score)
    setSent(true)
    try {
      await fetch(`/api/interventions/${id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ score }),
      })
    } catch {}
  }

  return (
    <div className="screen items-center justify-center bg-green-50">
      <div className="px-6 text-center space-y-6">
        <div className="text-7xl">✅</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Intervention terminée</h1>
          <p className="text-gray-500">Merci d'avoir utilisé HuissierNow.</p>
        </div>

        {!sent ? (
          <div className="card w-full">
            <p className="font-semibold text-gray-700 mb-4">Évaluez l'intervention</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => sendRating(star)}
                  className={`text-4xl transition-transform active:scale-125
                    ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card w-full bg-green-100 border-green-200">
            <p className="text-green-700 font-semibold">Merci pour votre évaluation !</p>
          </div>
        )}

        <button className="btn-primary max-w-xs" onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
