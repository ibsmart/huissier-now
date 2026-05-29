import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import type { InterventionType } from '../../types'

const MAIN_TYPES: { value: InterventionType; label: string; description: string; icon: string }[] = [
  { value: 'constat',       label: 'Constat',        description: "Constat d'huissier, état des lieux, sinistre, numérique…", icon: '📋' },
  { value: 'signification', label: 'Signification',  description: "Signification d'actes, assignation, mise en demeure",      icon: '📨' },
  { value: 'saisie',        label: 'Saisie',         description: 'Saisie mobilière, saisie-vente, saisie conservatoire',     icon: '🔒' },
  { value: 'autre',         label: 'Autre',          description: 'Autre type de demande ou besoin spécifique',               icon: '❓' },
]

const CONSTAT_SUBTYPES = [
  { value: 'etat_lieux',   label: 'État des lieux',      icon: '🏠', description: 'Entrée / sortie locataire' },
  { value: 'degats',       label: 'Dégâts / Sinistre',   icon: '💧', description: 'Dégâts des eaux, incendie, catastrophe' },
  { value: 'nuisances',    label: 'Nuisances',            icon: '🔊', description: 'Sonores, olfactives, trouble de voisinage' },
  { value: 'travaux',      label: 'Travaux / Dommages',  icon: '🏗️', description: 'Malfaçon, dommages causés par voisin' },
  { value: 'numerique',    label: 'Numérique',            icon: '💻', description: 'Internet, réseaux sociaux, email' },
  { value: 'accident',     label: 'Accident',             icon: '🚗', description: 'Voirie, véhicule, dommage corporel' },
  { value: 'livraison',    label: 'Livraison',            icon: '📦', description: 'Colis endommagé, mauvaise livraison' },
  { value: 'autre_constat',label: 'Autre constat',        icon: '📋', description: 'Autre type de constat d\'huissier' },
]

export default function InterventionTypePage() {
  const navigate = useNavigate()
  const { draft, setType, setSubType } = useDraftStore()
  const [selectedType, setSelectedType] = useState<InterventionType | null>(draft.type ?? null)
  const [selectedSub, setSelectedSub]   = useState<string | null>(draft.subType ?? null)

  function handleTypeClick(type: InterventionType) {
    setSelectedType(type)
    setSelectedSub(null)
    setType(type)
    if (type !== 'constat') {
      setSubType('')
      navigate('/request/describe')
    }
  }

  function handleContinue() {
    if (!selectedSub) return
    setSubType(selectedSub)
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

      <div className="px-6 pb-4 space-y-3 flex-1 overflow-y-auto">
        {MAIN_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => handleTypeClick(type.value)}
            className={`w-full card text-left flex items-center gap-4 min-h-[72px] transition-all
              ${selectedType === type.value
                ? 'border-2 border-primary-500 bg-primary-50'
                : 'border border-gray-200'}`}
          >
            <span className="text-3xl shrink-0">{type.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{type.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{type.description}</div>
            </div>
            {selectedType === type.value && type.value !== 'constat' && (
              <span className="ml-auto text-primary-500 text-lg">✓</span>
            )}
          </button>
        ))}

        {/* Sous-types pour Constat */}
        {selectedType === 'constat' && (
          <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Quel type de constat ?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONSTAT_SUBTYPES.map((sub) => (
                <button
                  key={sub.value}
                  onClick={() => setSelectedSub(sub.value)}
                  className={`card text-left p-3 flex flex-col gap-1 transition-all min-h-[80px]
                    ${selectedSub === sub.value
                      ? 'border-2 border-primary-500 bg-primary-50'
                      : 'border border-gray-200'}`}
                >
                  <span className="text-2xl">{sub.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm leading-tight">{sub.label}</span>
                  <span className="text-xs text-gray-400 leading-tight">{sub.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bouton Continuer (uniquement pour Constat avec sous-type) */}
      {selectedType === 'constat' && (
        <div className="px-6 pb-10 pt-3">
          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={!selectedSub}
          >
            Continuer →
          </button>
        </div>
      )}
    </div>
  )
}
