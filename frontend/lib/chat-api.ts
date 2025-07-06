interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
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
