import { useAuthStore } from '../store/authStore'

// Évite les appels de refresh simultanés (un seul à la fois)
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { tokens, setTokens, clearAuth } = useAuthStore.getState()
  if (!tokens?.refreshToken) {
    clearAuth()
    throw new Error('Session expirée, veuillez vous reconnecter')
  }

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  })

  const text = await res.text()
  if (!text || !res.ok) {
    clearAuth()
    throw new Error('Session expirée, veuillez vous reconnecter')
  }

  const data = JSON.parse(text)
  setTokens(data.tokens)
  return data.tokens.accessToken
}

function parseResponse(text: string, status: number): any {
  if (!text) {
    if (status >= 400) throw new Error(`Erreur serveur (${status})`)
    return null
  }
  let data: any
  try { data = JSON.parse(text) } catch {
    if (status >= 400) throw new Error(`Erreur serveur (${status})`)
    throw new Error('Réponse invalide du serveur')
  }
  if (status >= 400) throw new Error(data.message ?? `Erreur serveur (${status})`)
  return data
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options)

  // Token expiré → refresh automatique + retry
  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
    }

    const newToken = await refreshPromise

    // Retry avec le nouveau token
    const retryOptions: RequestInit = {
      ...options,
      headers: {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      },
    }
    const retryRes = await fetch(url, retryOptions)
    return parseResponse(await retryRes.text(), retryRes.status)
  }

  return parseResponse(await res.text(), res.status)
}
