import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")

  if (!title) {
    return NextResponse.json({ error: "Article title is required" }, { status: 400 })
  }

  try {
    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`
    const response = await fetch(wikipediaApiUrl)

    if (!response.ok) {
      // Check for specific Wikipedia API errors
      const errorData = await response.json().catch(() => null)
      if (errorData && errorData.error && errorData.error.code === "missingtitle") {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }
      throw new Error(`Wikipedia API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.info }, { status: 404 })
    }

    if (!data.parse || !data.parse.text) {
      return NextResponse.json({ error: "No content found for this article." }, { status: 404 })
    }

    // Wikipedia API returns HTML content in data.parse.text['*']
    const htmlContent = data.parse.text["*"]

    return NextResponse.json({ html: htmlContent })
  } catch (error) {
    console.error("Error fetching Wikipedia article:", error)
    return NextResponse.json({ error: "Failed to fetch article content." }, { status: 500 })
  }
}
