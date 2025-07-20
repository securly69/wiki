import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export interface Player {
  id: string
  name: string
  currentArticle: string
  path: string[]
  timeTaken: number
  isFinished: boolean
  finishTime?: number
}

export interface GameRoom {
  id: string
  players: Map<string, Player>
  startArticle: string
  targetArticle: string
  gameStatus: 'waiting' | 'playing' | 'finished'
  startTime?: number
  maxPlayers: number
  createdBy: string
}

export const gameRooms = new Map<string, GameRoom>()

export function initializeSocketIO(server: NetServer): ServerIO {
  const io = new ServerIO(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('create-room', (data: { playerName: string, startArticle: string, targetArticle: string, maxPlayers: number }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const gameRoom: GameRoom = {
        id: roomId,
        players: new Map(),
        startArticle: data.startArticle,
        targetArticle: data.targetArticle,
        gameStatus: 'waiting',
        maxPlayers: data.maxPlayers,
        createdBy: socket.id
      }

      const player: Player = {
        id: socket.id,
        name: data.playerName,
        currentArticle: data.startArticle,
        path: [data.startArticle],
        timeTaken: 0,
        isFinished: false
      }

      gameRoom.players.set(socket.id, player)
      gameRooms.set(roomId, gameRoom)
      
      socket.join(roomId)
      socket.emit('room-created', { roomId, gameRoom: serializeGameRoom(gameRoom) })
      socket.emit('room-updated', { gameRoom: serializeGameRoom(gameRoom) })
    })

    socket.on('join-room', (data: { roomId: string, playerName: string }) => {
      const gameRoom = gameRooms.get(data.roomId)
      
      if (!gameRoom) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (gameRoom.players.size >= gameRoom.maxPlayers) {
        socket.emit('error', { message: 'Room is full' })
        return
      }

      if (gameRoom.gameStatus !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' })
        return
      }

      const player: Player = {
        id: socket.id,
        name: data.playerName,
        currentArticle: gameRoom.startArticle,
        path: [gameRoom.startArticle],
        timeTaken: 0,
        isFinished: false
      }

      gameRoom.players.set(socket.id, player)
      socket.join(data.roomId)
      
      socket.emit('room-joined', { gameRoom: serializeGameRoom(gameRoom) })
      io.to(data.roomId).emit('room-updated', { gameRoom: serializeGameRoom(gameRoom) })
    })

    socket.on('start-game', (data: { roomId: string }) => {
      const gameRoom = gameRooms.get(data.roomId)
      
      if (!gameRoom || gameRoom.createdBy !== socket.id) {
        socket.emit('error', { message: 'Not authorized to start game' })
        return
      }

      gameRoom.gameStatus = 'playing'
      gameRoom.startTime = Date.now()
      
      io.to(data.roomId).emit('game-started', { gameRoom: serializeGameRoom(gameRoom) })
    })

    socket.on('navigate-article', (data: { roomId: string, articleTitle: string }) => {
      const gameRoom = gameRooms.get(data.roomId)
      const player = gameRoom?.players.get(socket.id)
      
      if (!gameRoom || !player || gameRoom.gameStatus !== 'playing') {
        return
      }

      player.currentArticle = data.articleTitle
      player.path.push(data.articleTitle)
      player.timeTaken = gameRoom.startTime ? Math.floor((Date.now() - gameRoom.startTime) / 1000) : 0

      if (data.articleTitle === gameRoom.targetArticle && !player.isFinished) {
        player.isFinished = true
        player.finishTime = Date.now()
        
        io.to(data.roomId).emit('player-finished', { 
          playerId: socket.id, 
          playerName: player.name,
          timeTaken: player.timeTaken,
          pathLength: player.path.length
        })

        // Check if all players finished
        const allFinished = Array.from(gameRoom.players.values()).every(p => p.isFinished)
        if (allFinished) {
          gameRoom.gameStatus = 'finished'
          io.to(data.roomId).emit('game-finished', { gameRoom: serializeGameRoom(gameRoom) })
        }
      }

      io.to(data.roomId).emit('player-moved', { 
        playerId: socket.id, 
        articleTitle: data.articleTitle,
        pathLength: player.path.length,
        timeTaken: player.timeTaken
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      // Remove player from all rooms
      for (const [roomId, gameRoom] of gameRooms.entries()) {
        if (gameRoom.players.has(socket.id)) {
          gameRoom.players.delete(socket.id)
          
          if (gameRoom.players.size === 0) {
            gameRooms.delete(roomId)
          } else {
            io.to(roomId).emit('player-left', { playerId: socket.id })
            io.to(roomId).emit('room-updated', { gameRoom: serializeGameRoom(gameRoom) })
          }
        }
      }
    })
  })

  return io
}

function serializeGameRoom(gameRoom: GameRoom) {
  return {
    ...gameRoom,
    players: Array.from(gameRoom.players.entries()).map(([id, player]) => ({ ...player, id }))
  }
}
