import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Call your backend API
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const response = await fetch(`${backendUrl}/query?q=${encodeURIComponent(message)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    // Get the raw text response
    const rawData = await response.text()

    // Remove surrounding quotes if they exist
    let cleanedData = rawData
    if (rawData.startsWith('"') && rawData.endsWith('"')) {
      cleanedData = rawData.slice(1, -1)
    }

    // Unescape any escaped quotes
    cleanedData = cleanedData.replace(/\\"/g, '"')

    // Convert literal \n to actual newlines
    cleanedData = cleanedData.replace(/\\n/g, "\n")

    return NextResponse.json({
      response: cleanedData,
      success: true,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to get response from AI",
        success: false,
      },
      { status: 500 },
    )
  }
}
