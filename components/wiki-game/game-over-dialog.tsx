"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle } from "lucide-react"
import type { GameStatus } from "@/app/page"
import { PathDisplay } from "@/components/wiki-game/path-display"

interface GameOverDialogProps {
  gameStatus: GameStatus
  startArticle: string
  targetArticle: string
  path: string[]
  timeTaken: number
  onPlayAgain: () => void
  onNewGame: () => void
}

export function GameOverDialog({
  gameStatus,
  startArticle,
  targetArticle,
  path,
  timeTaken,
  onPlayAgain,
  onNewGame,
}: GameOverDialogProps) {
  const isWon = gameStatus === "won"
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={gameStatus === "won" || gameStatus === "lost"}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-col items-center text-center">
          {isWon ? (
            <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="mb-4 h-16 w-16 text-red-500" />
          )}
          <DialogTitle className="text-3xl font-bold">{isWon ? "Quest Complete!" : "Quest Failed!"}</DialogTitle>
          <DialogDescription className="text-md">
            {isWon
              ? `You successfully navigated from "${startArticle}" to "${targetArticle}"!`
              : `You did not reach "${targetArticle}" from "${startArticle}".`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-lg font-semibold">Steps</div>
              <div className="text-2xl">{path.length - 1}</div>
            </div>
            <div>
              <div className="text-lg font-semibold">Time</div>
              <div className="text-2xl">{formatTime(timeTaken)}</div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-center">Your Journey:</h3>
          <div className="max-h-60 overflow-y-auto rounded-md border p-2">
            <PathDisplay path={path} />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-2">
          <Button onClick={onNewGame} variant="outline">
            Start New Quest
          </Button>
          <Button onClick={onPlayAgain}>Play Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
