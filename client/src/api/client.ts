export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur serveur')
  return data
}
