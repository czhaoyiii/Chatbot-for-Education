"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import type { Course } from "@/types/chat"; // Import Course from types/chat

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  type: "pdf" | "doc" | "ppt" | "txt";
}

interface CourseFilesTabProps {
  course: Course; // Use the imported Course type
  onUpdateCourse: (course: Course) => void; // Use the imported Course type
  onNavigateToUpload: () => void;
  onBack: () => void;
}

export default function CourseFilesTab({
  course,
  onUpdateCourse,
  onNavigateToUpload,
  onBack,
}: CourseFilesTabProps) {
  // Mock files for this specific course
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "doc":
        return "📝";
      case "ppt":
        return "📊";
      default:
        return "📄";
    }
  };

  const handleDeleteClick = (file: UploadedFile) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id));
      const updatedCourse = { ...course, filesCount: course.filesCount - 1 };
      onUpdateCourse(updatedCourse);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setFileToDelete(null);
  };

  return (
    <>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Course Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {course.code}
              </span>
              <h1 className="text-2xl font-bold text-foreground">
                {course.name}
              </h1>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Course Materials
              </h2>
              <p className="text-muted-foreground">
                Manage all uploaded files for this course
              </p>
            </div>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={onNavigateToUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Files
            </Button>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No files uploaded yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading course materials like lectures, assignments,
                and lab exercises.
              </p>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={onNavigateToUpload}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/50">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-6">File Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Upload Date</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="px-6 py-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 flex items-center space-x-3">
                        <span className="text-xl">
                          {getFileIcon(file.type)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {file.type} file
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {file.size}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {file.uploadDate}
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteClick(file)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Delete File
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelDelete}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{fileToDelete?.name}"? This
                action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleConfirmDelete}
                >
                  Delete File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
