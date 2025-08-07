interface UploadResponse {
  success: boolean;
  message: string;
  files: Array<{
    filename: string;
    path: string;
    size: number;
  }>;
  ingestion_result: string;
}

interface UploadError {
  success: false;
  error: string;
}

export async function uploadFiles(
  files: File[]
): Promise<UploadResponse | UploadError> {
  try {
    const formData = new FormData();

    // Add all files to FormData
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("http://localhost:8000/upload-files", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to upload files");
    }

    return data;
  } catch (error) {
    console.error("Upload API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:8000/health");
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}
