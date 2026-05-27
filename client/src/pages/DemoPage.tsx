import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

// ── Marqueurs carte ──────────────────────────────────────────────────────────
const clientIcon = L.divIcon({
  html: `<div style="background:#C9A84C;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(201,168,76,.5);display:flex;align-items:center;justify-content:center;font-size:18px">📍</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
})
const agentIcon = L.divIcon({
  html: `<div style="background:#10B981;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center;font-size:18px">🚗</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
})

// ── Données mock ─────────────────────────────────────────────────────────────
const CLIENT_POS  = { lat: 48.8698, lng: 2.3078 } // Place de la Madeleine
const AGENT_START = { lat: 48.8535, lng: 2.3494 } // Quartier Latin

const MOCK_INTERVENTION = {
  id: 'demo-001',
  type: 'constat',
  description: 'Mon propriétaire a changé les serrures sans préavis. Besoin urgent d\'un constat d\'huissier pour constater l\'accès bloqué.',
  clientAddress: 'Place de la Madeleine, 75008 Paris',
  clientLat: CLIENT_POS.lat,
  clientLng: CLIENT_POS.lng,
  status: 'en_route',
  etaMinutes: 12,
  createdAt: new Date().toISOString(),
  agent: {
    user: { firstName: 'Sophie', lastName: 'Martin' },
    firm: { name: 'Étude Laurent & Associés' },
    rating: 4.7,
    lat: AGENT_START.lat,
    lng: AGENT_START.lng,
  },
  client: { firstName: 'Jean', lastName: 'Dupont', phone: '+33 6 •• •• •• ••' },
}

const STEPS = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'en_route', label: 'En route' },
  { key: 'arrived',  label: 'Arrivée' },
  { key: 'done',     label: 'Terminée' },
]

const TYPE_LABELS: Record<string, string> = {
  constat: 'Constat', signification: 'Signification', saisie: 'Saisie', autre: 'Autre',
}

