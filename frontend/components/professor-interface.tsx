"use client";

import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileText, ClipboardList } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import CreateCourseForm from "./professor/create-course-form";
import CourseManagement from "./professor/course-management";
import type { Course } from "@/types/chat"; // Import Course from types/chat

export default function ProfessorInterface() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "create-course" | "manage-course"
  >("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Mock courses data - professors might have multiple courses
  const [courses, setCourses] = useState<Course[]>([]);

  const handleCreateCourse = (
    newCourse: Omit<Course, "id" | "createdDate">
  ) => {
    const course: Course = {
      ...newCourse,
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split("T")[0],
    };
    setCourses((prev) => [course, ...prev]);
    setCurrentView("dashboard");
  };

  const handleManageCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("manage-course");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedCourse(null);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === updatedCourse.id ? updatedCourse : course
      )
    );
    setSelectedCourse(updatedCourse);
  };

  // Dashboard View
  if (currentView === "dashboard") {
    return (
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent p-6">
          {courses.length === 0 ? (
            // Empty state for new professors
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to EduChat Professor Dashboard
                </h2>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first course. You can upload
                  materials, create quizzes, and manage student interactions.
                </p>
                <Button
                  onClick={() => setCurrentView("create-course")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            </div>
          ) : (
            // Course grid
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Your Courses ({courses.length})
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Click on any course to manage files, create quizzes, and
                    view student activity
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setCurrentView("create-course")}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Course
                  </Button>
                  <Link href="/chat">
                    <Button variant="outline" size="sm">
                      Back to Chat
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 cursor-pointer group"
                    onClick={() => handleManageCourse(course)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {course.code}
                      </span>
                      <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    </div>

                    {/* Course Title */}
                    <h3 className="font-semibold text-foreground mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>

                    {/* Stats - Matching the provided design */}
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-foreground">
                            {course.filesCount}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Files
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-foreground">
                            {course.quizzesCount}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Quizzes
                          </span>
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
    );
  }

  // Create Course View
  if (currentView === "create-course") {
    return (
      <CreateCourseForm
        onCreateCourse={handleCreateCourse}
        onCancel={handleBackToDashboard}
        existingCourses={courses}
      />
    );
  }

  // Course Management View
  if (currentView === "manage-course" && selectedCourse) {
    return (
      <CourseManagement
        course={selectedCourse}
        onBack={handleBackToDashboard}
        onUpdateCourse={handleUpdateCourse}
      />
    );
  }

  return null;
}
