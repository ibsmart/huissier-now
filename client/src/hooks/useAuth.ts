import { useAuthStore } from '../store/authStore'

export function useAuthFetch() {
  const { tokens, clearAuth } = useAuthStore()

  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${tokens?.accessToken ?? ''}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    })
    if (res.status === 401) {
      // Tentative de refresh
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
        })
        if (refreshRes.ok) {
          // Le store sera mis à jour lors du prochain rendu
          return authFetch(url, options)
        }
      } catch {}
      clearAuth()
    }
    return res
  }

  return { authFetch }
}
