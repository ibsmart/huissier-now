import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'

export default function LocationPage() {
  const navigate = useNavigate()
  const { setLocation } = useDraftStore()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [manualAddress, setManualAddress] = useState('')

  useEffect(() => {
    requestLocation()
  }, [])

  async function requestLocation() {
    setStatus('loading')
    if (!navigator.geolocation) {
      setStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        const addr = await reverseGeocode(latitude, longitude)
        setAddress(addr)
        setStatus('success')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  function handleConfirm() {
    if (!coords) return
    setLocation(coords.lat, coords.lng, address)
    navigate('/request/confirm')
  }

  function handleManualSubmit() {
    if (!manualAddress.trim()) return
    // Coordonnées approximatives via Nominatim forward geocoding
    setLocation(0, 0, manualAddress.trim())
    navigate('/request/confirm')
  }

  return (
    <div className="screen">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Votre position</h1>
        <p className="text-gray-500 mt-1">Nous avons besoin de votre position pour trouver un huissier proche.</p>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-6 justify-center">
        {status === 'loading' && (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3 animate-pulse">📍</div>
            <p className="text-gray-600">Récupération de votre position...</p>
          </div>
        )}

        {status === 'success' && coords && (
          <div className="card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Position détectée</div>
                <p className="text-sm text-gray-600 leading-relaxed">{address}</p>
              </div>
            </div>
            <button
              className="text-primary-600 text-sm mt-3 underline"
              onClick={requestLocation}
            >
              Actualiser
            </button>
          </div>
        )}

        {status === 'denied' && (
          <div className="card border-orange-200 bg-orange-50">
            <div className="text-orange-600 font-semibold mb-2">📵 Localisation refusée</div>
            <p className="text-sm text-gray-600 mb-4">
              Autorisez la localisation dans les paramètres de votre navigateur ou saisissez votre adresse.
            </p>
            <input
              className="input"
              placeholder="Entrez votre adresse complète..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4">
        {status === 'success' && (
          <button className="btn-primary" onClick={handleConfirm}>
            Confirmer cette position
          </button>
        )}
        {status === 'denied' && (
          <button className="btn-primary" onClick={handleManualSubmit} disabled={!manualAddress.trim()}>
            Utiliser cette adresse
          </button>
        )}
      </div>
    </div>
  )
}
