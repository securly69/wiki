"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { gameLevels } from "@/lib/game-data"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { Loader2, Users, Copy, Check } from "lucide-react"

interface MultiplayerSetupProps {
  onBackToSinglePlayer: () => void
}

export function MultiplayerSetup({ onBackToSinglePlayer }: MultiplayerSetupProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [playerName, setPlayerName] = useState<string>("")
  const [roomId, setRoomId] = useState<string>("")
  const [selectedLevelId, setSelectedLevelId] = useState<string>("easy")
  const [customStart, setCustomStart] = useState<string>("")
  const [customTarget, setCustomTarget] = useState<string>("")
  const [maxPlayers, setMaxPlayers] = useState<number>(4)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  const {
    isConnected,
    gameRoom,
    currentPlayer,
    error,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    clearError
  } = useSocket()

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Missing Player Name",
        description: "Please enter your player name.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    let finalStartArticle: string | null = null
    let finalTargetArticle: string | null = null

    if (selectedLevelId === "custom") {
      if (!customStart || !customTarget) {
        toast({
          title: "Missing Articles",
          description: "Please enter both a custom start and target article.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      finalStartArticle = customStart
      finalTargetArticle = customTarget
    } else if (selectedLevelId === "random") {
      try {
        const randomStartRes = await fetch("/api/wikipedia/random")
        const randomStartData = await randomStartRes.json()
        finalStartArticle = randomStartData.title

        const randomTargetRes = await fetch("/api/wikipedia/random")
        const randomTargetData = await randomTargetRes.json()
        finalTargetArticle = randomTargetData.title

        if (!finalStartArticle || !finalTargetArticle) {
          throw new Error("Failed to fetch random articles.")
        }
      } catch (error) {
        console.error("Error fetching random articles:", error)
        toast({
          title: "Error",
          description: "Failed to fetch random articles. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    } else {
      const level = gameLevels.find((l) => l.id === selectedLevelId)
      if (level) {
        finalStartArticle = level.startArticle
        finalTargetArticle = level.targetArticle
      }
    }

    if (finalStartArticle && finalTargetArticle) {
      try {
        const startCheck = await fetch(`/api/wikipedia/article?title=${encodeURIComponent(finalStartArticle)}`)
        const targetCheck = await fetch(`/api/wikipedia/article?title=${encodeURIComponent(finalTargetArticle)}`)

        if (!startCheck.ok || !targetCheck.ok) {
          throw new Error("One or both articles do not exist.")
        }
        const startData = await startCheck.json()
        const targetData = await targetCheck.json()

        if (startData.error || targetData.error) {
          throw new Error("One or both articles do not exist.")
        }

        createRoom(playerName, finalStartArticle, finalTargetArticle, maxPlayers)
      } catch (error) {
        console.error("Article validation error:", error)
        toast({
          title: "Article Not Found",
          description: "One or both of the specified articles could not be found on Wikipedia. Please check spelling or try different articles.",
          variant: "destructive",
        })
      }
    }
    setIsLoading(false)
  }

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Missing Player Name",
        description: "Please enter your player name.",
        variant: "destructive",
      })
      return
    }

    if (!roomId.trim()) {
      toast({
        title: "Missing Room ID",
        description: "Please enter a room ID to join.",
        variant: "destructive",
      })
      return
    }

    joinRoom(roomId.toUpperCase(), playerName)
  }

  const handleStartGame = () => {
    if (gameRoom) {
      startGame(gameRoom.id)
    }
  }

  const copyRoomId = async () => {
    if (gameRoom) {
      try {
        await navigator.clipboard.writeText(gameRoom.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
          title: "Room ID Copied!",
          description: "Share this ID with your friends to let them join.",
        })
      } catch (err) {
        toast({
          title: "Failed to Copy",
          description: "Please copy the room ID manually.",
          variant: "destructive",
        })
      }
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-center text-red-600">{error}</p>
          <div className="flex gap-2">
            <Button onClick={clearError} variant="outline" className="flex-1">
              Try Again
            </Button>
            <Button onClick={onBackToSinglePlayer} variant="outline" className="flex-1">
              Back to Single Player
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Connecting...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (gameRoom) {
    const isHost = gameRoom.createdBy === currentPlayer?.id
    const canStart = isHost && gameRoom.players.length >= 2 && gameRoom.gameStatus === 'waiting'

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Users className="h-6 w-6" />
            Room {gameRoom.id}
          </CardTitle>
          <CardDescription className="text-center">
            From "{gameRoom.startArticle}" to "{gameRoom.targetArticle}"
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-lg font-mono">
              {gameRoom.id}
            </code>
            <Button
              onClick={copyRoomId}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              Players ({gameRoom.players.length}/{gameRoom.maxPlayers})
            </h3>
            <div className="grid gap-2">
              {gameRoom.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex gap-2">
                    {player.id === gameRoom.createdBy && (
                      <Badge variant="secondary">Host</Badge>
                    )}
                    {player.id === currentPlayer?.id && (
                      <Badge variant="default">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            {canStart && (
              <Button onClick={handleStartGame} className="flex-1">
                Start Game
              </Button>
            )}
            {!canStart && gameRoom.gameStatus === 'waiting' && (
              <div className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                {gameRoom.players.length < 2 
                  ? "Waiting for more players to join..." 
                  : isHost 
                    ? "You can start the game now!" 
                    : "Waiting for host to start the game..."
                }
              </div>
            )}
            <Button onClick={leaveRoom} variant="outline">
              Leave Room
            </Button>
            <Button onClick={onBackToSinglePlayer} variant="outline">
              Single Player
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          Multiplayer Mode
        </CardTitle>
        <CardDescription className="text-center">
          Race against friends to reach the target article first!
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <label htmlFor="player-name" className="text-sm font-medium">
            Your Name
          </label>
          <Input
            id="player-name"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setMode('create')}
            variant={mode === 'create' ? 'default' : 'outline'}
            className="flex-1"
          >
            Create Room
          </Button>
          <Button
            onClick={() => setMode('join')}
            variant={mode === 'join' ? 'default' : 'outline'}
            className="flex-1"
          >
            Join Room
          </Button>
        </div>

        {mode === 'create' && (
          <>
            <div className="grid gap-2">
              <label htmlFor="max-players" className="text-sm font-medium">
                Max Players
              </label>
              <Select value={maxPlayers.toString()} onValueChange={(value) => setMaxPlayers(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="6">6 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="level-select" className="text-sm font-medium">
                Difficulty Level
              </label>
              <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <SelectTrigger id="level-select" className="w-full">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {gameLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom - Enter your own articles</SelectItem>
                  <SelectItem value="random">Random - Surprise me!</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedLevelId === "custom" && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="custom-start" className="text-sm font-medium">
                    Start Article
                  </label>
                  <Input
                    id="custom-start"
                    placeholder="e.g., Dog"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="custom-target" className="text-sm font-medium">
                    Target Article
                  </label>
                  <Input
                    id="custom-target"
                    placeholder="e.g., Wolf"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleCreateRoom} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Room...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </>
        )}

        {mode === 'join' && (
          <>
            <div className="grid gap-2">
              <label htmlFor="room-id" className="text-sm font-medium">
                Room ID
              </label>
              <Input
                id="room-id"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
            </div>

            <Button onClick={handleJoinRoom} className="w-full">
              Join Room
            </Button>
          </>
        )}

        <Button onClick={onBackToSinglePlayer} variant="outline" className="w-full">
          Back to Single Player
        </Button>
      </CardContent>
    </Card>
  )
}
