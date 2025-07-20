"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Trophy, Users, Clock } from "lucide-react"
import { GameControls } from "@/components/wiki-game/game-controls"
import { useToast } from "@/hooks/use-toast"
import { useSocket, SerializedGameRoom, SerializedPlayer } from "@/hooks/use-socket"

interface MultiplayerGameBoardProps {
  gameRoom: SerializedGameRoom
  currentPlayer: SerializedPlayer
  onLeaveGame: () => void
}

export function MultiplayerGameBoard({ gameRoom, currentPlayer, onLeaveGame }: MultiplayerGameBoardProps) {
  const [articleContent, setArticleContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [gameTime, setGameTime] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { navigateToArticle } = useSocket()

  const fetchArticle = useCallback(
    async (title: string) => {
      setIsLoading(true)
      setArticleContent("")
      try {
        const response = await fetch(`/api/wikipedia/article?title=${encodeURIComponent(title)}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        setArticleContent(data.html)
      } catch (error) {
        console.error("Failed to fetch article:", error)
        setArticleContent(
          `<p class="text-red-500">Error loading article: ${
            (error as Error).message
          }. Please try navigating back or starting a new game.</p>`,
        )
        toast({
          title: "Error Loading Article",
          description: `Could not load "${title}". ${
            (error as Error).message
          }. You might need to go back or start a new game.`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    fetchArticle(currentPlayer.currentArticle)
  }, [currentPlayer.currentArticle, fetchArticle])

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined
    if (gameRoom.gameStatus === "playing" && gameRoom.startTime) {
      timerInterval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameRoom.startTime!) / 1000))
      }, 1000)
    } else if (timerInterval) {
      clearInterval(timerInterval)
    }
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [gameRoom.gameStatus, gameRoom.startTime])

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === "A" && target.getAttribute("href")) {
        const href = target.getAttribute("href")!
        if (href.startsWith("/wiki/")) {
          const articleTitle = decodeURIComponent(href.substring(6)).replace(/_/g, " ")
          if (
            !articleTitle.includes(":") &&
            !articleTitle.startsWith("File:") &&
            !articleTitle.startsWith("Category:") &&
            !articleTitle.startsWith("Portal:") &&
            !articleTitle.startsWith("Template:") &&
            !articleTitle.startsWith("Special:") &&
            !articleTitle.startsWith("Wikipedia:") &&
            !articleTitle.startsWith("Help:") &&
            !articleTitle.startsWith("Talk:")
          ) {
            event.preventDefault()
            navigateToArticle(gameRoom.id, articleTitle)
          }
        }
      }
    }

    const currentContentRef = contentRef.current
    if (currentContentRef) {
      currentContentRef.addEventListener("click", handleLinkClick)
    }

    return () => {
      if (currentContentRef) {
        currentContentRef.removeEventListener("click", handleLinkClick)
      }
    }
  }, [navigateToArticle, gameRoom.id])

  const sortedPlayers = [...gameRoom.players].sort((a, b) => {
    if (a.isFinished && !b.isFinished) return -1
    if (!a.isFinished && b.isFinished) return 1
    if (a.isFinished && b.isFinished) {
      return (a.finishTime || 0) - (b.finishTime || 0)
    }
    return a.path.length - b.path.length
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPlayerRank = (player: SerializedPlayer) => {
    const finishedPlayers = gameRoom.players.filter(p => p.isFinished)
    if (!player.isFinished) return null
    
    const sortedFinished = finishedPlayers.sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0))
    return sortedFinished.findIndex(p => p.id === player.id) + 1
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Room {gameRoom.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(gameTime)}</span>
          </div>
        </div>

        <GameControls
          currentArticle={currentPlayer.currentArticle}
          targetArticle={gameRoom.targetArticle}
          timeTaken={currentPlayer.timeTaken}
          pathLength={currentPlayer.path.length}
          onGoBack={() => {}} // Disabled in multiplayer
          onRestartGame={() => {}} // Disabled in multiplayer
          onNewGame={onLeaveGame}
          canGoBack={false} // Disabled in multiplayer
        />

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="sr-only">Loading article...</span>
              </div>
            ) : (
              <div
                ref={contentRef}
                className="prose prose-sm max-w-none dark:prose-invert md:prose-base lg:prose-lg [&_a]:text-blue-600 [&_a]:underline [&_a]:transition-colors [&_a]:duration-200 hover:[&_a]:text-blue-800 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-200 [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 dark:[&_table]:border-gray-700 [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-700 [&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-700"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </h3>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => {
                const rank = getPlayerRank(player)
                const isCurrentPlayer = player.id === currentPlayer.id
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      isCurrentPlayer 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {player.isFinished && rank && (
                          <Badge variant={rank === 1 ? "default" : "secondary"} className="text-xs">
                            #{rank}
                          </Badge>
                        )}
                        <span className={`font-medium ${isCurrentPlayer ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                          {player.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                      </div>
                      {player.isFinished && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-mono">
                        {player.path.length} steps
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {formatTime(player.timeTaken)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-lg font-semibold">Your Progress</h3>
            <Progress 
              value={Math.min(100, (currentPlayer.path.length / 10) * 100)} 
              className="w-full mb-2" 
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Steps: {currentPlayer.path.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-lg font-semibold">Your Path</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {currentPlayer.path.map((article, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {index + 1}.
                  </span>
                  <span className={index === currentPlayer.path.length - 1 ? 'font-semibold' : ''}>
                    {article}
                  </span>
                  {article === gameRoom.targetArticle && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {gameRoom.gameStatus === 'finished' && (
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-lg font-semibold text-center">Game Finished!</h3>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {currentPlayer.isFinished 
                  ? `You finished in ${getPlayerRank(currentPlayer)} place!`
                  : "Better luck next time!"
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
