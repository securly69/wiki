import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface PathDisplayProps {
  path: string[]
}

export function PathDisplay({ path }: PathDisplayProps) {
  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">Your Path</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] overflow-y-auto p-4">
        <ol className="space-y-2">
          {path.map((article, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white dark:bg-blue-600">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{article}</span>
              {index < path.length - 1 && (
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
