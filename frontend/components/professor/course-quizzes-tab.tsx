"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getCourseQuizzes,
  deleteQuizTopic,
  updateQuizTopic,
  getQuizTopicDetails,
  updateQuizQuestion,
  createQuizQuestion,
  deleteQuizQuestion,
  createQuizTopic,
  type QuizTopic,
  type QuizQuestion,
} from "@/lib/upload-api";
import { toast } from "sonner";
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
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<
    (QuizTopic & { questions: QuizQuestion[] }) | null
  >(null);
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [creatingNewQuestion, setCreatingNewQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as "A" | "B" | "C" | "D",
    explanation: "",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalQuiz, setOriginalQuiz] = useState<
    (QuizTopic & { questions: QuizQuestion[] }) | null
  >(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [newQuizTopicName, setNewQuizTopicName] = useState("");
  const [creatingQuizTopic, setCreatingQuizTopic] = useState(false);
  const lastCourseId = useRef<string>("");

  useEffect(() => {
    // Only reload quizzes when the course ID actually changes, not on every course update
    if (lastCourseId.current !== course.id) {
      lastCourseId.current = course.id;
      loadQuizzes();
    }
  }, [course.id]);

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  const handleEditTopic = async (quiz: QuizTopic) => {
    try {
      setLoading(true);
      const response = await getQuizTopicDetails({
        courseId: course.id,
        topicId: quiz.id,
      });

      if (response.success) {
        setEditingQuiz(response.topic);
        setOriginalQuiz(JSON.parse(JSON.stringify(response.topic))); // Deep copy
        setEditingTopicId(quiz.id);
        setHasUnsavedChanges(false);
      } else {
        setError((response as any).error || "Failed to load quiz details");
      }
    } catch (err) {
      setError("Failed to load quiz details");
      console.error("Error loading quiz details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopicName = async (newName: string) => {
    if (!user?.email || !editingQuiz || !newName.trim()) {
      return;
    }

    setEditingQuiz((prev) =>
      prev ? { ...prev, topic_name: newName.trim() } : null
    );
    setHasUnsavedChanges(true);
  };

  const handleUpdateQuestion = async (
    questionId: string,
    updates: Partial<QuizQuestion>
  ) => {
    if (!editingQuiz) {
      return;
    }

    setEditingQuiz((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleCreateQuestion = async () => {
    setShowAddQuestionModal(true);
  };

  const handleAddQuestionToList = () => {
    if (!newQuestion.text.trim()) {
      toast.error("Question text is required");
      return;
    }

    const newQuestionObj = {
      id: `temp-${Date.now()}`, // Temporary ID
      question_text: newQuestion.text,
      option_a: newQuestion.optionA,
      option_b: newQuestion.optionB,
      option_c: newQuestion.optionC,
      option_d: newQuestion.optionD,
      correct_answer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation,
      topic_id: editingQuiz!.id,
      created_at: new Date().toISOString(),
    };

    setEditingQuiz((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: [...prev.questions, newQuestionObj as QuizQuestion],
      };
    });

    // Reset the form and close modal
    setNewQuestion({
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      explanation: "",
    });

    setShowAddQuestionModal(false);
    setHasUnsavedChanges(true);
    toast.success("Question added (click Save Changes to persist)");
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setEditingQuiz((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      };
    });

    setHasUnsavedChanges(true);
    toast.success("Question removed (click Save to persist)");
  };

  const handleSaveChanges = async () => {
    if (!user?.email || !editingQuiz || !originalQuiz) {
      return;
    }

    // Ask for confirmation before saving
    if (
      !confirm(
        "Are you sure you want to save all changes? This will update the quiz in the database."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Save topic name if changed
      if (editingQuiz.topic_name !== originalQuiz.topic_name) {
        const response = await updateQuizTopic({
          courseId: course.id,
          topicId: editingQuiz.id,
          topicName: editingQuiz.topic_name,
          userEmail: user.email,
        });

        if (!response.success) {
          throw new Error(
            (response as any).error || "Failed to update quiz topic"
          );
        }
      }

      // Handle question updates and deletions
      for (const originalQuestion of originalQuiz.questions) {
        const currentQuestion = editingQuiz.questions.find(
          (q) => q.id === originalQuestion.id
        );

        if (!currentQuestion) {
          // Question was deleted
          await deleteQuizQuestion({
            courseId: course.id,
            topicId: editingQuiz.id,
            questionId: originalQuestion.id,
            userEmail: user.email,
          });
        } else if (
          JSON.stringify(currentQuestion) !== JSON.stringify(originalQuestion)
        ) {
          // Question was updated
          await updateQuizQuestion({
            courseId: course.id,
            topicId: editingQuiz.id,
            questionId: currentQuestion.id,
            question: currentQuestion,
            userEmail: user.email,
          });
        }
      }

      // Handle new questions
      for (const question of editingQuiz.questions) {
        if (question.id.startsWith("temp-")) {
          // This is a new question
          const result = await createQuizQuestion({
            courseId: course.id,
            topicId: editingQuiz.id,
            question: {
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              explanation: question.explanation,
            },
            userEmail: user.email,
          });

          if ("question" in result && result.question) {
            // Update the question with the real ID
            setEditingQuiz((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                questions: prev.questions.map((q) =>
                  q.id === question.id ? result.question! : q
                ),
              };
            });
          }
        }
      }

      // Update the local quizzes list
      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.id === editingQuiz.id
            ? {
                ...quiz,
                topic_name: editingQuiz.topic_name,
                question_count: editingQuiz.questions.length,
              }
            : quiz
        )
      );

      setHasUnsavedChanges(false);
      setOriginalQuiz(JSON.parse(JSON.stringify(editingQuiz))); // Update original
      toast.success("Changes saved successfully!");

      // Return to main quiz list without confirmation
      setEditingTopicId(null);
      setEditingQuiz(null);
      setOriginalQuiz(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelChanges = () => {
    if (
      hasUnsavedChanges &&
      !confirm("Are you sure you want to discard your changes?")
    ) {
      return;
    }

    // Reset to original state and return to main list without calling handleCancelEdit
    setEditingTopicId(null);
    setEditingQuiz(null);
    setOriginalQuiz(null);
    setCreatingNewQuestion(false);
    setHasUnsavedChanges(false);
    setNewQuestion({
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      explanation: "",
    });
    toast.info("Changes discarded");
  };

  const handleSaveEdit = async (topicId: string) => {
    // This function is now handled by handleSaveChanges
    setEditingTopicId(null);
    setEditingQuiz(null);
    setOriginalQuiz(null);
    setHasUnsavedChanges(false);
  };

  const handleCreateNewQuiz = () => {
    setShowCreateQuizModal(true);
  };

  const handleCreateQuizTopic = async () => {
    if (!user?.email || !newQuizTopicName.trim()) {
      toast.error("Quiz topic name is required");
      return;
    }

    if (!confirm(`Create new quiz topic: "${newQuizTopicName}"?`)) {
      return;
    }

    try {
      setCreatingQuizTopic(true);
      const response = await createQuizTopic({
        courseId: course.id,
        topicName: newQuizTopicName.trim(),
        userEmail: user.email,
      });

      if ("topic" in response && response.topic) {
        toast.success("Quiz topic created successfully!");

        // Add the new topic to the quizzes list
        const newTopic: QuizTopic = {
          ...response.topic,
          question_count: 0,
        };
        setQuizzes((prev) => [...prev, newTopic]);

        // Update course quiz count
        const updatedCourse = {
          ...course,
          quizzesCount: course.quizzesCount + 1,
        };
        onUpdateCourse(updatedCourse);

        // Reset form and close modal
        setNewQuizTopicName("");
        setShowCreateQuizModal(false);

        // Optionally, open the new quiz for editing
        setTimeout(() => {
          handleEditTopic(newTopic);
        }, 500);
      } else {
        toast.error("Failed to create quiz topic");
      }
    } catch (error) {
      console.error("Error creating quiz topic:", error);
      toast.error("Failed to create quiz topic");
    } finally {
      setCreatingQuizTopic(false);
    }
  };

  const handleCancelEdit = () => {
    if (
      hasUnsavedChanges &&
      !confirm("Are you sure you want to discard your changes?")
    ) {
      return;
    }

    setEditingTopicId(null);
    setEditingQuiz(null);
    setOriginalQuiz(null);
    setCreatingNewQuestion(false);
    setHasUnsavedChanges(false);
    setNewQuestion({
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      explanation: "",
    });
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
      <div
        className={`max-w-6xl mx-auto transition-all duration-300 ${
          showAddQuestionModal || showCreateQuizModal ? "blur-sm" : ""
        }`}
      >
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
            <Button
              onClick={handleCreateNewQuiz}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {editingQuiz ? (
          <div className="bg-card border border-border rounded-lg">
            {/* Header with topic name */}
            <div className="p-6 border-b border-border">
              <div className="flex-1">
                <input
                  type="text"
                  value={editingQuiz.topic_name}
                  onChange={(e) => {
                    setEditingQuiz((prev) =>
                      prev ? { ...prev, topic_name: e.target.value } : null
                    );
                    setHasUnsavedChanges(true);
                  }}
                  className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-background focus:border focus:border-border rounded px-2 py-1 w-full"
                />
                <p className="text-muted-foreground mt-2">
                  {editingQuiz.questions.length} questions • Created{" "}
                  {formatDate(editingQuiz.created_at)}
                  {hasUnsavedChanges && (
                    <span className="text-orange-500 ml-2">
                      • Unsaved changes
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCreateQuestion}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelChanges}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges || loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="p-6 space-y-6">
              {editingQuiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      Question {index + 1}
                      {question.id.startsWith("temp-") && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Question
                    </label>
                    <textarea
                      value={question.question_text}
                      onChange={(e) => {
                        setEditingQuiz((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            questions: prev.questions.map((q) =>
                              q.id === question.id
                                ? { ...q, question_text: e.target.value }
                                : q
                            ),
                          };
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {["A", "B", "C", "D"].map((option) => {
                      const optionKey =
                        `option_${option.toLowerCase()}` as keyof QuizQuestion;
                      const isCorrect = question.correct_answer === option;

                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Option {option}
                            </label>
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={isCorrect}
                              onChange={() => {
                                handleUpdateQuestion(question.id, {
                                  correct_answer: option,
                                });
                                setHasUnsavedChanges(true);
                              }}
                              className="text-green-600"
                            />
                            <span className="text-xs text-muted-foreground">
                              {isCorrect && "Correct"}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={question[optionKey] as string}
                            onChange={(e) => {
                              setEditingQuiz((prev) => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  questions: prev.questions.map((q) =>
                                    q.id === question.id
                                      ? { ...q, [optionKey]: e.target.value }
                                      : q
                                  ),
                                };
                              });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Explanation
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => {
                        setEditingQuiz((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            questions: prev.questions.map((q) =>
                              q.id === question.id
                                ? { ...q, explanation: e.target.value }
                                : q
                            ),
                          };
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : quizzes.length === 0 ? (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleEditTopic(quiz)}
                      disabled={editingTopicId === quiz.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTopic(quiz.id)}
                      disabled={
                        deletingTopicId === quiz.id ||
                        editingTopicId === quiz.id
                      }
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

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddQuestionModal(false);
              setNewQuestion({
                text: "",
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
                correctAnswer: "A",
                explanation: "",
              });
            }
          }}
        >
          <div className="bg-white/95 dark:bg-card/95 mt-10 backdrop-blur-md rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Question</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setNewQuestion({
                    text: "",
                    optionA: "",
                    optionB: "",
                    optionC: "",
                    optionD: "",
                    correctAnswer: "A",
                    explanation: "",
                  });
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Question *
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded bg-background text-foreground resize-none text-sm ${
                    !newQuestion.text.trim()
                      ? "border-red-300"
                      : "border-border"
                  }`}
                  rows={2}
                  placeholder="Enter your question here..."
                />
                {!newQuestion.text.trim() && (
                  <p className="text-red-500 text-xs mt-1">
                    Question text is required
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {["A", "B", "C", "D"].map((option) => {
                  const optionKey =
                    `option${option}` as keyof typeof newQuestion;
                  const isCorrect = newQuestion.correctAnswer === option;

                  return (
                    <div key={option} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={isCorrect}
                          onChange={() =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              correctAnswer: option as "A" | "B" | "C" | "D",
                            }))
                          }
                          className="text-green-600"
                        />
                        <label className="text-sm font-medium text-muted-foreground">
                          Option {option} {isCorrect && "(Correct)"}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newQuestion[optionKey]}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            [optionKey]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                        placeholder={`Enter option ${option}...`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground resize-none text-sm"
                  rows={2}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setNewQuestion({
                    text: "",
                    optionA: "",
                    optionB: "",
                    optionC: "",
                    optionD: "",
                    correctAnswer: "A",
                    explanation: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddQuestionToList}
                disabled={!newQuestion.text.trim()}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Quiz Modal */}
      {showCreateQuizModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateQuizModal(false);
              setNewQuizTopicName("");
            }
          }}
        >
          <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-lg p-6 w-full max-w-md shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Quiz</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateQuizModal(false);
                  setNewQuizTopicName("");
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Quiz Topic Name *
                </label>
                <input
                  type="text"
                  value={newQuizTopicName}
                  onChange={(e) => setNewQuizTopicName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded bg-background text-foreground text-sm ${
                    !newQuizTopicName.trim()
                      ? "border-red-300"
                      : "border-border"
                  }`}
                  placeholder="Enter quiz topic name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newQuizTopicName.trim()) {
                      handleCreateQuizTopic();
                    }
                  }}
                />
                {!newQuizTopicName.trim() && (
                  <p className="text-red-500 text-xs mt-1">
                    Topic name is required
                  </p>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  This will create an empty quiz topic. You can add questions
                  after creation.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateQuizModal(false);
                  setNewQuizTopicName("");
                }}
                disabled={creatingQuizTopic}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuizTopic}
                disabled={!newQuizTopicName.trim() || creatingQuizTopic}
                className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingQuizTopic ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quiz"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