// ── Interpolation linéaire lat/lng ───────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ── Vue CLIENT ───────────────────────────────────────────────────────────────
function ClientView() {
  const [eta, setEta] = useState(12)
  const [agentPos, setAgentPos] = useState(AGENT_START)
  const tRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      tRef.current = Math.min(tRef.current + 0.005, 1)
      const t = tRef.current
      setAgentPos({
        lat: lerp(AGENT_START.lat, CLIENT_POS.lat - 0.002, t),
        lng: lerp(AGENT_START.lng, CLIENT_POS.lng + 0.001, t),
      })
      setEta(Math.max(1, Math.round(12 * (1 - t))))
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const currentStep = 1 // en_route

  return (
    <div className="screen">
      {/* Header dégradé */}
      <div className="screen-header-gradient text-white px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">En route</span>
            </div>
            <h1 className="text-xl font-bold leading-tight">Agent en route<br/>vers vous</h1>
          </div>
          <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-3 text-center backdrop-blur-sm">
            <div className="text-4xl font-extrabold leading-none tabular-nums">{eta}</div>
            <div className="text-xs text-white/70 font-medium mt-0.5">min</div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${i < currentStep ? 'text-white' : i === currentStep ? 'text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}
                style={i <= currentStep ? { background: 'linear-gradient(135deg,#C9A84C,#A07828)' } : {}}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-1 flex-1 mx-0.5 rounded transition-all ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 px-0.5">
          {STEPS.map((step, i) => (
            <span key={step.key} className={`text-[10px] font-semibold ${i <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Carte live */}
        <div className="rounded-2xl overflow-hidden" style={{ height: 200 }}>
          <MapContainer center={[CLIENT_POS.lat, CLIENT_POS.lng]} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[CLIENT_POS.lat, CLIENT_POS.lng]} icon={clientIcon}>
              <Popup>📍 Votre position</Popup>
            </Marker>
            <Marker position={[agentPos.lat, agentPos.lng]} icon={agentIcon}>
              <Popup>🚗 Sophie Martin</Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Carte agent */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl shrink-0 font-bold text-primary-700"
            style={{ background: 'linear-gradient(135deg,#F0E0B0,#DFC06A)' }}>
            SM
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">Sophie Martin</div>
            <div className="text-sm text-gray-500">Étude Laurent & Associés</div>
            <div className="text-sm text-yellow-500 mt-0.5">
              {'★'.repeat(5)}<span className="text-gray-400 text-xs ml-1">4.7</span>
            </div>
          </div>
          <button className="w-11 h-11 rounded-xl flex items-center justify-center border border-green-200 bg-green-50">
            <span className="text-lg">📞</span>
          </button>
        </div>

        {/* Adresse */}
        <div className="card">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lieu d'intervention</div>
          <p className="text-gray-700 text-sm">📍 {MOCK_INTERVENTION.clientAddress}</p>
        </div>

        {/* Type */}
        <div className="card">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Type d'acte</div>
          <p className="font-semibold text-gray-900">{TYPE_LABELS[MOCK_INTERVENTION.type]}</p>
        </div>
      </div>
    </div>
  )
}

// ── Payzone badge SVG ────────────────────────────────────────────────────────
function PayzoneBadge() {
  return (
    <svg width="96" height="32" viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="32" rx="6" fill="#D0021B" />
      <rect x="7" y="10" width="11" height="9" rx="1.5" fill="#FFD700" opacity="0.9" />
      <rect x="7" y="14" width="11" height="1.5" fill="#B8960C" opacity="0.7" />
      <rect x="11" y="10" width="1.5" height="9" fill="#B8960C" opacity="0.7" />
      <text x="22" y="21" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11"
        letterSpacing="0.5" fill="white">PAYZONE</text>
    </svg>
  )
}

// ── Vue AGENT ────────────────────────────────────────────────────────────────
function AgentView() {
  const [status, setStatus] = useState<'pending' | 'en_route' | 'arrived' | 'payment' | 'done'>('pending')
  const [payConfirming, setPayConfirming] = useState(false)
  const [agentPos, setAgentPos] = useState(AGENT_START)
  const [eta, setEta] = useState(12)
  const tRef = useRef(0)

  useEffect(() => {
    if (status !== 'en_route') return
    const interval = setInterval(() => {
      tRef.current = Math.min(tRef.current + 0.005, 1)
      const t = tRef.current
      setAgentPos({
        lat: lerp(AGENT_START.lat, CLIENT_POS.lat - 0.002, t),
        lng: lerp(AGENT_START.lng, CLIENT_POS.lng + 0.001, t),
      })
      setEta(Math.max(1, Math.round(12 * (1 - t))))
    }, 300)
    return () => clearInterval(interval)
  }, [status])

  const actions: Record<string, { label: string; next: typeof status; style: string }> = {
    pending:  { label: '✅ Accepter la mission', next: 'en_route', style: 'btn-primary' },
    en_route: { label: '📍 Je suis arrivé',      next: 'arrived',  style: 'btn-primary' },
    arrived:  { label: '✔️ Intervention terminée', next: 'payment', style: 'btn-danger' },
  }

  // ── Écran de paiement ──
  if (status === 'payment') {
    async function handleCash() {
      setPayConfirming(true)
      await new Promise((r) => setTimeout(r, 700))
      setStatus('done')
      setPayConfirming(false)
    }
    return (
      <div className="screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 pt-12 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
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
          {/* Montant */}
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

          {/* Options */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Choisissez un mode de paiement
            </p>

            {/* Carte — DÉSACTIVÉE */}
            <div className="card mb-3 opacity-60 cursor-not-allowed select-none"
              style={{ border: '1.5px solid #e5e7eb' }}>
              <div className="flex items-center gap-4">
                <div className="shrink-0"><PayzoneBadge /></div>
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
              disabled={payConfirming}
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
                  {payConfirming ? '…' : '›'}
                </div>
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed px-1">
            Le montant affiché est indicatif. Une facture officielle vous sera remise par l'étude.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="screen items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto"
          style={{ background: 'linear-gradient(135deg,#D1FAE5,#6EE7B7)' }}>✅</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mission terminée !</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            La mission a été complétée avec succès.<br/>Le client a été notifié.
          </p>
        </div>
        <div className="card w-full text-left space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Récap mission</div>
          <div className="font-semibold text-gray-900">Constat — Jean Dupont</div>
          <div className="text-sm text-gray-500">Place de la Madeleine, 75008 Paris</div>
        </div>
        <button className="btn-success w-full" onClick={() => { setStatus('pending'); tRef.current = 0; setAgentPos(AGENT_START); setEta(12) }}>
          Retour au dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header-gradient text-white px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              {status === 'pending' ? 'Nouvelle demande' : status === 'en_route' ? 'Mission en cours' : 'Sur place'}
            </span>
            <h1 className="text-xl font-bold mt-1">{TYPE_LABELS[MOCK_INTERVENTION.type]}</h1>
          </div>
          {status === 'en_route' && (
            <div className="bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-center">
              <div className="text-2xl font-extrabold tabular-nums">{eta}</div>
              <div className="text-xs text-white/70">min ETA</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Carte */}
        <div className="rounded-2xl overflow-hidden" style={{ height: 180 }}>
          <MapContainer center={[status === 'en_route' ? agentPos.lat : CLIENT_POS.lat, CLIENT_POS.lng]}
            zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[CLIENT_POS.lat, CLIENT_POS.lng]} icon={clientIcon}>
              <Popup>📍 Jean Dupont</Popup>
            </Marker>
            {status === 'en_route' && (
              <Marker position={[agentPos.lat, agentPos.lng]} icon={agentIcon}>
                <Popup>🚗 Votre position</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Infos client */}
        <div className="card space-y-3">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Client</div>
            <div className="font-bold text-gray-900">{MOCK_INTERVENTION.client.firstName} {MOCK_INTERVENTION.client.lastName}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Téléphone</div>
              <div className="text-sm text-gray-700">{MOCK_INTERVENTION.client.phone}</div>
            </div>
            <button className="h-10 px-4 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold text-green-700 flex items-center gap-2">
              📞 Appeler
            </button>
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse</div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-700 text-sm flex-1">{MOCK_INTERVENTION.clientAddress}</p>
            <a href={`https://maps.google.com/?q=${CLIENT_POS.lat},${CLIENT_POS.lng}`}
              target="_blank" rel="noreferrer"
              className="shrink-0 h-9 px-3 bg-primary-50 border border-primary-100 rounded-xl text-xs font-bold text-primary-700 flex items-center gap-1">
              🗺 GPS
            </a>
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Description</div>
          <p className="text-gray-700 text-sm leading-relaxed">{MOCK_INTERVENTION.description}</p>
        </div>
      </div>

      {/* CTA */}
      {actions[status] && (
        <div className="px-5 pb-10 pt-3">
          <button
            className={actions[status].style}
            onClick={() => setStatus(actions[status].next)}
          >
            {actions[status].label}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page DEMO ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'client' | 'agent'>('client')

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(160deg, #080808 0%, #2A1A00 45%, #C9A84C 100%)' }}>
      {/* Barre du haut */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4 shrink-0">
        <div>
          <div className="text-white font-extrabold text-lg tracking-tight">HuissierNow</div>
          <div className="text-white/50 text-xs">Mode démo — données fictives</div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-white/60 text-sm border border-white/20 rounded-xl px-3 py-1.5 bg-white/10 backdrop-blur-sm"
        >
          Quitter →
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-4 shrink-0">
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {[
            { key: 'client', label: '👤 Vue Client', sub: 'Jean Dupont' },
            { key: 'agent',  label: '🚗 Vue Agent',  sub: 'Sophie Martin' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'client' | 'agent')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'text-gray-900 shadow-lg'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={tab === t.key ? { background: 'linear-gradient(135deg,#C9A84C,#A07828)' } : {}}
            >
              <div>{t.label}</div>
              <div className="text-xs font-normal opacity-70 mt-0.5">{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu — cadre téléphone */}
      <div className="flex-1 px-5 pb-6 min-h-0">
        <div className="h-full bg-white rounded-[32px] overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 0 0 2px #2A1A00, 0 0 0 4px #C9A84C44, 0 24px 60px rgba(0,0,0,0.6)' }}>
          {tab === 'client' ? <ClientView /> : <AgentView />}
        </div>
      </div>
    </div>
  )
}
