import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
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
