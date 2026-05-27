import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// Singleton socket — une seule connexion par onglet
let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/**
 * S'abonne à un event socket sur une room donnée.
 * Rejoint automatiquement la room et la quitte au unmount.
 */
export function useSocket<T = unknown>(
  room: string | null | undefined,
  event: string,
  handler: (data: T) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!room) return
    const s = getSocket()
    s.emit('join', room)

    const cb = (data: T) => handlerRef.current(data)
    s.on(event, cb)

    return () => {
      s.emit('leave', room)
      s.off(event, cb)
    }
  }, [room, event])
}
