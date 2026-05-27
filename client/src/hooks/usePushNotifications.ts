import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

// Clé publique VAPID (à remplacer par votre vraie clé)
// Générez avec : npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (!tokens?.accessToken || !VAPID_PUBLIC_KEY) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    ;(async () => {
      try {
        // Enregistrement du service worker
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // Vérifie la permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Récupère ou crée l'abonnement push
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
          })
        }

        // Envoie l'abonnement au backend
        await fetch('/api/users/push-subscription', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}` },
          body:    JSON.stringify(sub.toJSON()),
        })
      } catch (e) {
        console.warn('Push notification setup failed:', e)
      }
    })()
  }, [tokens?.accessToken])
}
