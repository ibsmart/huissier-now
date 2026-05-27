// Service Worker HuissierNow — Notifications Push PWA

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch {}

  const title = data.title ?? 'HuissierNow'
  const options = {
    body:    data.body ?? '',
    icon:    '/icon-192.png',
    badge:   '/icon-72.png',
    tag:     data.tag ?? 'huissiernow',
    vibrate: [200, 100, 200],
    data:    { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
