import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

// Icônes SVG inline pour éviter le bug des icônes Leaflet avec Vite
const clientIcon = L.divIcon({
  html: `<div style="background:#C9A84C;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(201,168,76,0.5);display:flex;align-items:center;justify-content:center;font-size:18px">📍</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const agentIcon = L.divIcon({
  html: `<div style="background:#16a34a;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px">🚗</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

interface Props {
  clientLat: number
  clientLng: number
  agentLat?: number
  agentLng?: number
  className?: string
}

function FitBounds({ clientLat, clientLng, agentLat, agentLng }: Props) {
  const map = useMap()
  useEffect(() => {
    if (agentLat && agentLng) {
      const bounds = L.latLngBounds(
        [clientLat, clientLng],
        [agentLat, agentLng]
      )
      map.fitBounds(bounds, { padding: [40, 40] })
    } else {
      map.setView([clientLat, clientLng], 15)
    }
  }, [clientLat, clientLng, agentLat, agentLng, map])
  return null
}

export default function InterventionMap({ clientLat, clientLng, agentLat, agentLng, className = '' }: Props) {
  return (
    <MapContainer
      center={[clientLat, clientLng]}
      zoom={14}
      zoomControl={false}
      className={`w-full rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: 220 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />
      <FitBounds
        clientLat={clientLat} clientLng={clientLng}
        agentLat={agentLat} agentLng={agentLng}
      />
      <Marker position={[clientLat, clientLng]} icon={clientIcon}>
        <Popup>📍 Votre position</Popup>
      </Marker>
      {agentLat && agentLng && (
        <Marker position={[agentLat, agentLng]} icon={agentIcon}>
          <Popup>🚗 Agent en route</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
