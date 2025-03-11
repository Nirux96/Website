import { type NextRequest, NextResponse } from "next/server"

// This proxy endpoint will fetch resources from external URLs to avoid CORS issues
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Get the full path from the URL
    const path = params.path.join("/")

    // Get the URL from the searchParams
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Decode the URL (it might be encoded to avoid issues with special characters)
    const decodedUrl = decodeURIComponent(url)

    // Fetch the resource
    const response = await fetch(decodedUrl, {
      headers: {
        // Pass through the authorization header if it exists
        ...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization")! } : {}),
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch resource: ${response.statusText}` },
        { status: response.status },
      )
    }

    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "application/octet-stream"

    // Get the response as an array buffer
    const buffer = await response.arrayBuffer()

    // Return the response with the correct content type
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error("Error in proxy route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

