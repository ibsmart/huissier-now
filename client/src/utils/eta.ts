export function estimateETA(distanceKm: number): number {
  const hour = new Date().getHours()
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)

  const speed = distanceKm < 5 ? 20 : distanceKm < 15 ? 35 : 60
  const rawMinutes = (distanceKm / speed) * 60
  const eta = Math.round(rawMinutes * (isPeakHour ? 1.2 : 1.0))

  return Math.max(eta, 5)
}

export function formatETA(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}
