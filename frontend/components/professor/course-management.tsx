"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  FileText,
  ClipboardList,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { deleteCourseApi } from "@/lib/upload-api";
import CourseFilesTab from "./course-files-tab";
import CourseQuizzesTab from "./course-quizzes-tab";
import CourseUploadTab from "./course-upload-tab";
import type { Course } from "@/types/chat"; // Import Course from types/chat

interface CourseManagementProps {
  course: Course; // Use the imported Course type
  onBack: () => void;
  onUpdateCourse: (course: Course) => void; // Use the imported Course type
  onDeleteCourse?: (courseId: string) => void; // optional callback to remove from list
}

export default function CourseManagement({
  course,
  onBack,
  onUpdateCourse,
  onDeleteCourse,
}: CourseManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "upload" | "files" | "quizzes" | "settings"
  >("files");
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCourse = async () => {
    if (!user?.email) return;
    try {
      setIsDeleting(true);
      const res = await deleteCourseApi({
        courseId: course.id,
        userEmail: user.email,
      });
      if (!res.success) throw new Error((res as any).error || "Delete failed");
      setShowDeleteCourseDialog(false);
      onDeleteCourse?.(course.id);
      onBack();
    } catch (e) {
      setShowDeleteCourseDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteCourse = () => {
    setShowDeleteCourseDialog(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === "files" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("files")}
                className={
                  activeTab === "files"
                    ? "bg-prof-foreground text-background hover:bg-chart-1"
                    : ""
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                Files ({course.filesCount})
              </Button>
              <Button
                variant={activeTab === "upload" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("upload")}
                className={
                  activeTab === "upload"
                    ? "bg-prof-foreground text-background hover:bg-chart-1"
                    : ""
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Materials
              </Button>
              <Button
                variant={activeTab === "quizzes" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("quizzes")}
                className={
                  activeTab === "quizzes"
                    ? "bg-prof-foreground text-background hover:bg-chart-1"
                    : ""
                }
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Quizzes ({course.quizzesCount || 0})
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("settings")}
                className={
                  activeTab === "settings"
                    ? "bg-prof-foreground text-background hover:bg-chart-1"
                    : ""
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {activeTab === "files" && (
            <CourseFilesTab
              course={course}
              onUpdateCourse={onUpdateCourse}
              onNavigateToUpload={() => setActiveTab("upload")}
              onBack={onBack}
            />
          )}
          {activeTab === "upload" && (
            <CourseUploadTab course={course} onUpdateCourse={onUpdateCourse} />
          )}
          {activeTab === "quizzes" && (
            <CourseQuizzesTab course={course} onUpdateCourse={onUpdateCourse} />
          )}
          {activeTab === "settings" && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
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

                <h2 className="text-xl font-bold text-foreground mb-6">
                  Course Settings
                </h2>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Danger Zone
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Once you delete a course, there is no going back. Please
                      be certain.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
                    onClick={() => setShowDeleteCourseDialog(true)}
                  >
                    Delete Course
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Course Confirmation Dialog */}
      {showDeleteCourseDialog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Delete Course
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelDeleteCourse}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{course.code} - {course.name}"?
                This will permanently remove the course and all its materials
                from the database. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleCancelDeleteCourse}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDeleteCourse}
                >
                  Delete Course
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
