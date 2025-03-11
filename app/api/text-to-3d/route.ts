import { type NextRequest, NextResponse } from "next/server"

// Replace with your actual API key
const MESHY_API_KEY = process.env.MESHY_API_KEY || "your-api-key"
const MESHY_API_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Text-to-3D API request:", body)

    // Validate request body
    if (!body.mode) {
      return NextResponse.json({ error: "Mode is required" }, { status: 400 })
    }

    if (body.mode === "preview" && !body.prompt) {
      return NextResponse.json({ error: "Prompt is required for preview mode" }, { status: 400 })
    }

    if (body.mode === "refine" && !body.preview_task_id) {
      return NextResponse.json({ error: "Preview task ID is required for refine mode" }, { status: 400 })
    }

    // Forward the request to Meshy API
    console.log("Forwarding request to Meshy API:", MESHY_API_URL)
    const response = await fetch(MESHY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MESHY_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Meshy API error:", errorData)
      return NextResponse.json({ error: errorData.message || "Failed to create task" }, { status: response.status })
    }

    const data = await response.json()
    console.log("Meshy API response:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in text-to-3d API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

// Update the GET function to handle non-JSON responses better
export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("id")

    if (!taskId) {
      // Check if API key is valid before making the request
      if (!MESHY_API_KEY || MESHY_API_KEY === "your-api-key") {
        return NextResponse.json([], { status: 200 }) // Return empty array instead of error
      }

      // List tasks
      const response = await fetch(`${MESHY_API_URL}`, {
        headers: {
          Authorization: `Bearer ${MESHY_API_KEY}`,
        },
      })

      // Handle rate limiting and other non-JSON responses
      if (response.status === 429) {
        console.warn("Rate limit exceeded for Meshy API")
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorData = {}

        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          errorData = JSON.parse(errorText)
        } catch (e) {
          // If it's not valid JSON, use the text as the error message
          errorData = { message: errorText }
        }

        console.error("Meshy API error:", errorData)
        return NextResponse.json([], { status: 200 }) // Return empty array instead of error
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Unexpected content type from Meshy API:", contentType)
        return NextResponse.json([], { status: 200 })
      }

      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Get specific task
      const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
        headers: {
          Authorization: `Bearer ${MESHY_API_KEY}`,
        },
      })

      // Handle rate limiting and other non-JSON responses
      if (response.status === 429) {
        console.warn("Rate limit exceeded for Meshy API")
        return NextResponse.json(
          {
            id: taskId,
            status: "PENDING",
            progress: 0,
            task_error: { message: "Rate limit exceeded. Please try again later." },
          },
          { status: 200 },
        )
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to get task"

        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If it's not valid JSON, use the text as the error message
          errorMessage = errorText || errorMessage
        }

        return NextResponse.json(
          {
            id: taskId,
            status: "FAILED",
            progress: 0,
            task_error: { message: errorMessage },
          },
          { status: 200 },
        )
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Unexpected content type from Meshy API:", contentType)
        return NextResponse.json(
          {
            id: taskId,
            status: "FAILED",
            progress: 0,
            task_error: { message: "Unexpected response from server" },
          },
          { status: 200 },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Error in text-to-3d API route:", error)
    return NextResponse.json(
      [], // Return empty array for list requests
      { status: 200 },
    )
  }
}

