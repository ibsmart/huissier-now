import { Server as SocketIOServer } from 'socket.io'
import { createServer, Server as HTTPServer } from 'http'
import type { Express } from 'express'

let io: SocketIOServer
let httpServer: HTTPServer

export function initServer(app: Express, allowedOrigins: string[]): HTTPServer {
  httpServer = createServer(app)
  io = new SocketIOServer(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    // Le client demande à rejoindre la room d'une intervention
    socket.on('join', (room: string) => socket.join(room))
    socket.on('leave', (room: string) => socket.leave(room))
  })

  return httpServer
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io non initialisé')
  return io
}
