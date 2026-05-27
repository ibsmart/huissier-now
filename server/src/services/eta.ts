function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function estimateETA(
  huissierLat: number, huissierLng: number,
  clientLat: number, clientLng: number
): number {
  const distanceKm = haversineKm(huissierLat, huissierLng, clientLat, clientLng)
  const hour = new Date().getHours()
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
  const speed = distanceKm < 5 ? 20 : distanceKm < 15 ? 35 : 60
  const raw = (distanceKm / speed) * 60
  return Math.max(Math.round(raw * (isPeakHour ? 1.2 : 1.0)), 5)
}
