"use client";

import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileText, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import CreateCourseForm from "./professor/create-course-form";
import CourseManagement from "./professor/course-management";
import type { Course } from "@/types/chat"; // Import Course from types/chat
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export default function ProfessorInterface() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<
    "dashboard" | "create-course" | "manage-course"
  >("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load courses for the logged-in professor
  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("courses")
          .select(
            "id, code, name, files_count, quizzes_count, created_at, created_by"
          )
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: Course[] = (data || []).map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          semester: "",
          year: new Date(c.created_at).getFullYear().toString(),
          studentsCount: 0,
          filesCount: c.files_count ?? 0,
          quizzesCount: c.quizzes_count ?? 0,
          createdDate: new Date(c.created_at).toISOString().split("T")[0],
          lastModified: new Date(c.created_at).toISOString().split("T")[0],
        }));

        setCourses(mapped);
      } catch (e: any) {
        setError(e?.message || "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user?.id]);

  const handleCreateCourse = (
    newCourse: Omit<Course, "id" | "createdDate">
  ) => {
    // Optimistic UI: add a temporary row, then refresh from DB
    const temp: Course = {
      id: `temp-${Date.now()}`,
      createdDate: new Date().toISOString().split("T")[0],
      semester: newCourse.semester ?? "",
      year: newCourse.year ?? new Date().getFullYear().toString(),
      studentsCount: newCourse.studentsCount ?? 0,
      lastModified:
        newCourse.lastModified ?? new Date().toISOString().split("T")[0],
      code: newCourse.code,
      name: newCourse.name,
      filesCount: newCourse.filesCount,
      quizzesCount: newCourse.quizzesCount,
    };
    setCourses((prev) => [temp, ...prev]);
    setCurrentView("dashboard");
    // Sync with server after creation completes
    (async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, code, name, files_count, quizzes_count, created_at")
          .eq("created_by", user?.id)
          .order("created_at", { ascending: false });
        if (!error && data) {
          const mapped: Course[] = data.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            semester: "",
            year: new Date(c.created_at).getFullYear().toString(),
            studentsCount: 0,
            filesCount: c.files_count ?? 0,
            quizzesCount: c.quizzes_count ?? 0,
            createdDate: new Date(c.created_at).toISOString().split("T")[0],
            lastModified: new Date(c.created_at).toISOString().split("T")[0],
          }));
          setCourses(mapped);
        }
      } catch {}
    })();
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Loading your courses...
                </h2>
                <p className="text-muted-foreground mb-6">
                  Please wait while we fetch your dashboard.
                </p>
              </div>
            </div>
          ) : courses.length === 0 ? (
            // Empty state for new professors
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to EduChat Professor Dashboard
                </h2>
                <p className="text-muted-foreground mb-6">
                  {error
                    ? `Error: ${error}`
                    : "Get started by creating your first course. You can upload materials, create quizzes, and manage student interactions."}
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
