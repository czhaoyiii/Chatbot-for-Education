"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Eye, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getCourseQuizzes,
  deleteQuizTopic,
  type QuizTopic,
} from "@/lib/upload-api";
import type { Course } from "@/types/chat";

interface CourseQuizzesTabProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

export default function CourseQuizzesTab({
  course,
  onUpdateCourse,
}: CourseQuizzesTabProps) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastCourseId = useRef<string>("");

  useEffect(() => {
    // Only reload quizzes when the course ID actually changes, not on every course update
    if (lastCourseId.current !== course.id) {
      lastCourseId.current = course.id;
      loadQuizzes();
    }
  }, [course.id]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseQuizzes(course.id);

      if (response.success) {
        setQuizzes(response.topics);
        // Don't automatically update course quiz count - let the upload process handle it
        // This prevents overriding fresh quiz counts from uploads with potentially stale data
      } else {
        setError((response as any).error || "Failed to load quizzes");
      }
    } catch (err) {
      setError("Failed to load quizzes");
      console.error("Error loading quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (
      !user?.email ||
      !confirm(
        "Are you sure you want to delete this quiz topic? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingTopicId(topicId);
      const response = await deleteQuizTopic({
        courseId: course.id,
        topicId,
        userEmail: user.email,
      });

      if (response.success) {
        // Remove the deleted topic from the list
        setQuizzes((prev) => prev.filter((quiz) => quiz.id !== topicId));
        // Update course quiz count
        const updatedCourse = {
          ...course,
          quizzesCount: Math.max(0, course.quizzesCount - 1),
        };
        onUpdateCourse(updatedCourse);
      } else {
        setError((response as any).error || "Failed to delete quiz topic");
      }
    } catch (err) {
      setError("Failed to delete quiz topic");
      console.error("Error deleting quiz topic:", err);
    } finally {
      setDeletingTopicId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading quizzes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Course Quizzes
            </h2>
            <p className="text-muted-foreground">
              Manage quizzes for {course.code} - {course.name}
            </p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No quizzes available yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first quiz to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {course.code}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {quiz.topic_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {quiz.question_count} questions • Created{" "}
                  {formatDate(quiz.created_at)}
                </p>

                <div className="flex items-center justify-between">
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTopic(quiz.id)}
                      disabled={deletingTopicId === quiz.id}
                    >
                      {deletingTopicId === quiz.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quizzes.length > 0 && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Topics:</span>
                <p className="font-medium">{quizzes.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Questions:</span>
                <p className="font-medium">
                  {quizzes.reduce((sum, quiz) => sum + quiz.question_count, 0)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg per Topic:</span>
                <p className="font-medium">
                  {quizzes.length > 0
                    ? Math.round(
                        quizzes.reduce(
                          (sum, quiz) => sum + quiz.question_count,
                          0
                        ) / quizzes.length
                      )
                    : 0}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Latest:</span>
                <p className="font-medium">
                  {quizzes.length > 0
                    ? formatDate(
                        new Date(
                          Math.max(
                            ...quizzes.map((q) =>
                              new Date(q.created_at).getTime()
                            )
                          )
                        ).toISOString()
                      )
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
