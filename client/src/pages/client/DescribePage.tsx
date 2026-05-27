import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'

export default function DescribePage() {
  const navigate = useNavigate()
  const { draft, setDescription } = useDraftStore()
  const [text, setText] = useState(draft.description ?? '')

  function handleNext() {
    if (!text.trim()) return
    setDescription(text.trim())
    navigate('/request/location')
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Décrivez la situation</h1>
        <p className="text-gray-500 mt-1">Soyez précis pour aider l'huissier à intervenir efficacement.</p>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-4">
        <textarea
          className="textarea h-48"
          placeholder="Ex : Je suis locataire et mon propriétaire a changé les serrures sans préavis. J'ai besoin d'un constat d'huissier..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <div className="text-right text-sm text-gray-400">{text.length}/1000</div>
      </div>

      <div className="px-6 pb-10 pt-4">
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!text.trim()}
        >
          Continuer
        </button>
      </div>
    </div>
  )
}
