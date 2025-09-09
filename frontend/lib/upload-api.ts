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
  errorType?: "DUPLICATE_CODE" | "DUPLICATE_NAME" | "VALIDATION_ERROR";
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
  ingestion_result?: string;
  status?: "processing" | "completed";
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

    // Parse specific database errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Handle duplicate course code error
    if (
      errorMessage.includes("duplicate key value violates unique constraint") &&
      errorMessage.includes("courses_code_key")
    ) {
      return {
        success: false,
        error:
          "This course code already exists. Please use a different course code.",
        errorType: "DUPLICATE_CODE",
      };
    }

    // Handle duplicate course name error
    if (
      errorMessage.includes("duplicate key value violates unique constraint") &&
      errorMessage.includes("courses_name_key")
    ) {
      return {
        success: false,
        error:
          "This course name already exists. Please use a different course name.",
        errorType: "DUPLICATE_NAME",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface UploadToExistingCourseResponse {
  success: boolean;
  message: string;
  course: {
    id: string;
    code?: string;
    name?: string;
    created_by?: string;
    files_count?: number;
    quizzes_count?: number;
    created_at?: string;
  };
  files: Array<{ filename: string; size: number }>;
  ingestion_result?: string;
  status?: "processing" | "completed";
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

export interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  created_at: string;
}

export interface QuizTopic {
  id: string;
  course_id: string;
  topic_name: string;
  created_at: string;
  questions: QuizQuestion[];
  question_count: number;
}

export interface GetCourseQuizzesResponse {
  success: boolean;
  course_id: string;
  topics: QuizTopic[];
  total_topics: number;
  total_questions: number;
}

export async function getCourseQuizzes(
  courseId: string
): Promise<GetCourseQuizzesResponse | UploadError> {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/courses/${courseId}/quizzes`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.error || "Failed to fetch quizzes");
    }
    return data as GetCourseQuizzesResponse;
  } catch (error) {
    console.error("Get course quizzes API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteQuizTopic(params: {
  courseId: string;
  topicId: string;
  userEmail: string;
}): Promise<{ success: boolean; message?: string } | UploadError> {
  try {
    const { courseId, topicId, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}`,
      {
        method: "DELETE",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to delete quiz topic"
      );
    }
    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error("Delete quiz topic API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateQuizTopic(params: {
  courseId: string;
  topicId: string;
  topicName: string;
  userEmail: string;
}): Promise<{ success: boolean; message?: string } | UploadError> {
  try {
    const { courseId, topicId, topicName, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);
    formData.append("topic_name", topicName);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to update quiz topic"
      );
    }
    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error("Update quiz topic API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getQuizTopicDetails(params: {
  courseId: string;
  topicId: string;
}): Promise<
  | { success: boolean; topic: QuizTopic & { questions: QuizQuestion[] } }
  | UploadError
> {
  try {
    const { courseId, topicId } = params;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}/details`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to get quiz details"
      );
    }
    return data as {
      success: boolean;
      topic: QuizTopic & { questions: QuizQuestion[] };
    };
  } catch (error) {
    console.error("Get quiz details API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateQuizQuestion(params: {
  courseId: string;
  topicId: string;
  questionId: string;
  question: Partial<QuizQuestion>;
  userEmail: string;
}): Promise<{ success: boolean; message?: string } | UploadError> {
  try {
    const { courseId, topicId, questionId, question, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);

    if (question.question_text)
      formData.append("question_text", question.question_text);
    if (question.option_a) formData.append("option_a", question.option_a);
    if (question.option_b) formData.append("option_b", question.option_b);
    if (question.option_c) formData.append("option_c", question.option_c);
    if (question.option_d) formData.append("option_d", question.option_d);
    if (question.correct_answer)
      formData.append("correct_answer", question.correct_answer);
    if (question.explanation)
      formData.append("explanation", question.explanation);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}/questions/${questionId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to update quiz question"
      );
    }
    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error("Update quiz question API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function createQuizQuestion(params: {
  courseId: string;
  topicId: string;
  question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
  };
  userEmail: string;
}): Promise<
  { success: boolean; question?: QuizQuestion; message?: string } | UploadError
> {
  try {
    const { courseId, topicId, question, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);
    formData.append("question_text", question.question_text);
    formData.append("option_a", question.option_a);
    formData.append("option_b", question.option_b);
    formData.append("option_c", question.option_c);
    formData.append("option_d", question.option_d);
    formData.append("correct_answer", question.correct_answer);
    formData.append("explanation", question.explanation);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}/questions`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to create quiz question"
      );
    }
    return data as {
      success: boolean;
      question?: QuizQuestion;
      message?: string;
    };
  } catch (error) {
    console.error("Create quiz question API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteQuizQuestion(params: {
  courseId: string;
  topicId: string;
  questionId: string;
  userEmail: string;
}): Promise<{ success: boolean; message?: string } | UploadError> {
  try {
    const { courseId, topicId, questionId, userEmail } = params;
    const formData = new FormData();
    formData.append("user_email", userEmail);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/courses/${courseId}/quizzes/${topicId}/questions/${questionId}`,
      {
        method: "DELETE",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to delete quiz question"
      );
    }
    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error("Delete quiz question API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function createQuizTopic(params: {
  courseId: string;
  topicName: string;
  userEmail: string;
}): Promise<
  { success: boolean; topic?: QuizTopic; message?: string } | UploadError
> {
  try {
    const { courseId, topicName, userEmail } = params;
    const formData = new FormData();
    formData.append("topic_name", topicName);
    formData.append("user_email", userEmail);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/courses/${courseId}/quizzes`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.detail || data.error || "Failed to create quiz topic"
      );
    }
    return data as { success: boolean; topic?: QuizTopic; message?: string };
  } catch (error) {
    console.error("Create quiz topic API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
