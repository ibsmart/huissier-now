import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { useT } from '../../i18n'
import LangToggle from '../../components/LangToggle'
import type { InterventionType } from '../../types'

const MAIN_TYPE_VALUES: { value: InterventionType; icon: string; labelKey: 'type_constat' | 'type_signification' | 'type_saisie' | 'type_autre'; descKey: 'type_constat_desc' | 'type_signification_desc' | 'type_saisie_desc' | 'type_autre_desc' }[] = [
  { value: 'constat',       icon: '📋', labelKey: 'type_constat',       descKey: 'type_constat_desc'       },
  { value: 'signification', icon: '📨', labelKey: 'type_signification', descKey: 'type_signification_desc' },
  { value: 'saisie',        icon: '🔒', labelKey: 'type_saisie',        descKey: 'type_saisie_desc'        },
  { value: 'autre',         icon: '❓', labelKey: 'type_autre',         descKey: 'type_autre_desc'         },
]

type SubtypeKey = {
  value: string
  icon: string
  labelKey: 'sub_etat_lieux' | 'sub_degats' | 'sub_nuisances' | 'sub_travaux' | 'sub_numerique' | 'sub_accident' | 'sub_livraison' | 'sub_autre_constat'
  descKey: 'sub_etat_lieux_desc' | 'sub_degats_desc' | 'sub_nuisances_desc' | 'sub_travaux_desc' | 'sub_numerique_desc' | 'sub_accident_desc' | 'sub_livraison_desc' | 'sub_autre_constat_desc'
}

const CONSTAT_SUBTYPES: SubtypeKey[] = [
  { value: 'etat_lieux',    icon: '🏠', labelKey: 'sub_etat_lieux',    descKey: 'sub_etat_lieux_desc'    },
  { value: 'degats',        icon: '💧', labelKey: 'sub_degats',        descKey: 'sub_degats_desc'        },
  { value: 'nuisances',     icon: '🔊', labelKey: 'sub_nuisances',     descKey: 'sub_nuisances_desc'     },
  { value: 'travaux',       icon: '🏗️', labelKey: 'sub_travaux',       descKey: 'sub_travaux_desc'       },
  { value: 'numerique',     icon: '💻', labelKey: 'sub_numerique',     descKey: 'sub_numerique_desc'     },
  { value: 'accident',      icon: '🚗', labelKey: 'sub_accident',      descKey: 'sub_accident_desc'      },
  { value: 'livraison',     icon: '📦', labelKey: 'sub_livraison',     descKey: 'sub_livraison_desc'     },
  { value: 'autre_constat', icon: '📋', labelKey: 'sub_autre_constat', descKey: 'sub_autre_constat_desc' },
]

export default function InterventionTypePage() {
  const navigate = useNavigate()
  const { draft, setType, setSubType } = useDraftStore()
  const t = useT()
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
      <div className="px-6 pt-12 pb-4 relative">
        <LangToggle className="absolute top-4 right-4" />
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('type_title')}</h1>
        <p className="text-gray-500 mt-1">{t('type_subtitle')}</p>
      </div>

      <div className="px-6 pb-4 space-y-3 flex-1 overflow-y-auto">
        {MAIN_TYPE_VALUES.map((type) => (
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
              <div className="font-semibold text-gray-900">{t(type.labelKey)}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{t(type.descKey)}</div>
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
              {t('subtype_question')}
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
                  <span className="font-semibold text-gray-900 text-sm leading-tight">{t(sub.labelKey)}</span>
                  <span className="text-xs text-gray-400 leading-tight">{t(sub.descKey)}</span>
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
            {t('continue')}
          </button>
        </div>
      )}
    </div>
  )
}
