"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { PathDisplay } from "@/components/wiki-game/path-display"
import { GameControls } from "@/components/wiki-game/game-controls"
import { useToast } from "@/hooks/use-toast"

interface GameBoardProps {
  startArticle: string
  targetArticle: string
  currentArticle: string
  path: string[]
  timeTaken: number
  onArticleNavigate: (articleTitle: string) => void
  onGoBack: () => void
  onRestartGame: () => void
  onNewGame: () => void
}

export function GameBoard({
  startArticle,
  targetArticle,
  currentArticle,
  path,
  timeTaken,
  onArticleNavigate,
  onGoBack,
  onRestartGame,
  onNewGame,
}: GameBoardProps) {
  const [articleContent, setArticleContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const fetchArticle = useCallback(
    async (title: string) => {
      setIsLoading(true)
      setArticleContent("") // Clear content while loading
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
    fetchArticle(currentArticle)
  }, [currentArticle, fetchArticle])

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === "A" && target.getAttribute("href")) {
        const href = target.getAttribute("href")!
        // Check if it's an internal Wikipedia link
        if (href.startsWith("/wiki/")) {
          const articleTitle = decodeURIComponent(href.substring(6)).replace(/_/g, " ")
          // Filter out special pages, files, categories, etc.
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
            event.preventDefault() // Prevent default browser navigation
            onArticleNavigate(articleTitle)
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
  }, [onArticleNavigate])

  const progressPercentage = Math.min(100, (path.length / 10) * 100) // Example progress based on steps

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
      <div className="flex flex-col gap-4">
        <GameControls
          currentArticle={currentArticle}
          targetArticle={targetArticle}
          timeTaken={timeTaken}
          pathLength={path.length}
          onGoBack={onGoBack}
          onRestartGame={onRestartGame}
          onNewGame={onNewGame}
          canGoBack={path.length > 1}
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
            <h3 className="mb-2 text-lg font-semibold">Progress</h3>
            <Progress value={progressPercentage} className="w-full" />
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Steps: {path.length}</div>
          </CardContent>
        </Card>
        <PathDisplay path={path} />
      </div>
    </div>
  )
}
