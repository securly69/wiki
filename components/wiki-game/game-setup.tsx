"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { gameLevels } from "@/lib/game-data"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface GameSetupProps {
  onStartGame: (startArticle: string, targetArticle: string) => void
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("easy")
  const [customStart, setCustomStart] = useState<string>("")
  const [customTarget, setCustomTarget] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleStartClick = async () => {
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
      // Validate if articles exist before starting
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

        onStartGame(finalStartArticle, finalTargetArticle)
      } catch (error) {
        console.error("Article validation error:", error)
        toast({
          title: "Article Not Found",
          description:
            "One or both of the specified articles could not be found on Wikipedia. Please check spelling or try different articles.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      toast({
        title: "Error",
        description: "Could not determine start and target articles.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Choose Your Quest</CardTitle>
        
      </CardHeader>
      <CardContent className="grid gap-6">
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

        <Button onClick={handleStartClick} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Quest...
            </>
          ) : (
            "Start Quest"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
