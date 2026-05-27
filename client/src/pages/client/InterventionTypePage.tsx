import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import type { InterventionType } from '../../types'

const TYPES: { value: InterventionType; label: string; description: string; icon: string }[] = [
  { value: 'constat', label: 'Constat', description: "Constat d'huissier, état des lieux, constat amiable", icon: '📋' },
  { value: 'signification', label: 'Signification', description: "Signification d'actes, assignation, mise en demeure", icon: '📨' },
  { value: 'saisie', label: 'Saisie', description: 'Saisie mobilière, saisie-vente, saisie conservatoire', icon: '🔒' },
  { value: 'autre', label: 'Autre', description: 'Autre type de demande ou besoin spécifique', icon: '❓' },
]

export default function InterventionTypePage() {
  const navigate = useNavigate()
  const { draft, setType } = useDraftStore()

  function handleSelect(type: InterventionType) {
    setType(type)
    navigate('/request/describe')
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Type d'intervention</h1>
        <p className="text-gray-500 mt-1">Quel type d'intervention souhaitez-vous ?</p>
      </div>

      <div className="px-6 pb-10 space-y-3 flex-1">
        {TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => handleSelect(type.value)}
            className={`w-full card text-left flex items-center gap-4 min-h-[80px] transition-all
              ${draft.type === type.value ? 'border-primary-500 border-2 bg-primary-50' : ''}`}
          >
            <span className="text-3xl">{type.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{type.label}</div>
              <div className="text-sm text-gray-500 mt-0.5">{type.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
