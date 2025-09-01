"use client";

import QuizInterface from "@/components/quiz-interface";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const router = useRouter();
  return <QuizInterface onBack={() => router.push("/chat")} />;
}
