"use client"

import { useState, useEffect, useCallback } from "react"
import { GameSetup } from "@/components/wiki-game/game-setup"
import { GameBoard } from "@/components/wiki-game/game-board"
import { GameOverDialog } from "@/components/wiki-game/game-over-dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export type GameStatus = "idle" | "playing" | "won" | "lost"
export type GameLevel = {
  id: string
  name: string
  description: string
  startArticle: string | null
  targetArticle: string | null
}

export default function WikiQuestPage() {
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle")
  const [startArticle, setStartArticle] = useState<string | null>(null)
  const [targetArticle, setTargetArticle] = useState<string | null>(null)
  const [path, setPath] = useState<string[]>([])
  const [timeTaken, setTimeTaken] = useState<number>(0)
  const { toast } = useToast()

  const handleStartGame = useCallback(
    (selectedStart: string, selectedTarget: string) => {
      setStartArticle(selectedStart)
      setTargetArticle(selectedTarget)
      setPath([selectedStart])
      setTimeTaken(0)
      setGameStatus("playing")
      toast({
        title: "Game Started!",
        description: `Navigate from "${selectedStart}" to "${selectedTarget}".`,
      })
    },
    [toast],
  )

  const handleArticleNavigate = useCallback(
    (articleTitle: string) => {
      setPath((prevPath) => [...prevPath, articleTitle])
      if (articleTitle === targetArticle) {
        setGameStatus("won")
        toast({
          title: "Congratulations!",
          description: `You reached "${targetArticle}" in ${path.length} steps and ${timeTaken} seconds!`,
          variant: "success",
        })
      }
    },
    [targetArticle, path.length, timeTaken, toast],
  )

  const handleGoBack = useCallback(() => {
    setPath((prevPath) => {
      if (prevPath.length > 1) {
        const newPath = prevPath.slice(0, prevPath.length - 1)
        toast({
          title: "Navigated Back",
          description: `You returned to "${newPath[newPath.length - 1]}".`,
        })
        return newPath
      }
      return prevPath
    })
  }, [toast])

  const handleRestartGame = useCallback(() => {
    if (startArticle && targetArticle) {
      setPath([startArticle])
      setTimeTaken(0)
      setGameStatus("playing")
      toast({
        title: "Game Restarted!",
        description: `Back to "${startArticle}".`,
      })
    }
  }, [startArticle, targetArticle, toast])

  const handleNewGame = useCallback(() => {
    setGameStatus("idle")
    setStartArticle(null)
    setTargetArticle(null)
    setPath([])
    setTimeTaken(0)
    toast({
      title: "New Game Initiated",
      description: "Choose your next adventure!",
    })
  }, [toast])

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined
    if (gameStatus === "playing") {
      timerInterval = setInterval(() => {
        setTimeTaken((prevTime) => prevTime + 1)
      }, 1000)
    } else if (timerInterval) {
      clearInterval(timerInterval)
    }
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [gameStatus])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950">
      <main className="w-full max-w-6xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 md:p-8 lg:p-10">
        <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 md:text-5xl">
          WikiQuest
        </h1>

        {gameStatus === "idle" && <GameSetup onStartGame={handleStartGame} />}

        {gameStatus === "playing" && startArticle && targetArticle && (
          <GameBoard
            startArticle={startArticle}
            targetArticle={targetArticle}
            currentArticle={path[path.length - 1]}
            path={path}
            timeTaken={timeTaken}
            onArticleNavigate={handleArticleNavigate}
            onGoBack={handleGoBack}
            onRestartGame={handleRestartGame}
            onNewGame={handleNewGame}
          />
        )}

        {(gameStatus === "won" || gameStatus === "lost") && startArticle && targetArticle && (
          <GameOverDialog
            gameStatus={gameStatus}
            startArticle={startArticle}
            targetArticle={targetArticle}
            path={path}
            timeTaken={timeTaken}
            onPlayAgain={handleRestartGame}
            onNewGame={handleNewGame}
          />
        )}
      </main>
      <Toaster />
    </div>
  )
}
