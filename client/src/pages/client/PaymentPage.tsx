import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ── Payzone badge SVG (reproduction de la marque) ────────────────────────────
function PayzoneBadge() {
  return (
    <svg width="96" height="32" viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="32" rx="6" fill="#D0021B" />
      {/* Puce carte */}
      <rect x="7" y="10" width="11" height="9" rx="1.5" fill="#FFD700" opacity="0.9" />
      <rect x="7" y="14" width="11" height="1.5" fill="#B8960C" opacity="0.7" />
      <rect x="11" y="10" width="1.5" height="9" fill="#B8960C" opacity="0.7" />
      {/* Texte PAYZONE */}
      <text x="22" y="21" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11"
        letterSpacing="0.5" fill="white">PAYZONE</text>
    </svg>
  )
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  async function handleCash() {
    setConfirming(true)
    // Petite pause pour feedback visuel
    await new Promise((r) => setTimeout(r, 600))
    navigate(`/done/${id}`, { replace: true })
  }

  return (
    <div className="screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-xl shrink-0">
            💳
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Règlement</h1>
            <p className="text-sm text-gray-400">Intervention terminée</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Récap montant */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2A1A00 0%, #111 100%)' }}>
          <div className="px-5 py-5">
            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Montant à régler
            </div>
            <div className="text-4xl font-extrabold text-white tracking-tight">
              150 <span className="text-2xl font-bold text-white/70">€</span>
            </div>
            <div className="text-white/50 text-sm mt-2">Constat d'huissier · Acte terrain</div>
          </div>
          <div className="bg-white/10 px-5 py-3 flex items-center gap-2 border-t border-white/10">
            <span className="text-white/60 text-xs">✔</span>
            <span className="text-white/70 text-xs">Mission complétée avec succès</span>
          </div>
        </div>

        {/* Mode de paiement */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Choisissez un mode de paiement
          </p>

          {/* Carte bancaire — DÉSACTIVÉE */}
          <div className="card mb-3 opacity-60 cursor-not-allowed select-none"
            style={{ border: '1.5px solid #e5e7eb' }}>
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <PayzoneBadge />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-500 flex items-center gap-2">
                  Paiement par carte
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                    🔒 BIENTÔT
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Visa, Mastercard, CB — Terminal Payzone
                </div>
              </div>
            </div>
          </div>

          {/* Espèces — ACTIF */}
          <button
            className="w-full card text-left active:scale-[0.98] transition-transform"
            style={{ border: '1.5px solid #DFC06A', background: '#FAF6EC' }}
            onClick={handleCash}
            disabled={confirming}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'linear-gradient(135deg,#C9A84C,#A07828)' }}>
                💵
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  Espèces
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ DISPONIBLE
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Remettez 150 € en liquide à l'agent
                </div>
              </div>
              <div className="shrink-0 text-primary-600 font-bold text-lg">
                {confirming ? '…' : '›'}
              </div>
            </div>
          </button>
        </div>

        {/* Note légale */}
        <div className="px-1">
          <p className="text-xs text-gray-400 leading-relaxed">
            Le montant affiché est indicatif et peut varier selon la complexité de l'acte.
            Une facture officielle vous sera remise par l'étude.
          </p>
        </div>
      </div>
    </div>
  )
}
