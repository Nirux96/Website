import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.MESHY_API_KEY

    // Test if the API key works by making a simple request to the Meshy API
    if (apiKey && apiKey !== "your-api-key") {
      try {
        const response = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        // If the response is 401 or 403, the API key is invalid
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json({
            isSet: false,
            message: "API key is invalid",
          })
        }

        return NextResponse.json({
          isSet: true,
        })
      } catch (error) {
        console.error("Error testing API key:", error)
        // If there's an error testing the API key, assume it's set but might not work
        return NextResponse.json({
          isSet: true,
          warning: "API key is set but could not be verified",
        })
      }
    }

    return NextResponse.json({
      isSet: false,
    })
  } catch (error) {
    console.error("Error in check-api-key route:", error)
    return NextResponse.json({
      isSet: false,
      error: "Failed to check API key",
    })
  }
}

