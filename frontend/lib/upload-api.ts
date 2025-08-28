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

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/upload-files`, {
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
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/`);
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}

export interface CreateCourseResponse {
  success: boolean;
  message: string;
  course: {
    id: string;
    code: string;
    name: string;
    created_by: string;
    files_count: number;
    quizzes_count: number;
    created_at: string;
  };
  files: Array<{ filename: string; size: number }>;
  ingestion_result: string;
}

export async function createCourseWithFiles(params: {
  code: string;
  name: string;
  userEmail: string;
  files: File[];
}): Promise<CreateCourseResponse | UploadError> {
  try {
    const { code, name, userEmail, files } = params;
    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);
    formData.append("user_email", userEmail);
    files.forEach((file) => formData.append("files", file));

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/courses/create`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.error || "Failed to create course");
    }
    return data as CreateCourseResponse;
  } catch (error) {
    console.error("Create course API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export interface UploadToExistingCourseResponse {
  success: boolean;
  message: string;
  course: {
    id: string;
    code: string;
    name: string;
    created_by: string;
    files_count: number;
    quizzes_count: number;
    created_at: string;
  };
  files: Array<{ filename: string; size: number }>;
  ingestion_result: string;
}

export async function uploadFilesToExistingCourse(params: {
  courseId: string;
  userEmail: string;
  files: File[];
}): Promise<UploadToExistingCourseResponse | UploadError> {
  try {
    const { courseId, userEmail, files } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);
    files.forEach((file) => formData.append("files", file));

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/courses/${courseId}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.error || "Failed to upload files");
    }
    return data as UploadToExistingCourseResponse;
  } catch (error) {
    console.error("Upload to existing course API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteCourseApi(params: {
  courseId: string;
  userEmail: string;
}): Promise<{ success: boolean; message?: string } | UploadError> {
  try {
    const { courseId, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/courses/${courseId}/delete`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.error || "Failed to delete course");
    }
    return data as { success: boolean; message?: string };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
