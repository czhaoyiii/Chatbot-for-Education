export type AnswerLetter = "A" | "B" | "C" | "D";

export interface QuizQuestion {
  id: string; // UUID
  course_id: string; // UUID
  created_by: string; // UUID
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: AnswerLetter;
  explanation?: string;
  source_chunk_id?: string; // UUID
  created_at: string; // ISO timestamp
}
