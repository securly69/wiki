import { NextResponse } from "next/server"

export async function GET() {
  try {
    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`
    const response = await fetch(wikipediaApiUrl)

    if (!response.ok) {
      throw new Error(`Wikipedia API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.query && data.query.random && data.query.random.length > 0) {
      const randomTitle = data.query.random[0].title
      return NextResponse.json({ title: randomTitle })
    } else {
      return NextResponse.json({ error: "No random article found." }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching random Wikipedia article:", error)
    return NextResponse.json({ error: "Failed to fetch random article." }, { status: 500 })
  }
}
