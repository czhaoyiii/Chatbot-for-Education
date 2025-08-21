interface UserResponse {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  user?: UserResponse;
  message?: string;
  error?: string;
}

export async function loginUser(email: string): Promise<ApiResponse> {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    const response = await fetch(`${backendUrl}/user-management`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email, // Removed name field, only sending email as required by simplified backend
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to login user");
    }

    const userData: UserResponse = await response.json();

    return {
      success: true,
      user: userData, // Backend now returns UserResponse directly, not wrapped in user field
      message: "User login successful",
    };
  } catch (error) {
    console.error("User API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getUserData(email: string): Promise<ApiResponse> {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    const response = await fetch(`${backendUrl}/user-management`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch user data");
    }

    const userData: UserResponse = await response.json();

    return {
      success: true,
      user: userData,
      message: "User data fetched successfully",
    };
  } catch (error) {
    console.error("Get user data error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/`);
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}
