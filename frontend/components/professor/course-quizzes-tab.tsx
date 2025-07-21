"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Eye } from "lucide-react";
import { useState } from "react";
import type { Course } from "@/types/chat"; // Import Course from types/chat

interface Quiz {
  id: string;
  title: string;
  questions: number;
  createdDate: string;
  status: "active" | "draft" | "archived";
}

interface CourseQuizzesTabProps {
  course: Course; // Use the imported Course type
  onUpdateCourse: (course: Course) => void; // Use the imported Course type
}

export default function CourseQuizzesTab({
  course,
  onUpdateCourse,
}: CourseQuizzesTabProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Course Quizzes
            </h2>
            <p className="text-muted-foreground">
              Create and manage quizzes for {course.code} - {course.name}
            </p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No quizzes created yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first quiz to assess student understanding of the
              course material.
            </p>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Quiz
            </Button>
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
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(
                      quiz.status
                    )}`}
                  ></div>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {quiz.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {quiz.questions} questions • Created {quiz.createdDate}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {quiz.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
