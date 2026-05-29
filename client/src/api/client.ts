export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options)

  // Réponse vide (204, ou corps absent)
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`)
    return null
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`)
    throw new Error('Réponse invalide du serveur')
  }

  if (!res.ok) throw new Error(data.message ?? `Erreur serveur (${res.status})`)
  return data
}
