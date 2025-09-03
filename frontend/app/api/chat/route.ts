import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, userId, userEmail, courseCode, courseId, sessionId } =
      await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Call backend chat endpoint to persist & generate response
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8000";
    const response = await fetch(`${backendUrl}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        user_id: userId,
        user_email: userEmail,
        course_code: courseCode,
        course_id: courseId,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from AI",
        success: false,
      },
      { status: 500 }
    );
  }
}

// Handles DELETE /api/chat?sessions=[sessionId]
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessions");
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const resp = await fetch(`${backendUrl}/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });

  const data = await resp.json();
  if (!resp.ok) {
    return NextResponse.json(
      { error: data.error || "Failed to delete session" },
      { status: resp.status }
    );
  }

  return NextResponse.json({ success: true });
}
