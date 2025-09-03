interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  session_id?: string;
  thinking_time?: number;
}

export async function sendChatMessage(
  message: string,
  context?: {
    userId?: string;
    userEmail?: string;
    courseCode?: string;
    courseId?: string;
    sessionId?: string;
  }
): Promise<ChatResponse> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, ...(context || {}) }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send message");
    }

    return data;
  } catch (error) {
    console.error("Chat API error:", error);
    return {
      response: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export interface SessionItem {
  id: string;
  title: string;
  module?: string; // course code
  createdAt: string;
}

export async function fetchUserSessions(params: {
  userId?: string;
  userEmail?: string;
}): Promise<SessionItem[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const query = new URLSearchParams();
  if (params.userId) query.set("user_id", params.userId);
  if (params.userEmail) query.set("user_email", params.userEmail);
  const resp = await fetch(`${backendUrl}/chat/sessions?${query.toString()}`);
  if (!resp.ok) throw new Error(`Failed to fetch sessions (${resp.status})`);
  const data = await resp.json();
  const sessions = (data.sessions || []) as Array<any>;
  return sessions.map((s) => ({
    id: s.id,
    title:
      s.title || (s.course ? `${s.course.code} - ${s.course.name}` : "Chat"),
    module: s.course?.code,
    createdAt: s.created_at,
  }));
}

export interface SessionMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  thinkingTime?: number;
  createdAt: string;
}

export async function fetchSessionMessages(
  sessionId: string
): Promise<SessionMessage[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const resp = await fetch(`${backendUrl}/chat/sessions/${sessionId}/messages`);
  if (!resp.ok) throw new Error(`Failed to fetch messages (${resp.status})`);
  const data = await resp.json();
  const messages = (data.messages || []) as Array<any>;
  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    sender: m.sender,
    thinkingTime: m.thinking_time ?? undefined,
    createdAt: m.created_at,
  }));
}

export async function deleteChatSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const resp = await fetch(`/api/chat?sessions=${sessionId}`, {
    method: "DELETE",
  });
  const data = await resp.json();
  if (!resp.ok) {
    return { success: false, error: data.error || "Failed to delete session" };
  }
  return { success: true };
}
