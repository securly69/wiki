"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Home, Timer, Link, Target } from "lucide-react"

interface GameControlsProps {
  currentArticle: string
  targetArticle: string
  timeTaken: number
  pathLength: number
  onGoBack: () => void
  onRestartGame: () => void
  onNewGame: () => void
  canGoBack: boolean
}

export function GameControls({
  currentArticle,
  targetArticle,
  timeTaken,
  pathLength,
  onGoBack,
  onRestartGame,
  onNewGame,
  canGoBack,
}: GameControlsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2 md:gap-4">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Current:</span>
            <span className="truncate">{currentArticle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Target:</span>
            <span className="truncate">{targetArticle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Time:</span>
            <span>{formatTime(timeTaken)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Steps:</span>
            <span>{pathLength - 1}</span> {/* Subtract 1 for initial article */}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Button
            onClick={onGoBack}
            disabled={!canGoBack}
            variant="outline"
            className="flex items-center gap-1 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <Button onClick={onRestartGame} variant="outline" className="flex items-center gap-1 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline">Restart</span>
          </Button>
          <Button onClick={onNewGame} variant="outline" className="flex items-center gap-1 bg-transparent">
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">New Game</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
