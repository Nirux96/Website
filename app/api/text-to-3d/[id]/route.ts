import { type NextRequest, NextResponse } from "next/server";

// Replace with your actual API key
const MESHY_API_KEY =
  process.env.MESHY_API_KEY || "msy_hOTTaG1zq19y1XJdhaUGPab9xHnROK5HXxJy";
const MESHY_API_URL = "https://api.meshy.ai/openapi/v2/text-to-3d";

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ id?: string }> } // Note: params is now a Promise
) {
  try {
    // Await the params object to resolve it
    const resolvedParams = await context?.params;
    const taskId = resolvedParams?.id;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Check if API key is valid
    if (!MESHY_API_KEY || MESHY_API_KEY === "your-api-key") {
      return NextResponse.json(
        { error: "API key not configured", status: "FAILED" },
        { status: 200 }
      );
    }

    const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
      },
    });

    // Handle rate limiting and other non-JSON responses
    if (response.status === 429) {
      console.warn("Rate limit exceeded for Meshy API");
      return NextResponse.json(
        {
          id: taskId,
          status: "PENDING",
          progress: 0,
          task_error: {
            message: "Rate limit exceeded. Please try again later.",
          },
        },
        { status: 200 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to get task";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        {
          id: taskId,
          status: "FAILED",
          progress: 0,
          task_error: { message: errorMessage },
        },
        { status: 200 }
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Unexpected content type from Meshy API:", contentType);
      return NextResponse.json(
        {
          id: taskId,
          status: "PENDING",
          progress: 0,
          task_error: { message: "Unexpected response from server" },
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in text-to-3d API route:", error);
    return NextResponse.json(
      {
        id: (await context?.params)?.id, // Await params here too
        status: "FAILED",
        progress: 0,
        task_error: {
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        },
      },
      { status: 200 }
    );
  }
}

