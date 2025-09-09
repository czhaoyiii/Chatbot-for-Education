"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import type { Course } from "@/types/chat";
import { createCourseWithFiles } from "@/lib/upload-api";
import { useAuth } from "@/contexts/auth-context";

interface CreateCourseFormProps {
  onCreateCourse: (course: Omit<Course, "id" | "createdDate">) => void;
  onCancel: () => void;
  existingCourses: Course[];
}

export default function CreateCourseForm({
  onCreateCourse,
  onCancel,
  existingCourses,
}: CreateCourseFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error" | "uploading"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Course code is required";
    } else if (
      existingCourses.some(
        (course) => course.code.toLowerCase() === formData.code.toLowerCase()
      )
    ) {
      newErrors.code = "This course code already exists";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Course title is required";
    } else if (
      existingCourses.some(
        (course) => course.name.toLowerCase() === formData.name.toLowerCase()
      )
    ) {
      newErrors.name = "This course title already exists";
    }

    if (selectedFiles.length === 0) {
      newErrors.files = "At least one document must be uploaded";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset upload status
    setUploadStatus("idle");
    setUploadMessage("");

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadMessage("Uploading files and creating course...");

    try {
      if (!user?.email) {
        setUploadStatus("error");
        setUploadMessage("You must be logged in to create a course.");
        return;
      }

      const result = await createCourseWithFiles({
        code: formData.code.trim(),
        name: formData.name.trim(),
        userEmail: user.email,
        files: selectedFiles,
      });

      if (result.success) {
        // Reflect in local UI
        onCreateCourse({
          ...formData,
          semester: "",
          year: new Date().getFullYear().toString(),
          studentsCount: 0,
          filesCount: result.course.files_count,
          quizzesCount: result.course.quizzes_count,
          lastModified: new Date().toISOString().split("T")[0],
        });

        setUploadStatus("success");
        setUploadMessage(result.message || "Course created successfully!");

        // Reset form
        setSelectedFiles([]);
        setFormData({ code: "", name: "" });
        setErrors({});
      } else {
        const errMsg =
          "error" in result ? result.error : "Failed to create course.";
        setUploadStatus("error");
        setUploadMessage(errMsg);

        // Handle specific error types
        if ("errorType" in result && result.errorType === "DUPLICATE_CODE") {
          setErrors((prev) => ({
            ...prev,
            code: "This course code already exists. Please use a different course code.",
          }));
          setUploadStatus("idle"); // Clear the general error status
          setUploadMessage(""); // Clear the general error message
        } else if (
          "errorType" in result &&
          result.errorType === "DUPLICATE_NAME"
        ) {
          setErrors((prev) => ({
            ...prev,
            name: "This course name already exists. Please use a different course name.",
          }));
          setUploadStatus("idle"); // Clear the general error status
          setUploadMessage(""); // Clear the general error message
        } else {
          setErrors((prev) => ({
            ...prev,
            files: errMsg,
          }));
        }
      }
    } catch (error) {
      setUploadStatus("error");
      const errorMessage = `An unexpected error occurred: ${
        error instanceof Error ? error.message : String(error)
      }`;

      // Check if it's a duplicate course code error
      if (
        errorMessage.includes(
          "duplicate key value violates unique constraint"
        ) &&
        errorMessage.includes("courses_code_key")
      ) {
        setErrors((prev) => ({
          ...prev,
          code: "This course code already exists. Please use a different course code.",
        }));
        setUploadStatus("idle");
        setUploadMessage("");
      } else if (
        errorMessage.includes(
          "duplicate key value violates unique constraint"
        ) &&
        errorMessage.includes("courses_name_key")
      ) {
        setErrors((prev) => ({
          ...prev,
          name: "This course name already exists. Please use a different course name.",
        }));
        setUploadStatus("idle");
        setUploadMessage("");
      } else {
        setUploadMessage(errorMessage);
        setErrors((prev) => ({ ...prev, files: errorMessage }));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files).filter((file) => {
      // Validate file type
      const validTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType = validTypes.includes(fileExtension);

      // Validate file size (10MB limit)
      const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;

      if (!isValidType) {
        setUploadStatus("error");
        setUploadMessage(
          `File type not supported: ${file.name}. Supported: PDF, DOC, DOCX, PPT, PPTX, TXT.`
        );
        return false;
      }
      if (!isValidSize) {
        setUploadStatus("error");
        setUploadMessage(`File too large: ${file.name}. Max size: 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Clear file upload error if files are added
    if (newFiles.length > 0 && errors.files) {
      setErrors((prev) => ({ ...prev, files: "" }));
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset status if all files are removed
    if (selectedFiles.length === 1) {
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Create New Course
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the details for your new course
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="courseCode"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Course Code *
                  </label>
                  <input
                    id="courseCode"
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      handleInputChange("code", e.target.value.toUpperCase())
                    }
                    placeholder="e.g., CZ4055"
                    className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.code ? "border-red-500" : "border-border"
                    }`}
                    maxLength={10}
                    disabled={isUploading}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500 mt-1">{errors.code}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="courseName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Course Title *
                  </label>
                  <input
                    id="courseName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Cyber Physical System Security"
                    className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-border"
                    }`}
                    maxLength={100}
                    disabled={isUploading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
              </div>

              {/* Upload Materials Section */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Upload Materials *
                </h3>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : errors.files || uploadStatus === "error"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="mb-4">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-base font-medium text-foreground mb-2">
                      {dragActive
                        ? "Drop files here"
                        : "Upload course materials"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload at least one document to create your course
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isUploading}
                  />

                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 10MB
                    per file)
                  </p>
                </div>
                {errors.files && (
                  <p className="text-sm text-red-500 mt-2">{errors.files}</p>
                )}

                {/* Upload Status Message */}
                {uploadStatus !== "idle" && uploadMessage && (
                  <div
                    className={`mt-4 p-3 rounded-lg flex items-center space-x-3 ${
                      uploadStatus === "success"
                        ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                        : uploadStatus === "error"
                        ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                        : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {uploadStatus === "success" && (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {uploadStatus === "error" && (
                      <XCircle className="w-5 h-5" />
                    )}
                    {uploadStatus === "uploading" && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    <p className="text-sm font-medium">{uploadMessage}</p>
                  </div>
                )}

                {/* Selected Files Display */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📄</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(1)} MB •
                                Ready to upload
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveFile(index)}
                              disabled={isUploading}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isUploading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
