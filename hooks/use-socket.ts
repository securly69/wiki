import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export interface SerializedPlayer {
  id: string
  name: string
  currentArticle: string
  path: string[]
  timeTaken: number
  isFinished: boolean
  finishTime?: number
}

export interface SerializedGameRoom {
  id: string
  players: SerializedPlayer[]
  startArticle: string
  targetArticle: string
  gameStatus: 'waiting' | 'playing' | 'finished'
  startTime?: number
  maxPlayers: number
  createdBy: string
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [gameRoom, setGameRoom] = useState<SerializedGameRoom | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<SerializedPlayer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socket',
      addTrailingSlash: false,
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    socketInstance.on('error', (data: { message: string }) => {
      setError(data.message)
    })

    socketInstance.on('room-created', (data: { roomId: string, gameRoom: SerializedGameRoom }) => {
      setGameRoom(data.gameRoom)
      setCurrentPlayer(data.gameRoom.players.find(p => p.id === socketInstance.id) || null)
    })

    socketInstance.on('room-joined', (data: { gameRoom: SerializedGameRoom }) => {
      setGameRoom(data.gameRoom)
      setCurrentPlayer(data.gameRoom.players.find(p => p.id === socketInstance.id) || null)
    })

    socketInstance.on('room-updated', (data: { gameRoom: SerializedGameRoom }) => {
      setGameRoom(data.gameRoom)
      setCurrentPlayer(data.gameRoom.players.find(p => p.id === socketInstance.id) || null)
    })

    socketInstance.on('game-started', (data: { gameRoom: SerializedGameRoom }) => {
      setGameRoom(data.gameRoom)
    })

    socketInstance.on('player-moved', (data: { playerId: string, articleTitle: string, pathLength: number, timeTaken: number }) => {
      setGameRoom(prev => {
        if (!prev) return prev
        const updatedPlayers = prev.players.map(player => {
          if (player.id === data.playerId) {
            return {
              ...player,
              currentArticle: data.articleTitle,
              timeTaken: data.timeTaken,
              path: [...player.path.slice(0, data.pathLength - 1), data.articleTitle]
            }
          }
          return player
        })
        return { ...prev, players: updatedPlayers }
      })
    })

    socketInstance.on('player-finished', (data: { playerId: string, playerName: string, timeTaken: number, pathLength: number }) => {
      setGameRoom(prev => {
        if (!prev) return prev
        const updatedPlayers = prev.players.map(player => {
          if (player.id === data.playerId) {
            return { ...player, isFinished: true, finishTime: Date.now() }
          }
          return player
        })
        return { ...prev, players: updatedPlayers }
      })
    })

    socketInstance.on('game-finished', (data: { gameRoom: SerializedGameRoom }) => {
      setGameRoom(data.gameRoom)
    })

    socketInstance.on('player-left', (data: { playerId: string }) => {
      setGameRoom(prev => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== data.playerId)
        }
      })
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const createRoom = (playerName: string, startArticle: string, targetArticle: string, maxPlayers: number = 4) => {
    if (socket) {
      setError(null)
      socket.emit('create-room', { playerName, startArticle, targetArticle, maxPlayers })
    }
  }

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      setError(null)
      socket.emit('join-room', { roomId, playerName })
    }
  }

  const startGame = (roomId: string) => {
    if (socket) {
      socket.emit('start-game', { roomId })
    }
  }

  const navigateToArticle = (roomId: string, articleTitle: string) => {
    if (socket) {
      socket.emit('navigate-article', { roomId, articleTitle })
    }
  }

  const leaveRoom = () => {
    setGameRoom(null)
    setCurrentPlayer(null)
    setError(null)
  }

  return {
    socket,
    isConnected,
    gameRoom,
    currentPlayer,
    error,
    createRoom,
    joinRoom,
    startGame,
    navigateToArticle,
    leaveRoom,
    clearError: () => setError(null)
  }
}
