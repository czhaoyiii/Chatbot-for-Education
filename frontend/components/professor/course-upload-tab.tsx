"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import type { Course } from "@/types/chat";
import { uploadFiles } from "@/lib/upload-api";

interface CourseUploadTabProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

export default function CourseUploadTab({
  course,
  onUpdateCourse,
}: CourseUploadTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error" | "uploading"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Validate file type (matching backend's supported types)
      const validTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidType = validTypes.includes(fileExtension);

      // Validate file size (matching backend's 10MB limit)
      const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
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
    // Reset status messages when new files are added
    if (newFiles.length > 0) {
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset status messages if all files are removed
    if (selectedFiles.length === 1) {
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("error");
      setUploadMessage("Please select files to upload.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadMessage("Uploading files...");

    try {
      const result = await uploadFiles(selectedFiles);

      if (result.success) {
        const newFilesCount = course.filesCount + selectedFiles.length;
        const updatedCourse = {
          ...course,
          filesCount: newFilesCount,
        };
        onUpdateCourse(updatedCourse);
        setSelectedFiles([]);
        setUploadStatus("success");
        setUploadMessage(result.message || "Files uploaded successfully!");

        // Clear success message after 5 seconds
        setTimeout(() => {
          setUploadStatus("idle");
          setUploadMessage("");
        }, 5000);
      } else {
        setUploadStatus("error");
        setUploadMessage(result.error || "Failed to upload files.");
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(
        `An unexpected error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Upload Materials
          </h2>
          <p className="text-muted-foreground">
            Upload new course materials for {course.code} - {course.name}
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : uploadStatus === "error"
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
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {dragActive ? "Drop files here" : "Upload course materials"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to select files for{" "}
              {course.code}
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
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
            Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 10MB per
            file)
          </p>
        </div>

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
            {uploadStatus === "success" && <CheckCircle className="w-5 h-5" />}
            {uploadStatus === "error" && <XCircle className="w-5 h-5" />}
            {uploadStatus === "uploading" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <p className="text-sm font-medium">{uploadMessage}</p>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Selected Files ({selectedFiles.length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  Will be uploaded to: {course.code} - {course.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-red-500 hover:text-red-600"
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUploadFiles}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={isUploading || selectedFiles.length === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} File
                      {selectedFiles.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB • Ready to
                        upload
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveSelected(index)}
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
    </div>
  );
}
