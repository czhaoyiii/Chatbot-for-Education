"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import {
  getQuestionsByModule,
  getRandomQuestions,
  getAllModules,
  getTopicsByModule,
  type QuizQuestion,
} from "@/data/quiz-questions";
import Image from "next/image";

interface QuizInterfaceProps {
  currentModule?: string;
  onBack?: () => void;
}

type QuizMode = "all" | "random5";
type QuizState = "setup" | "active" | "completed";

export default function QuizInterface({
  currentModule,
  onBack,
}: QuizInterfaceProps) {
  const [selectedModule, setSelectedModule] = useState<string>(
    currentModule || ""
  );
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [quizMode, setQuizMode] = useState<QuizMode>("random5");
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auto-select first topic when module changes
  useEffect(() => {
    if (selectedModule) {
      const topics = getTopicsByModule(selectedModule);
      setSelectedTopic(topics.length > 0 ? topics[0] : "");
    } else {
      setSelectedTopic("");
    }
  }, [selectedModule]);

  const modules = getAllModules();
  const availableTopics = selectedModule
    ? getTopicsByModule(selectedModule)
    : [];

  const handleStartQuiz = () => {
    if (!selectedModule) return;

    const moduleQuestions =
      quizMode === "all"
        ? getQuestionsByModule(selectedModule)
        : getRandomQuestions(selectedModule, 5);

    if (moduleQuestions.length === 0) return;

    setQuestions(moduleQuestions);
    setQuizState("active");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === questions[currentQuestionIndex].correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizState("completed");
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    // Immediately start the quiz for the selected module
    const moduleQuestions =
      quizMode === "all"
        ? getQuestionsByModule(selectedModule)
        : getRandomQuestions(selectedModule, 5);
    if (moduleQuestions.length === 0) return;
    setQuestions(moduleQuestions);
    setQuizState("active");
  };

  const handleBackToSetup = () => {
    setSelectedModule("");
    setQuizState("setup");
  };

  const getSelectedModuleInfo = () => {
    return modules.find((m) => m.code === selectedModule);
  };

  const getQuestionCount = () => {
    if (!selectedModule) return 0;
    return quizMode === "all" ? getQuestionsByModule(selectedModule).length : 5;
  };

  // Quiz Setup Screen - Match the provided design exactly with scrolling
  if (quizState === "setup") {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <div className="text-center max-w-2xl px-4 animate-fade-in">
              <div className="mb-6">
                <Image
                  src="/logo.png"
                  alt="EduChat Logo"
                  width={64}
                  height={64}
                  className="mx-auto mb-4 shadow-2xl rounded-full"
                />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Welcome to EduQuiz!
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Select a module to start quiz.
              </p>
              {/* Module Dropdown */}
              <div className="relative mb-8">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 text-base"
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    if (!dropdownOpen) setTopicDropdownOpen(false); // Close topic dropdown when opening module dropdown
                  }}
                >
                  {selectedModule
                    ? `${selectedModule} - ${getSelectedModuleInfo()?.name}`
                    : "Choose a module..."}
                  <ChevronDown className="w-5 h-5 ml-2" />
                </Button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
                    {modules.map((module) => (
                      <button
                        key={module.code}
                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-200 first:rounded-t-md last:rounded-b-md"
                        onClick={() => {
                          setSelectedModule(module.code);
                          setDropdownOpen(false);
                          setTopicDropdownOpen(false); // Also close topic dropdown when switching module
                        }}
                      >
                        {module.code} - {module.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Topic Selection */}
              {selectedModule && (
                <div className="relative mb-8">
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 text-base bg-transparent"
                    onClick={() => {
                      setTopicDropdownOpen(!topicDropdownOpen);
                      if (!topicDropdownOpen) setDropdownOpen(false); // Close module dropdown when opening topic dropdown
                    }}
                  >
                    {selectedTopic || "Choose a topic..."}
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>

                  {topicDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
                      {availableTopics.map((topic) => (
                        <button
                          key={topic}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-200 first:rounded-t-md last:rounded-b-md"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setTopicDropdownOpen(false);
                          }}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Start Quiz Button */}
              <Button
                onClick={handleStartQuiz}
                disabled={!selectedModule}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Quiz
              </Button>

              {/* Back Button */}
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="w-full mt-4 bg-transparent text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chats
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Completed Screen
  if (quizState === "completed") {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <div className="text-center max-w-2xl animate-fade-in">
              <div className="mb-8">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${
                    percentage >= 80
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : percentage >= 60
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}
                >
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                  Quiz Complete!
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Here's how you performed on {selectedModule}
                </p>
              </div>

              <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm max-w-md mx-auto">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-foreground mb-2">
                      {percentage}%
                    </div>
                    <div className="text-muted-foreground">
                      {score} out of {questions.length} correct
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quiz mode:</span>
                      <span className="text-foreground">
                        {quizMode === "all" ? "Complete Module" : "Quick Quiz"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="text-foreground">{percentage}%</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button
                      onClick={handleRestartQuiz}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBackToSetup}
                      className="w-full bg-transparent text-foreground"
                    >
                      Choose Different Module
                    </Button>
                    {onBack && (
                      <Button
                        variant="outline"
                        onClick={onBack}
                        className="w-full bg-transparent text-foreground"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz Screen
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Quiz Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Score: {score}/{questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg animate-slide-up">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {selectedModule}
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed text-foreground">
                {currentQuestion.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "A", text: currentQuestion.optionA },
                { key: "B", text: currentQuestion.optionB },
                { key: "C", text: currentQuestion.optionC },
                { key: "D", text: currentQuestion.optionD },
              ].map((option) => (
                <Button
                  key={option.key}
                  variant="outline"
                  className={`w-full text-left justify-start p-4 h-auto transition-all duration-200 text-foreground ${
                    selectedAnswer === option.key
                      ? option.key === currentQuestion.correctAnswer
                        ? "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-950 text-green-500 dark:text-green-300 disabled:opacity-100"
                        : "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-300 disabled:opacity-100"
                      : showResult &&
                        option.key === currentQuestion.correctAnswer
                      ? "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-950 text-green-500 dark:text-green-300 disabled:opacity-100"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handleAnswerSelect(option.key)}
                  disabled={showResult}
                >
                  <div className="flex items-center w-full">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium mr-3">
                      {option.key}
                    </span>
                    <span className="flex-1 text-sm leading-relaxed">
                      {option.text}
                    </span>
                    {showResult &&
                      selectedAnswer === option.key &&
                      (option.key === currentQuestion.correctAnswer ? (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 ml-2" />
                      ))}
                    {showResult &&
                      selectedAnswer !== option.key &&
                      option.key === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                      )}
                  </div>
                </Button>
              ))}

              {showResult && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg animate-fade-in">
                  <h4 className="font-semibold text-foreground mb-2">
                    Explanation:
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {showResult && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    {currentQuestionIndex < questions.length - 1
                      ? "Next Question"
                      : "Finish Quiz"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
